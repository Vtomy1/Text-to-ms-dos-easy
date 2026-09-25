import React, { useState } from 'react';
import { DosHeaderFields, GeneratorOptions } from '../types/dos';
import { HEADER_FIELDS_META } from '../utils/mzEncoder';
import { Check, Edit3, RotateCcw, AlertTriangle } from 'lucide-react';
import { retroAudio } from '../utils/audio';

interface HeaderFieldTableProps {
  headerFields: DosHeaderFields;
  options: GeneratorOptions;
  setOptions: React.Dispatch<React.SetStateAction<GeneratorOptions>>;
}

export const HeaderFieldTable: React.FC<HeaderFieldTableProps> = ({
  headerFields,
  options,
  setOptions,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);

  const getFieldValue = (key: keyof DosHeaderFields) => {
    const val = headerFields[key];
    if (Array.isArray(val)) {
      return val.map(w => '0x' + w.toString(16).padStart(4, '0').toUpperCase()).join(' ');
    }
    if (typeof val === 'number') {
      const hex = '0x' + val.toString(16).toUpperCase();
      return `${hex} (${val})`;
    }
    return String(val);
  };

  const getFieldHealth = (key: keyof DosHeaderFields) => {
    if (key === 'e_magic') {
      return headerFields.e_magic === 0x5a4d
        ? { text: 'Valid MZ (0x5A4D)', ok: true }
        : { text: 'Invalid Magic Signature', ok: false };
    }
    if (key === 'e_cparhdr') {
      return headerFields.e_cparhdr >= 2
        ? { text: `OK (${headerFields.e_cparhdr * 16} bytes)`, ok: true }
        : { text: 'Header too small', ok: false };
    }
    if (key === 'e_cp') {
      return headerFields.e_cp > 0
        ? { text: `OK (${headerFields.e_cp * 512} max bytes)`, ok: true }
        : { text: '0 pages invalid', ok: false };
    }
    if (key === 'e_sp') {
      return headerFields.e_sp >= 64
        ? { text: 'Adequate stack allocated', ok: true }
        : { text: 'Stack may overflow', ok: false };
    }
    return { text: 'Standard', ok: true };
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header Description */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold text-neutral-200">
            IMAGE_DOS_HEADER Field Reference & Breakdown
          </h3>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            The 64-byte structural specification initialized at the very beginning of every MS-DOS executable
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-x-auto shadow-inner">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-neutral-800 text-[11px] text-neutral-400 bg-neutral-900/70 select-none">
              <th className="py-2.5 px-3">OFFSET</th>
              <th className="py-2.5 px-3">IDENTIFIER</th>
              <th className="py-2.5 px-3">SIZE</th>
              <th className="py-2.5 px-3">VALUE (HEX / DEC)</th>
              <th className="py-2.5 px-3">ROLE & DESCRIPTION</th>
              <th className="py-2.5 px-3">HEALTH</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {HEADER_FIELDS_META.map((meta) => {
              const valueStr = getFieldValue(meta.key);
              const health = getFieldHealth(meta.key);

              return (
                <tr key={meta.key} className="hover:bg-neutral-900/50 transition">
                  {/* Offset */}
                  <td className="py-2.5 px-3 text-neutral-500 font-mono whitespace-nowrap">
                    {meta.offsetHex} <span className="text-neutral-600 text-[10px]">({meta.offsetDec})</span>
                  </td>

                  {/* Identifier */}
                  <td className="py-2.5 px-3 font-semibold text-neutral-200 whitespace-nowrap">
                    <span className={meta.colorClass.split(' ')[0]}>{meta.label}</span>
                  </td>

                  {/* Size */}
                  <td className="py-2.5 px-3 text-neutral-400 whitespace-nowrap">
                    {meta.sizeBytes} bytes
                  </td>

                  {/* Current Value */}
                  <td className="py-2.5 px-3 font-semibold text-neutral-100 whitespace-nowrap">
                    {valueStr}
                  </td>

                  {/* Description & Role */}
                  <td className="py-2.5 px-3 text-neutral-300 font-sans text-xs">
                    <div className="font-medium text-neutral-200">{meta.description}</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">{meta.role}</div>
                  </td>

                  {/* Health */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border ${
                        health.ok
                          ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
                          : 'text-rose-400 bg-rose-950/40 border-rose-800/40'
                      }`}
                    >
                      {health.ok ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      <span>{health.text}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
