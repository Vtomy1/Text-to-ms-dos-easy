/**
 * Types and structures for MS-DOS MZ Executable Header and 8086 Emulation
 * Reference: Mark Zbikowski MZ Executable Format & Microsoft PE/COFF Specification
 */

export interface DosHeaderFields {
  e_magic: number;     // 0x00: Magic number (0x5A4D 'MZ' or 0x4D5A 'ZM')
  e_cblp: number;      // 0x02: Bytes on last page of file
  e_cp: number;        // 0x04: Pages in file (512-byte blocks)
  e_crlc: number;      // 0x06: Relocations count
  e_cparhdr: number;   // 0x08: Size of header in paragraphs (16-byte units)
  e_minalloc: number;  // 0x0A: Minimum extra paragraphs needed
  e_maxalloc: number;  // 0x0C: Maximum extra paragraphs needed
  e_ss: number;        // 0x0E: Initial (relative) SS value
  e_sp: number;        // 0x10: Initial SP value
  e_csum: number;      // 0x12: Checksum (usually 0)
  e_ip: number;        // 0x14: Initial IP value
  e_cs: number;        // 0x16: Initial (relative) CS value
  e_lfarlc: number;    // 0x18: File address of relocation table
  e_ovno: number;      // 0x1A: Overlay number
  e_res: number[];     // 0x1C: Reserved words (4 words / 8 bytes)
  e_oemid: number;     // 0x24: OEM identifier (for e_oeminfo)
  e_oeminfo: number;   // 0x26: OEM information; e_oemid specific
  e_res2: number[];    // 0x28: Reserved words (10 words / 20 bytes)
  e_lfanew: number;    // 0x3C: File address of new exe header (PE/NE)
}

export type GenerationMode =
  | 'dos_int21_09'    // Standard MS-DOS print '$'-terminated string (INT 21h, AH=09h)
  | 'dos_int21_02'    // MS-DOS character loop with null-termination (INT 21h, AH=02h)
  | 'bios_int10'      // BIOS Teletype loop (INT 10h, AH=0Eh)
  | 'pe_stub'         // Windows PE DOS Stub ("This program cannot be run in DOS mode.")
  | 'slack_space';    // Text steganographically hidden in header reserved slack space

export interface GeneratorOptions {
  mode: GenerationMode;
  text: string;
  appendCrLf: boolean;
  dollarTerminate: boolean;
  headerParagraphs: number; // e.g. 4 (64 bytes) or 2 (32 bytes)
  stackSize: number;        // e.g. 256 or 512 bytes
  minAlloc: number;
  maxAlloc: number;
  entryIp: number;
  entryCs: number;
  includePeSignature: boolean; // Add minimal PE stub pointer
  e_lfanew: number;
  customOverlay: number;
}

export interface HeaderFieldMeta {
  key: keyof DosHeaderFields;
  label: string;
  offsetHex: string;
  offsetDec: number;
  sizeBytes: number;
  description: string;
  role: string;
  colorClass: string;
}

export interface DisassembledInstruction {
  offset: number;
  bytes: number[];
  mnemonic: string;
  operands: string;
  description: string;
}

export interface CpuState {
  ax: number;
  bx: number;
  cx: number;
  dx: number;
  si: number;
  di: number;
  bp: number;
  sp: number;
  cs: number;
  ds: number;
  ss: number;
  es: number;
  ip: number;
  flags: {
    cf: boolean; // Carry
    zf: boolean; // Zero
    sf: boolean; // Sign
    of: boolean; // Overflow
    if: boolean; // Interrupt
    df: boolean; // Direction
  };
  halted: boolean;
  cycles: number;
}

export type CrtTheme = 'green' | 'amber' | 'dos_blue' | 'white';
