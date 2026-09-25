import React, { useState } from 'react';
import { DosHeaderFields, GeneratorOptions } from '../types/dos';
import { generateCHeader, generateNasmSource, generateDebugScript } from '../utils/mzEncoder';
import { Copy, Check, FileCode, Terminal, FileText, Layers } from 'lucide-react';
import { retroAudio } from '../utils/audio';

interface CodeExportersProps {
  binary: Uint8Array;
  headerFields: DosHeaderFields;
  options: GeneratorOptions;
}

export const CodeExporters: React.FC<CodeExportersProps> = ({
  binary,
  headerFields,
  options,
}) => {
  const [activeExport, setActiveExport] = useState<'c_header' | 'nasm' | 'debug_com' | 'base64' | 'raw_hex'>('c_header');
  const [copied, setCopied] = useState(false);

  // Generate contents
  const cCode = generateCHeader(headerFields, options.text, binary);
  const nasmCode = generateNasmSource(headerFields, options.text, options.mode);
  const debugScript = generateDebugScript(binary);

  // Base64
  let base64String = '';
  try {
    let binaryStr = '';
    for (let i = 0; i < binary.length; i++) {
      binaryStr += String.fromCharCode(binary[i]);
    }
    base64String = btoa(binaryStr);
  } catch {
    base64String = 'Error encoding Base64';
  }

  // Raw Hex
  const rawHex = Array.from(binary)
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');

  const getActiveCode = () => {
    switch (activeExport) {
      case 'c_header': return cCode;
      case 'nasm': return nasmCode;
      case 'debug_com': return debugScript;
      case 'base64': return base64String;
      case 'raw_hex': return rawHex;
    }
  };

  const copyToClipboard = () => {
    retroAudio.playTick();
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Exporter Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/90 border border-neutral-800 rounded-lg p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveExport('c_header')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${
              activeExport === 'c_header'
                ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-950'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>C / C++ Struct</span>
          </button>

          <button
            onClick={() => setActiveExport('nasm')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${
              activeExport === 'nasm'
                ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-950'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>NASM 16-Bit Assembly</span>
          </button>

          <button
            onClick={() => setActiveExport('debug_com')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${
              activeExport === 'debug_com'
                ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-950'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>MS-DOS DEBUG.COM Script</span>
          </button>

          <button
            onClick={() => setActiveExport('base64')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${
              activeExport === 'base64'
                ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-950'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Base64 Payload</span>
          </button>

          <button
            onClick={() => setActiveExport('raw_hex')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${
              activeExport === 'raw_hex'
                ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-950'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Raw Byte Stream</span>
          </button>
        </div>

        {/* Copy Button */}
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700 px-3 py-1.5 rounded text-xs font-semibold transition active:scale-95 shadow-sm"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied to Clipboard!' : 'Copy Snippet'}</span>
        </button>
      </div>

      {/* Code Viewer */}
      <div className="relative bg-neutral-950 border border-neutral-800 rounded-lg p-4 font-mono text-xs text-neutral-300 overflow-x-auto shadow-inner min-h-[420px]">
        <pre className="leading-relaxed whitespace-pre font-mono">
          {getActiveCode()}
        </pre>
      </div>
    </div>
  );
};
