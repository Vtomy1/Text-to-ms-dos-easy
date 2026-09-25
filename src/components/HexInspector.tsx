import React, { useState } from 'react';
import { HEADER_FIELDS_META } from '../utils/mzEncoder';
import { DosHeaderFields } from '../types/dos';
import { Info, Sparkles, Copy, Check } from 'lucide-react';
import { generateHexDump } from '../utils/mzEncoder';

interface HexInspectorProps {
  binary: Uint8Array;
  headerFields: DosHeaderFields;
  headerSize: number;
  textOffsetInCode: number;
  textLength: number;
}

export const HexInspector: React.FC<HexInspectorProps> = ({
  binary,
  headerFields,
  headerSize,
  textOffsetInCode,
  textLength,
}) => {
  const [hoveredOffset, setHoveredOffset] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Determine section and metadata for a given byte offset
  const getByteMetadata = (offset: number) => {
    // Check standard header fields
    if (offset < headerSize) {
      for (const field of HEADER_FIELDS_META) {
        if (offset >= field.offsetDec && offset < field.offsetDec + field.sizeBytes) {
          return {
            category: 'header',
            field,
            label: `MZ Header: ${field.label}`,
            desc: field.description,
            role: field.role,
            color: field.colorClass,
          };
        }
      }
      return {
        category: 'header_padding',
        label: 'MZ Header Slack / Paragraph Padding',
        desc: 'Zero padding to align executable code to a 16-byte paragraph boundary',
        role: 'DOS loader requires code to start at e_cparhdr * 16',
        color: 'text-neutral-400 bg-neutral-900 border-neutral-700',
      };
    }

    const payloadOffset = offset - headerSize;

    // Check if within text string
    if (payloadOffset >= textOffsetInCode && payloadOffset < textOffsetInCode + textLength + 2) {
      return {
        category: 'text',
        label: 'Text Data Payload',
        desc: 'The embedded user message bytes',
        role: 'Target string referenced by DX/SI and printed to MS-DOS terminal',
        color: 'text-amber-400 bg-amber-950/60 border-amber-700/80 font-bold',
      };
    }

    // Otherwise it's 8086 machine code
    return {
      category: 'code',
      label: '8086 Real Mode Machine Code',
      desc: '16-bit executable opcodes (segment setup, registers, INT 21h/10h, INT 21h AH=4Ch exit)',
      role: 'Executed sequentially by the 8086 CPU starting at CS:IP',
      color: 'text-lime-400 bg-lime-950/40 border-lime-700/60',
    };
  };

  const hoveredMeta = hoveredOffset !== null ? getByteMetadata(hoveredOffset) : null;
  const hoveredByte = hoveredOffset !== null && hoveredOffset < binary.length ? binary[hoveredOffset] : null;
  const hoveredWord = hoveredOffset !== null && hoveredOffset + 1 < binary.length
    ? binary[hoveredOffset] | (binary[hoveredOffset + 1] << 8)
    : hoveredByte;

  const copyHexDump = () => {
    const dump = generateHexDump(binary);
    navigator.clipboard.writeText(dump);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header & Quick Stats */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-900/90 border border-neutral-800 rounded-lg p-3">
        <div>
          <h3 className="text-xs font-semibold text-neutral-200">
            Interactive Binary Hex Inspector & Memory Map
          </h3>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Hover over any hex byte to inspect its field identity, endianness, and MS-DOS loader role
          </p>
        </div>

        <button
          onClick={copyHexDump}
          className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 px-2.5 py-1 rounded text-xs transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied Hex Dump!' : 'Copy Hex Dump'}</span>
        </button>
      </div>

      {/* Color Legend Bar */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono bg-neutral-950 p-2.5 border border-neutral-800 rounded">
        <span className="text-neutral-500 mr-1">Field Legend:</span>
        <span className="text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.5 rounded">e_magic (MZ)</span>
        <span className="text-purple-400 bg-purple-950/60 border border-purple-800/60 px-1.5 py-0.5 rounded">Pages / Bytes</span>
        <span className="text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded">Relocs & Paras</span>
        <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">Stack SS:SP</span>
        <span className="text-rose-400 bg-rose-950/60 border border-rose-800/60 px-1.5 py-0.5 rounded">Entry CS:IP</span>
        <span className="text-lime-400 bg-lime-950/60 border border-lime-800/60 px-1.5 py-0.5 rounded">8086 Machine Code</span>
        <span className="text-amber-300 bg-amber-950/80 border border-amber-700 px-1.5 py-0.5 rounded font-bold">Text String Payload</span>
      </div>

      {/* Main Grid: Hex View + Live Byte Inspector HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Hex Matrix (8 Cols) */}
        <div className="lg:col-span-8 bg-neutral-950 border border-neutral-800 rounded-lg p-3 font-mono text-xs overflow-x-auto shadow-inner">
          {/* Header Row */}
          <div className="flex items-center text-neutral-500 border-b border-neutral-800 pb-1 mb-1 select-none">
            <span className="w-20 shrink-0 font-semibold">OFFSET</span>
            <div className="flex-1 grid grid-cols-16 gap-1 text-center font-semibold">
              {Array.from({ length: 16 }).map((_, i) => (
                <span key={i} className={i === 8 ? 'border-l border-neutral-800 pl-1' : ''}>
                  {i.toString(16).toUpperCase()}
                </span>
              ))}
            </div>
            <span className="w-36 text-center shrink-0 border-l border-neutral-800 ml-2 font-semibold">
              ASCII
            </span>
          </div>

          {/* Hex Rows */}
          {Array.from({ length: Math.ceil(binary.length / 16) }).map((_, rowIndex) => {
            const rowOffset = rowIndex * 16;
            const rowBytes = Array.from(binary.slice(rowOffset, rowOffset + 16));

            return (
              <div key={rowIndex} className="flex items-center hover:bg-neutral-900/60 py-0.5 rounded transition">
                {/* Offset Label */}
                <span className="w-20 shrink-0 text-neutral-500 font-mono">
                  0x{rowOffset.toString(16).padStart(4, '0').toUpperCase()}
                </span>

                {/* Hex Bytes */}
                <div className="flex-1 grid grid-cols-16 gap-1 text-center">
                  {Array.from({ length: 16 }).map((_, colIndex) => {
                    const byteOffset = rowOffset + colIndex;
                    if (colIndex >= rowBytes.length) {
                      return <span key={colIndex} className="text-neutral-800">..</span>;
                    }
                    const b = rowBytes[colIndex];
                    const meta = getByteMetadata(byteOffset);
                    const isHovered = hoveredOffset === byteOffset;

                    return (
                      <span
                        key={colIndex}
                        onMouseEnter={() => setHoveredOffset(byteOffset)}
                        onMouseLeave={() => setHoveredOffset(null)}
                        className={`cursor-pointer rounded px-0.5 py-0.5 transition font-mono ${
                          isHovered
                            ? 'ring-2 ring-white z-10 scale-110 font-bold bg-white text-neutral-950'
                            : meta.color
                        } ${colIndex === 8 ? 'border-l border-neutral-800' : ''}`}
                      >
                        {b.toString(16).padStart(2, '0').toUpperCase()}
                      </span>
                    );
                  })}
                </div>

                {/* ASCII Representation */}
                <div className="w-36 shrink-0 border-l border-neutral-800 ml-2 pl-2 text-neutral-400 font-mono tracking-wider flex">
                  {rowBytes.map((b, colIndex) => {
                    const byteOffset = rowOffset + colIndex;
                    const isHovered = hoveredOffset === byteOffset;
                    const char = b >= 32 && b <= 126 ? String.fromCharCode(b) : '·';
                    return (
                      <span
                        key={colIndex}
                        onMouseEnter={() => setHoveredOffset(byteOffset)}
                        onMouseLeave={() => setHoveredOffset(null)}
                        className={`cursor-pointer inline-block w-[8px] text-center ${
                          isHovered ? 'text-amber-400 font-bold underline' : ''
                        }`}
                      >
                        {char}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Byte Inspector HUD (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
              <span className="text-xs font-semibold text-neutral-200">Byte Inspector HUD</span>
              {hoveredOffset !== null ? (
                <span className="text-[11px] font-mono text-amber-400">
                  Offset: 0x{hoveredOffset.toString(16).padStart(4, '0').toUpperCase()} ({hoveredOffset})
                </span>
              ) : (
                <span className="text-[11px] text-neutral-500 font-mono">Hover a byte</span>
              )}
            </div>

            {hoveredMeta && hoveredByte !== null ? (
              <div className="flex flex-col gap-2.5">
                {/* Field Header */}
                <div className="p-2 bg-neutral-950 rounded border border-neutral-800">
                  <span className="text-xs font-bold block text-neutral-100">
                    {hoveredMeta.label}
                  </span>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                    {hoveredMeta.desc}
                  </p>
                </div>

                {/* Value Cards */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-neutral-950 p-2 rounded border border-neutral-800/70">
                    <span className="text-neutral-500 text-[10px] block">BYTE (HEX)</span>
                    <span className="text-amber-400 font-semibold text-sm">
                      0x{hoveredByte.toString(16).padStart(2, '0').toUpperCase()}
                    </span>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded border border-neutral-800/70">
                    <span className="text-neutral-500 text-[10px] block">BYTE (DECIMAL)</span>
                    <span className="text-cyan-400 font-semibold text-sm">{hoveredByte}</span>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded border border-neutral-800/70">
                    <span className="text-neutral-500 text-[10px] block">WORD (LITTLE ENDIAN)</span>
                    <span className="text-purple-400 font-semibold text-sm">
                      0x{(hoveredWord ?? hoveredByte).toString(16).padStart(4, '0').toUpperCase()}
                    </span>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded border border-neutral-800/70">
                    <span className="text-neutral-500 text-[10px] block">ASCII CHAR</span>
                    <span className="text-emerald-400 font-semibold text-sm font-crt">
                      {hoveredByte >= 32 && hoveredByte <= 126 ? `'${String.fromCharCode(hoveredByte)}'` : 'Non-printable'}
                    </span>
                  </div>
                </div>

                {/* MS-DOS Loader Role */}
                <div className="p-2.5 bg-neutral-950/60 rounded border border-neutral-800 text-[11px] text-neutral-300">
                  <span className="text-neutral-500 text-[10px] block mb-0.5 uppercase tracking-wider font-semibold">
                    MS-DOS EXEC Loader Behavior:
                  </span>
                  <p className="leading-snug">{hoveredMeta.role}</p>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-neutral-500 font-mono flex flex-col items-center gap-2">
                <Info className="w-5 h-5 text-neutral-600" />
                <span>Move your mouse or pointer over any hex byte or ASCII character in the grid to view detailed technical breakdown.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
