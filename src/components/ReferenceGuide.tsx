import React from 'react';
import { BookOpen, Cpu, Shield, History, Terminal, FileCode2 } from 'lucide-react';

export const ReferenceGuide: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 text-neutral-300 text-xs sm:text-sm leading-relaxed max-w-4xl mx-auto">
      {/* Intro Hero */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2.5 text-amber-400 font-semibold text-base">
          <History className="w-5 h-5" />
          <span>The Story of Mark Zbikowski & The MZ Executable Format</span>
        </div>
        <p>
          In 1983, Microsoft engineer <strong>Mark Zbikowski</strong> designed the MS-DOS 2.0 executable file format to replace the crude flat memory model of CP/M-style <code className="font-mono bg-neutral-950 px-1.5 py-0.5 rounded text-amber-300">.COM</code> files. To identify the file format, he placed his own initials <strong className="text-cyan-400 font-mono">"MZ"</strong> (0x4D, 0x5A in ASCII; 0x5A4D in 16-bit little-endian) at byte offset 0.
        </p>
        <p>
          More than 40 years later, virtually <em>every</em> single Windows executable—from Windows 95 to 64-bit Windows 11 executables and game binaries—still begins with Mark Zbikowski's 64-byte MZ header and a 16-bit DOS stub program.
        </p>
      </div>

      {/* Anatomy Diagram */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-neutral-100 font-semibold text-sm">
          <FileCode2 className="w-4 h-4 text-cyan-400" />
          <span>Anatomy of an MS-DOS Executable File</span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div className="p-3 bg-neutral-950 rounded border-l-4 border-cyan-500 flex flex-col gap-1">
            <span className="text-cyan-400 font-bold">1. MZ Header (Bytes 0x00 – 0x3F, 64 bytes / 4 paragraphs)</span>
            <p className="text-neutral-400 font-sans text-xs">
              Contains the magic signature, file page counts, stack segment/pointer (SS:SP), entry point (CS:IP), paragraph counts, and relocation table pointer.
            </p>
          </div>

          <div className="p-3 bg-neutral-950 rounded border-l-4 border-amber-500 flex flex-col gap-1">
            <span className="text-amber-400 font-bold">2. Relocation Table (Offset e_lfarlc)</span>
            <p className="text-neutral-400 font-sans text-xs">
              Array of 16-bit (offset, segment) word pairs pointing to addresses in the code that need segment base adjustment when loaded into memory.
            </p>
          </div>

          <div className="p-3 bg-neutral-950 rounded border-l-4 border-lime-500 flex flex-col gap-1">
            <span className="text-lime-400 font-bold">3. 16-Bit Real Mode Machine Code (Starts at e_cparhdr * 16)</span>
            <p className="text-neutral-400 font-sans text-xs">
              8086 x86 opcodes loaded at the allocated base segment. Program execution begins at <code className="text-lime-300">CS:IP</code>.
            </p>
          </div>

          <div className="p-3 bg-neutral-950 rounded border-l-4 border-purple-500 flex flex-col gap-1">
            <span className="text-purple-400 font-bold">4. Data Section & String Payloads</span>
            <p className="text-neutral-400 font-sans text-xs">
              User messages, ASCII text, constants, or PE signatures located immediately following the machine code.
            </p>
          </div>
        </div>
      </div>

      {/* 8086 Segment Math & Loading */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-neutral-100 font-semibold text-xs sm:text-sm">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>8086 Segmented Memory Math</span>
          </div>
          <p className="text-xs text-neutral-400">
            The 8086 CPU has a 20-bit address bus (1 Megabyte RAM limit). To form a 20-bit physical address from 16-bit registers:
          </p>
          <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 font-mono text-xs text-emerald-300">
            Physical Address = (Segment × 16) + Offset
          </div>
          <p className="text-xs text-neutral-400">
            A 16-byte unit is called a <strong>paragraph</strong>. Hence <code className="font-mono text-neutral-300">e_cparhdr = 4</code> means the header is 4 paragraphs = 64 bytes.
          </p>
        </div>

        <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-neutral-100 font-semibold text-xs sm:text-sm">
            <Terminal className="w-4 h-4 text-rose-400" />
            <span>DOS Text Output Interrupts</span>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-xs text-neutral-400">
            <li>
              <strong className="text-neutral-200">INT 21h, AH=09h:</strong> Prints string at <code className="font-mono text-amber-300">DS:DX</code> ending in <code className="font-mono text-amber-300">'$'</code> (0x24).
            </li>
            <li>
              <strong className="text-neutral-200">INT 21h, AH=02h:</strong> Prints single character in <code className="font-mono text-amber-300">DL</code> (great for null-terminated strings).
            </li>
            <li>
              <strong className="text-neutral-200">BIOS INT 10h, AH=0Eh:</strong> Teletype video output. Works directly on bare-metal without DOS!
            </li>
            <li>
              <strong className="text-neutral-200">INT 21h, AH=4Ch:</strong> Normal program exit with return code in <code className="font-mono text-amber-300">AL</code>.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
