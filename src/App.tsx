import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { GeneratorOptions, CrtTheme } from './types/dos';
import { encodeTextToDosExe } from './utils/mzEncoder';
import { Navbar } from './components/Navbar';
import { TextPayloadEditor } from './components/TextPayloadEditor';
import { DosVirtualScreen } from './components/DosVirtualScreen';
import { HexInspector } from './components/HexInspector';
import { HeaderFieldTable } from './components/HeaderFieldTable';
import { CodeExporters } from './components/CodeExporters';
import { ExeFileInspector } from './components/ExeFileInspector';
import { ReferenceGuide } from './components/ReferenceGuide';
import { PRESETS, Preset } from './data/presets';
import { retroAudio } from './utils/audio';

export default function App() {
  const [crtTheme, setCrtTheme] = useState<CrtTheme>('green');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'screen' | 'hex' | 'table' | 'export' | 'inspector' | 'guide'>('screen');

  const [options, setOptions] = useState<GeneratorOptions>({
    mode: 'dos_int21_09',
    text: 'Hello, World from MS-DOS 6.22!\r\nRunning on 8086 Real Mode CPU.',
    appendCrLf: true,
    dollarTerminate: true,
    headerParagraphs: 4, // 64 bytes
    stackSize: 512,
    minAlloc: 0,
    maxAlloc: 0xffff,
    entryIp: 0,
    entryCs: 0,
    includePeSignature: false,
    e_lfanew: 0,
    customOverlay: 0,
  });

  // Calculate encoded executable whenever options change
  const encoded = useMemo(() => {
    return encodeTextToDosExe(options);
  }, [options]);

  const handleDownloadExe = useCallback(() => {
    retroAudio.playFloppySeek();
    const blob = new Blob([encoded.binary.buffer as ArrayBuffer], { type: 'application/x-msdownload' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'OUTPUT.EXE';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [encoded.binary]);

  const handleSelectPreset = (preset: Preset) => {
    setOptions(prev => ({
      ...prev,
      mode: preset.mode,
      text: preset.text,
      includePeSignature: preset.mode === 'pe_stub',
    }));
  };

  const handleImportText = (extractedText: string) => {
    setOptions(prev => ({
      ...prev,
      text: extractedText,
    }));
    setActiveTab('screen');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navbar */}
      <Navbar
        crtTheme={crtTheme}
        setCrtTheme={setCrtTheme}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectPreset={handleSelectPreset}
        onDownloadExe={handleDownloadExe}
        fileSize={encoded.fileSize}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Top Text & Payload Definition Area */}
        <TextPayloadEditor
          options={options}
          setOptions={setOptions}
          headerSize={encoded.headerSize}
          fileSize={encoded.fileSize}
          pages={encoded.headerFields.e_cp}
          lastPageBytes={encoded.headerFields.e_cblp}
        />

        {/* Dynamic Tab Views */}
        <div className="flex-1">
          {activeTab === 'screen' && (
            <DosVirtualScreen
              binary={encoded.binary}
              headerFields={encoded.headerFields}
              crtTheme={crtTheme}
            />
          )}

          {activeTab === 'hex' && (
            <HexInspector
              binary={encoded.binary}
              headerFields={encoded.headerFields}
              headerSize={encoded.headerSize}
              textOffsetInCode={encoded.textOffsetInCode}
              textLength={encoded.textLength}
            />
          )}

          {activeTab === 'table' && (
            <HeaderFieldTable
              headerFields={encoded.headerFields}
              options={options}
              setOptions={setOptions}
            />
          )}

          {activeTab === 'export' && (
            <CodeExporters
              binary={encoded.binary}
              headerFields={encoded.headerFields}
              options={options}
            />
          )}

          {activeTab === 'inspector' && (
            <ExeFileInspector onImportText={handleImportText} />
          )}

          {activeTab === 'guide' && <ReferenceGuide />}
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-neutral-900 py-4 px-6 text-center text-xs text-neutral-600">
        <span>MS-DOS Executable MZ Header Studio</span>
        <span className="mx-2">·</span>
        <span>Mark Zbikowski Executable Format (1983)</span>
        <span className="mx-2">·</span>
        <span>Compatible with DOSBox, FreeDOS, 86Box & Windows PE</span>
      </footer>
    </div>
  );
}
