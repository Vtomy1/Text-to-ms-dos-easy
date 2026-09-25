import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, SkipForward, Terminal, Eye, Volume2 } from 'lucide-react';
import { CrtTheme, DosHeaderFields } from '../types/dos';
import { Dos8086VirtualMachine } from '../utils/dos8086Emulator';
import { retroAudio } from '../utils/audio';

interface DosVirtualScreenProps {
  binary: Uint8Array;
  headerFields: DosHeaderFields;
  crtTheme: CrtTheme;
}

export const DosVirtualScreen: React.FC<DosVirtualScreenProps> = ({
  binary,
  headerFields,
  crtTheme,
}) => {
  const [vm] = useState(() => new Dos8086VirtualMachine());
  const [screenLines, setScreenLines] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [cpu, setCpu] = useState(vm.cpu);
  const [isRunning, setIsRunning] = useState(false);
  const [scanlines, setScanlines] = useState(true);
  const [currentInstruction, setCurrentInstruction] = useState(() => vm.disassembleAt(vm.cpu.cs, vm.cpu.ip));

  // Initialize VM when binary changes
  useEffect(() => {
    vm.loadMzExecutable(binary, headerFields);
    updateState();
  }, [binary, headerFields]);

  const updateState = () => {
    setScreenLines([...vm.screenOutput]);
    setLogs([...vm.logMessages]);
    setCpu({ ...vm.cpu, flags: { ...vm.cpu.flags } });
    setCurrentInstruction(vm.disassembleAt(vm.cpu.cs, vm.cpu.ip));
  };

  const handleRun = () => {
    retroAudio.playFloppySeek();
    setIsRunning(true);
    // Execute full program
    const res = vm.run(10000);
    if (res.halted) {
      retroAudio.playBeep(980, 0.08);
    }
    updateState();
    setIsRunning(false);
  };

  const handleStep = () => {
    if (vm.cpu.halted) return;
    retroAudio.playTick();
    vm.step();
    updateState();
  };

  const handleReset = () => {
    retroAudio.playTick();
    vm.loadMzExecutable(binary, headerFields);
    updateState();
  };

  // Color classes for CRT theme
  const getThemeClasses = () => {
    switch (crtTheme) {
      case 'green':
        return {
          bg: 'bg-neutral-950',
          text: 'text-emerald-400',
          glow: 'crt-glow-green',
          border: 'border-emerald-800/40',
          badge: 'text-emerald-400 bg-emerald-950/60',
          cursor: 'bg-emerald-400',
        };
      case 'amber':
        return {
          bg: 'bg-neutral-950',
          text: 'text-amber-400',
          glow: 'crt-glow-amber',
          border: 'border-amber-800/40',
          badge: 'text-amber-400 bg-amber-950/60',
          cursor: 'bg-amber-400',
        };
      case 'dos_blue':
        return {
          bg: 'bg-[#0000AA]', // Classic IBM DOS blue screen
          text: 'text-neutral-200',
          glow: 'crt-glow-white',
          border: 'border-blue-700/60',
          badge: 'text-blue-200 bg-blue-900/60',
          cursor: 'bg-neutral-200',
        };
      case 'white':
      default:
        return {
          bg: 'bg-neutral-950',
          text: 'text-neutral-100',
          glow: 'crt-glow-white',
          border: 'border-neutral-800',
          badge: 'text-neutral-300 bg-neutral-900',
          cursor: 'bg-neutral-100',
        };
    }
  };

  const themeStyles = getThemeClasses();

  return (
    <div className="flex flex-col gap-4">
      {/* Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/90 border border-neutral-800 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleRun}
            disabled={cpu.halted}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition ${
              cpu.halted
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm active:scale-95'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>RUN IN DOS</span>
          </button>

          <button
            onClick={handleStep}
            disabled={cpu.halted}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition ${
              cpu.halted
                ? 'bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700 active:scale-95'
            }`}
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>STEP (1 OP)</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
        </div>

        {/* Scanlines Toggle & Status */}
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => setScanlines(!scanlines)}
            className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded border transition ${
              scanlines
                ? 'bg-neutral-800 border-neutral-700 text-neutral-200'
                : 'bg-neutral-950 border-neutral-800 text-neutral-500'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Scanlines: {scanlines ? 'ON' : 'OFF'}</span>
          </button>

          <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-400">
            <span>Cycles: {cpu.cycles}</span>
            <span className="text-neutral-600">·</span>
            <span className={cpu.halted ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
              {cpu.halted ? 'HALTED (INT 21h/4Ch)' : 'RUNNING (READY)'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Dual Grid: CRT Terminal Screen + Disassembly HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* CRT Virtual Terminal (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="relative rounded-lg border-2 border-neutral-800 overflow-hidden shadow-2xl bg-neutral-950 flex flex-col min-h-[340px]">
            {/* CRT Monitor Top Bar */}
            <div className="bg-neutral-900 border-b border-neutral-800 px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-neutral-400 select-none">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
                <span className="ml-1 text-neutral-300 font-semibold">IBM PC / MS-DOS 6.22 (80x25 Text Mode)</span>
              </div>
              <span>VIDEO INT 10h</span>
            </div>

            {/* CRT Screen Display Area */}
            <div className={`flex-1 p-4 ${themeStyles.bg} ${themeStyles.text} ${themeStyles.glow} font-crt text-lg sm:text-xl tracking-wider leading-snug relative overflow-auto select-text min-h-[280px]`}>
              {scanlines && <div className="crt-screen-overlay absolute inset-0 z-10" />}

              {/* Startup DOS banner */}
              <div className="text-sm opacity-70 mb-2 font-mono">
                Starting MS-DOS 6.22...<br />
                A:\&gt; OUTPUT.EXE
              </div>

              {/* Screen text buffer */}
              {screenLines.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap break-words min-h-[1.3em]">
                  {line}
                  {idx === screenLines.length - 1 && !cpu.halted && (
                    <span className={`inline-block w-2.5 h-4 ml-0.5 animate-pulse ${themeStyles.cursor}`} />
                  )}
                </div>
              ))}

              {cpu.halted && (
                <div className="mt-3 text-xs opacity-75 font-mono">
                  A:\&gt;<span className={`inline-block w-2.5 h-3.5 ml-0.5 animate-pulse ${themeStyles.cursor}`} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 8086 CPU Registers & Disassembly HUD (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Current Instruction HUD */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
              <span className="text-xs font-semibold text-neutral-200">Disassembly at CS:IP</span>
              <span className="text-[11px] font-mono text-amber-400">
                {cpu.cs.toString(16).padStart(4, '0').toUpperCase()}:{cpu.ip.toString(16).padStart(4, '0').toUpperCase()}
              </span>
            </div>

            <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800/80 font-mono text-xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold text-sm">
                  {currentInstruction.mnemonic} {currentInstruction.operands}
                </span>
                <span className="text-neutral-500 text-[11px]">
                  {currentInstruction.bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-snug">
                {currentInstruction.description}
              </p>
            </div>
          </div>

          {/* 8086 Register Matrix */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-3">
            <span className="text-xs font-semibold text-neutral-200 block border-b border-neutral-800 pb-2 mb-2.5">
              8086 CPU Registers (16-Bit Real Mode)
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {/* General Registers */}
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800/60 flex items-center justify-between">
                <span className="text-neutral-400">AX (AH:AL):</span>
                <span className="text-cyan-400 font-semibold">0x{cpu.ax.toString(16).padStart(4, '0').toUpperCase()}</span>
              </div>
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800/60 flex items-center justify-between">
                <span className="text-neutral-400">BX (BH:BL):</span>
                <span className="text-cyan-400 font-semibold">0x{cpu.bx.toString(16).padStart(4, '0').toUpperCase()}</span>
              </div>
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800/60 flex items-center justify-between">
                <span className="text-neutral-400">CX (CH:CL):</span>
                <span className="text-cyan-400 font-semibold">0x{cpu.cx.toString(16).padStart(4, '0').toUpperCase()}</span>
              </div>
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800/60 flex items-center justify-between">
                <span className="text-neutral-400">DX (DH:DL):</span>
                <span className="text-cyan-400 font-semibold">0x{cpu.dx.toString(16).padStart(4, '0').toUpperCase()}</span>
              </div>

              {/* Pointers & Indices */}
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800/60 flex items-center justify-between">
                <span className="text-neutral-400">SP (Stack):</span>
                <span className="text-emerald-400 font-semibold">0x{cpu.sp.toString(16).padStart(4, '0').toUpperCase()}</span>
              </div>
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800/60 flex items-center justify-between">
                <span className="text-neutral-400">BP (Base):</span>
                <span className="text-emerald-400 font-semibold">0x{cpu.bp.toString(16).padStart(4, '0').toUpperCase()}</span>
              </div>
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800/60 flex items-center justify-between">
                <span className="text-neutral-400">SI (Source):</span>
                <span className="text-emerald-400 font-semibold">0x{cpu.si.toString(16).padStart(4, '0').toUpperCase()}</span>
              </div>
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800/60 flex items-center justify-between">
                <span className="text-neutral-400">DI (Dest):</span>
                <span className="text-emerald-400 font-semibold">0x{cpu.di.toString(16).padStart(4, '0').toUpperCase()}</span>
              </div>

              {/* Segment Registers */}
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800/60 flex items-center justify-between">
                <span className="text-neutral-400">CS (Code):</span>
                <span className="text-rose-400 font-semibold">0x{cpu.cs.toString(16).padStart(4, '0').toUpperCase()}</span>
              </div>
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800/60 flex items-center justify-between">
                <span className="text-neutral-400">DS (Data):</span>
                <span className="text-amber-400 font-semibold">0x{cpu.ds.toString(16).padStart(4, '0').toUpperCase()}</span>
              </div>
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800/60 flex items-center justify-between">
                <span className="text-neutral-400">SS (Stack):</span>
                <span className="text-emerald-400 font-semibold">0x{cpu.ss.toString(16).padStart(4, '0').toUpperCase()}</span>
              </div>
              <div className="bg-neutral-950 p-2 rounded border border-neutral-800/60 flex items-center justify-between">
                <span className="text-neutral-400">ES (Extra):</span>
                <span className="text-purple-400 font-semibold">0x{cpu.es.toString(16).padStart(4, '0').toUpperCase()}</span>
              </div>
            </div>

            {/* Flags */}
            <div className="mt-2.5 pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-400">Status Flags:</span>
              <div className="flex items-center gap-3">
                <span className={cpu.flags.zf ? 'text-amber-400 font-bold' : 'text-neutral-600'}>ZF={cpu.flags.zf ? '1' : '0'}</span>
                <span className={cpu.flags.cf ? 'text-amber-400 font-bold' : 'text-neutral-600'}>CF={cpu.flags.cf ? '1' : '0'}</span>
                <span className={cpu.flags.sf ? 'text-amber-400 font-bold' : 'text-neutral-600'}>SF={cpu.flags.sf ? '1' : '0'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Log */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-3">
        <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 mb-1.5">
          <span>DOS & Interrupt Execution Log</span>
          <span className="text-[10px] font-mono text-neutral-500">{logs.length} events recorded</span>
        </div>
        <div className="bg-neutral-950 rounded p-2.5 font-mono text-[11px] text-neutral-400 max-h-32 overflow-y-auto space-y-1">
          {logs.length === 0 ? (
            <div className="text-neutral-600">No events yet. Press "RUN IN DOS" or "STEP".</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="leading-snug">
                <span className="text-neutral-600">[{idx + 1}]</span> {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
