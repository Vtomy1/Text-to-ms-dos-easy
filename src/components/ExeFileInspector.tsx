import React, { useState } from 'react';
import { parseDosExe } from '../utils/mzEncoder';
import { Upload, FileUp, AlertCircle, CheckCircle, ArrowRight, FileQuestion } from 'lucide-react';
import { GeneratorOptions } from '../types/dos';
import { retroAudio } from '../utils/audio';

interface ExeFileInspectorProps {
  onImportText: (text: string) => void;
}

export const ExeFileInspector: React.FC<ExeFileInspectorProps> = ({ onImportText }) => {
  const [analyzedResult, setAnalyzedResult] = useState<ReturnType<typeof parseDosExe> | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    retroAudio.playFloppySeek();
    setFileName(file.name);
    setFileSize(file.size);

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (buffer) {
        const bytes = new Uint8Array(buffer);
        const res = parseDosExe(bytes);
        setAnalyzedResult(res);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* File Drop Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition flex flex-col items-center justify-center gap-3 ${
          isDragging
            ? 'border-amber-400 bg-amber-950/20'
            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/60'
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400">
          <Upload className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-neutral-200">
            Upload or Drag & Drop Any Real .EXE Binary
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-md">
            Inspect the DOS MZ header, extract embedded DOS stub strings, detect PE / NE / LE signatures, and verify header parameters.
          </p>
        </div>

        <label className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold px-4 py-2 rounded transition border border-neutral-700 active:scale-95 shadow-sm">
          <span>Browse .EXE File</span>
          <input
            type="file"
            accept=".exe,.bin,.com,.sys"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
      </div>

      {/* Analysis Results */}
      {analyzedResult && (
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-neutral-100">{fileName}</span>
                <span className="text-neutral-600">·</span>
                <span className="text-xs font-mono text-neutral-400">{fileSize} bytes</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs">
                {analyzedResult.isMz ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Valid MS-DOS MZ Executable (0x5A4D)</span>
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Not an MZ Executable (Missing 'MZ' signature)</span>
                  </span>
                )}
                <span className="text-neutral-600">·</span>
                <span className="font-mono text-amber-400 font-bold">
                  Format Type: {analyzedResult.subType}
                </span>
              </div>
            </div>

            {analyzedResult.extractedString && (
              <button
                onClick={() => onImportText(analyzedResult.extractedString)}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold px-3 py-1.5 rounded text-xs transition active:scale-95 shadow-sm"
              >
                <span>Import Text to Generator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Extracted String Banner */}
          {analyzedResult.extractedString && (
            <div className="p-3 bg-neutral-950 rounded border border-neutral-800 font-mono text-xs">
              <span className="text-neutral-500 text-[10px] block mb-1 uppercase tracking-wider font-semibold">
                Extracted Text String Payload:
              </span>
              <div className="text-amber-300 font-medium whitespace-pre-wrap break-words">
                {analyzedResult.extractedString}
              </div>
            </div>
          )}

          {/* MZ Header Metrics */}
          {analyzedResult.header && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
              <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800">
                <span className="text-[10px] text-neutral-500 block">Header Size</span>
                <span className="text-neutral-200 font-semibold">{analyzedResult.headerSize} bytes</span>
                <span className="text-[10px] text-neutral-500 block mt-0.5">({analyzedResult.header.e_cparhdr} paragraphs)</span>
              </div>
              <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800">
                <span className="text-[10px] text-neutral-500 block">Pages Count (e_cp)</span>
                <span className="text-purple-400 font-semibold">{analyzedResult.header.e_cp} (512B pages)</span>
                <span className="text-[10px] text-neutral-500 block mt-0.5">Last page: {analyzedResult.header.e_cblp}B</span>
              </div>
              <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800">
                <span className="text-[10px] text-neutral-500 block">Entry Point</span>
                <span className="text-rose-400 font-semibold">
                  0x{analyzedResult.header.e_cs.toString(16).padStart(4, '0')}:0x{analyzedResult.header.e_ip.toString(16).padStart(4, '0')}
                </span>
                <span className="text-[10px] text-neutral-500 block mt-0.5">CS:IP</span>
              </div>
              <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800">
                <span className="text-[10px] text-neutral-500 block">PE Header (e_lfanew)</span>
                <span className="text-cyan-400 font-semibold">
                  0x{analyzedResult.header.e_lfanew.toString(16).toUpperCase()}
                </span>
                <span className="text-[10px] text-neutral-500 block mt-0.5">Offset to PE/NE</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
