import React, { useState } from 'react';
import { GeneratorOptions, GenerationMode } from '../types/dos';
import { Settings, Sliders, Info, Cpu, Check, AlertCircle } from 'lucide-react';
import { retroAudio } from '../utils/audio';

interface TextPayloadEditorProps {
  options: GeneratorOptions;
  setOptions: React.Dispatch<React.SetStateAction<GeneratorOptions>>;
  headerSize: number;
  fileSize: number;
  pages: number;
  lastPageBytes: number;
}

export const TextPayloadEditor: React.FC<TextPayloadEditorProps> = ({
  options,
  setOptions,
  headerSize,
  fileSize,
  pages,
  lastPageBytes,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOptions(prev => ({ ...prev, text: e.target.value }));
  };

  const setMode = (mode: GenerationMode) => {
    retroAudio.playTick();
    setOptions(prev => ({ ...prev, mode }));
  };

  const textByteLength = new TextEncoder().encode(options.text).length;

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-4 flex flex-col gap-4 shadow-sm">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <span>Input Text & Payload Definition</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Type the message to be embedded into the MS-DOS executable image
          </p>
        </div>

        {/* Character & Byte Counter */}
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <span>{options.text.length} chars</span>
          <span className="text-neutral-600">·</span>
          <span>{textByteLength} text bytes</span>
          <span className="text-neutral-600">·</span>
          <span className="text-amber-400 font-semibold">{fileSize} total bytes</span>
        </div>
      </div>

      {/* Text Area */}
      <div className="relative">
        <textarea
          value={options.text}
          onChange={handleTextChange}
          placeholder="Enter text to compile into MS-DOS EXE..."
          rows={5}
          spellCheck={false}
          className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 rounded p-3 font-mono text-xs sm:text-sm text-neutral-200 placeholder-neutral-600 resize-y transition focus:outline-none leading-relaxed"
        />
        {options.mode === 'slack_space' && textByteLength > 28 && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/40 border border-amber-800/60 rounded px-2 py-1 mt-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Slack space mode fits up to 28 bytes in standard reserved words. Extra bytes will overflow into body.</span>
          </div>
        )}
      </div>

      {/* Generation Mode Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-neutral-300">
          Target DOS Execution Architecture:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {/* Mode 1: INT 21h, AH=09h */}
          <button
            type="button"
            onClick={() => setMode('dos_int21_09')}
            className={`p-2.5 rounded border text-left transition flex flex-col gap-1 ${
              options.mode === 'dos_int21_09'
                ? 'bg-neutral-800/90 border-amber-500/60 text-neutral-100 shadow-sm'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-200">MS-DOS INT 21h (AH=09h)</span>
              {options.mode === 'dos_int21_09' && <span className="text-[10px] text-amber-400 font-mono">ACTIVE</span>}
            </div>
            <span className="text-[11px] text-neutral-400 leading-snug">
              Standard DOS string print. Fast, reliable, terminated by '$' (0x24).
            </span>
          </button>

          {/* Mode 2: INT 21h, AH=02h */}
          <button
            type="button"
            onClick={() => setMode('dos_int21_02')}
            className={`p-2.5 rounded border text-left transition flex flex-col gap-1 ${
              options.mode === 'dos_int21_02'
                ? 'bg-neutral-800/90 border-amber-500/60 text-neutral-100 shadow-sm'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-200">MS-DOS INT 21h (AH=02h Loop)</span>
              {options.mode === 'dos_int21_02' && <span className="text-[10px] text-amber-400 font-mono">ACTIVE</span>}
            </div>
            <span className="text-[11px] text-neutral-400 leading-snug">
              Iterates characters via SI pointer. Null-terminated (\0), handles any '$' signs.
            </span>
          </button>

          {/* Mode 3: BIOS INT 10h */}
          <button
            type="button"
            onClick={() => setMode('bios_int10')}
            className={`p-2.5 rounded border text-left transition flex flex-col gap-1 ${
              options.mode === 'bios_int10'
                ? 'bg-neutral-800/90 border-amber-500/60 text-neutral-100 shadow-sm'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-200">BIOS Video Teletype (INT 10h)</span>
              {options.mode === 'bios_int10' && <span className="text-[10px] text-amber-400 font-mono">ACTIVE</span>}
            </div>
            <span className="text-[11px] text-neutral-400 leading-snug">
              ROM BIOS 0x10 teletype output. Runs bare-metal without DOS kernel present.
            </span>
          </button>

          {/* Mode 4: Windows PE DOS Stub */}
          <button
            type="button"
            onClick={() => setMode('pe_stub')}
            className={`p-2.5 rounded border text-left transition flex flex-col gap-1 ${
              options.mode === 'pe_stub'
                ? 'bg-neutral-800/90 border-amber-500/60 text-neutral-100 shadow-sm'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-200">Windows PE DOS Stub</span>
              {options.mode === 'pe_stub' && <span className="text-[10px] text-amber-400 font-mono">ACTIVE</span>}
            </div>
            <span className="text-[11px] text-neutral-400 leading-snug">
              Canonical 64-byte DOS header with e_lfanew pointer matching MSVC output.
            </span>
          </button>

          {/* Mode 5: Slack Space Injection */}
          <button
            type="button"
            onClick={() => setMode('slack_space')}
            className={`p-2.5 rounded border text-left transition flex flex-col gap-1 ${
              options.mode === 'slack_space'
                ? 'bg-neutral-800/90 border-amber-500/60 text-neutral-100 shadow-sm'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-200">Steganographic Slack Space</span>
              {options.mode === 'slack_space' && <span className="text-[10px] text-amber-400 font-mono">ACTIVE</span>}
            </div>
            <span className="text-[11px] text-neutral-400 leading-snug">
              Hides ASCII payload inside e_res[4] and e_res2[10] reserved words.
            </span>
          </button>
        </div>
      </div>

      {/* Toggles & Options */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-800">
        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-300">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-neutral-100">
            <input
              type="checkbox"
              checked={options.appendCrLf}
              onChange={(e) => setOptions(prev => ({ ...prev, appendCrLf: e.target.checked }))}
              className="rounded bg-neutral-950 border-neutral-700 text-amber-500 focus:ring-0 focus:ring-offset-0"
            />
            <span>Append CRLF (\r\n)</span>
          </label>

          {options.mode === 'dos_int21_09' && (
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-neutral-100">
              <input
                type="checkbox"
                checked={options.dollarTerminate}
                onChange={(e) => setOptions(prev => ({ ...prev, dollarTerminate: e.target.checked }))}
                className="rounded bg-neutral-950 border-neutral-700 text-amber-500 focus:ring-0 focus:ring-offset-0"
              />
              <span>Auto '$' termination</span>
            </label>
          )}

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-neutral-100">
            <input
              type="checkbox"
              checked={options.includePeSignature}
              onChange={(e) => setOptions(prev => ({ ...prev, includePeSignature: e.target.checked }))}
              className="rounded bg-neutral-950 border-neutral-700 text-amber-500 focus:ring-0 focus:ring-offset-0"
            />
            <span>Set e_lfanew (PE pointer)</span>
          </label>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>{showAdvanced ? 'Hide Advanced Registers' : 'Tweak Header Registers'}</span>
        </button>
      </div>

      {/* Advanced MZ Header Fields Tweaker */}
      {showAdvanced && (
        <div className="p-3 bg-neutral-950 border border-neutral-800 rounded flex flex-col gap-3 text-xs">
          <div className="font-semibold text-neutral-200 flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Low-Level MZ Header Field Overrides</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Header Paragraphs (e_cparhdr):</label>
              <input
                type="number"
                min="2"
                max="16"
                value={options.headerParagraphs}
                onChange={(e) => setOptions(prev => ({ ...prev, headerParagraphs: Math.max(2, parseInt(e.target.value) || 4) }))}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 font-mono text-xs text-neutral-200"
              />
              <span className="text-[10px] text-neutral-500 mt-0.5 block">{options.headerParagraphs * 16} bytes total</span>
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Stack Size (e_sp):</label>
              <input
                type="number"
                step="16"
                min="64"
                max="4096"
                value={options.stackSize}
                onChange={(e) => setOptions(prev => ({ ...prev, stackSize: parseInt(e.target.value) || 512 }))}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 font-mono text-xs text-neutral-200"
              />
              <span className="text-[10px] text-neutral-500 mt-0.5 block">SP register at startup</span>
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Initial IP (e_ip):</label>
              <input
                type="number"
                min="0"
                max="65535"
                value={options.entryIp}
                onChange={(e) => setOptions(prev => ({ ...prev, entryIp: parseInt(e.target.value) || 0 }))}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 font-mono text-xs text-neutral-200"
              />
              <span className="text-[10px] text-neutral-500 mt-0.5 block">Entry point offset</span>
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Overlay (e_ovno):</label>
              <input
                type="number"
                min="0"
                max="255"
                value={options.customOverlay}
                onChange={(e) => setOptions(prev => ({ ...prev, customOverlay: parseInt(e.target.value) || 0 }))}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 font-mono text-xs text-neutral-200"
              />
              <span className="text-[10px] text-neutral-500 mt-0.5 block">0 for root executable</span>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Header Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2.5 bg-neutral-950/70 border border-neutral-800/80 rounded text-xs font-mono">
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Magic Word</span>
          <span className="text-cyan-400 font-semibold">0x5A4D ('MZ')</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Pages (e_cp)</span>
          <span className="text-purple-400 font-semibold">{pages} (512B blocks)</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Last Page (e_cblp)</span>
          <span className="text-purple-400 font-semibold">{lastPageBytes} bytes</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Header Size</span>
          <span className="text-amber-400 font-semibold">{headerSize} bytes ({headerSize / 16} paras)</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Entry Point</span>
          <span className="text-rose-400 font-semibold">CS:0000 / IP:{options.entryIp.toString(16).padStart(4, '0').toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};
