import React from 'react';
import {
  Download,
  Volume2,
  VolumeX,
  Terminal,
  Cpu,
  FileCode2,
  BookOpen,
  Sparkles,
  Search,
  Monitor
} from 'lucide-react';
import { CrtTheme } from '../types/dos';
import { PRESETS, Preset } from '../data/presets';
import { retroAudio } from '../utils/audio';

interface NavbarProps {
  crtTheme: CrtTheme;
  setCrtTheme: (theme: CrtTheme) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  activeTab: 'screen' | 'hex' | 'table' | 'export' | 'inspector' | 'guide';
  setActiveTab: (tab: 'screen' | 'hex' | 'table' | 'export' | 'inspector' | 'guide') => void;
  onSelectPreset: (preset: Preset) => void;
  onDownloadExe: () => void;
  fileSize: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  crtTheme,
  setCrtTheme,
  soundEnabled,
  setSoundEnabled,
  activeTab,
  setActiveTab,
  onSelectPreset,
  onDownloadExe,
  fileSize,
}) => {
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    retroAudio.enabled = next;
    if (next) retroAudio.playBeep(880, 0.05);
  };

  const navItems = [
    { id: 'screen' as const, label: 'DOS 8086 Console', icon: Terminal },
    { id: 'hex' as const, label: 'Hex Inspector', icon: Cpu },
    { id: 'table' as const, label: 'MZ Header Table', icon: FileCode2 },
    { id: 'export' as const, label: 'C / ASM / Debug Export', icon: FileCode2 },
    { id: 'inspector' as const, label: 'EXE File Analyzer', icon: Search },
    { id: 'guide' as const, label: 'MZ Architecture Guide', icon: BookOpen },
  ];

  return (
    <header className="border-b border-neutral-800 bg-neutral-950/95 sticky top-0 z-40 backdrop-blur-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-amber-500/10 border border-amber-500/30 rounded flex items-center justify-center text-amber-400 shadow-inner">
              <span className="font-mono font-bold text-sm tracking-wider">MZ</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-neutral-100 tracking-tight">TEXT TO MS-DOS EXE</span>
                <span className="text-neutral-500 text-xs">·</span>
                <span className="text-xs text-neutral-400 font-mono">16-Bit Real Mode Header Studio</span>
              </div>
              <p className="text-[11px] text-neutral-500 hidden sm:block">
                Converts text into valid 0x5A4D Mark Zbikowski headers and runnable x86 binaries
              </p>
            </div>
          </div>

          {/* Quick Controls & Download */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Presets dropdown */}
            <div className="relative inline-block text-left">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 hover:border-neutral-700 transition">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline font-medium">Presets:</span>
                <select
                  onChange={(e) => {
                    const found = PRESETS.find(p => p.id === e.target.value);
                    if (found) {
                      onSelectPreset(found);
                      retroAudio.playTick();
                    }
                  }}
                  defaultValue=""
                  className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer"
                >
                  <option value="" disabled>Load sample...</option>
                  {PRESETS.map(p => (
                    <option key={p.id} value={p.id} className="bg-neutral-900 text-neutral-100">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* CRT Monitor Theme Selector */}
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded p-0.5 text-xs">
              <button
                title="Green Phosphor (P31)"
                onClick={() => { setCrtTheme('green'); retroAudio.playTick(); }}
                className={`px-2 py-1 rounded transition text-xs flex items-center gap-1 ${
                  crtTheme === 'green' ? 'bg-emerald-950/80 text-emerald-300 font-medium' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span className="hidden md:inline">Green</span>
              </button>
              <button
                title="Amber CRT (P134)"
                onClick={() => { setCrtTheme('amber'); retroAudio.playTick(); }}
                className={`px-2 py-1 rounded transition text-xs flex items-center gap-1 ${
                  crtTheme === 'amber' ? 'bg-amber-950/80 text-amber-300 font-medium' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                <span className="hidden md:inline">Amber</span>
              </button>
              <button
                title="IBM DOS Gray / Blue"
                onClick={() => { setCrtTheme('dos_blue'); retroAudio.playTick(); }}
                className={`px-2 py-1 rounded transition text-xs flex items-center gap-1 ${
                  crtTheme === 'dos_blue' ? 'bg-blue-950/80 text-blue-300 font-medium' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                <span className="hidden md:inline">IBM DOS</span>
              </button>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Disable PC Speaker & Drive Sound' : 'Enable PC Speaker & Drive Sound'}
              className={`p-1.5 rounded border transition ${
                soundEnabled
                  ? 'bg-neutral-800 text-amber-400 border-amber-500/40'
                  : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:text-neutral-300'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Download .EXE Button */}
            <button
              onClick={onDownloadExe}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold px-3 py-1.5 rounded text-xs transition shadow-sm active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .EXE</span>
              <span className="text-[10px] font-mono text-neutral-900/80 hidden sm:inline">({fileSize}B)</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 overflow-x-auto py-1 border-t border-neutral-900 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  retroAudio.playTick();
                }}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded transition whitespace-nowrap ${
                  isActive
                    ? 'bg-neutral-800 text-amber-400 border border-neutral-700/60 shadow-inner'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-neutral-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
