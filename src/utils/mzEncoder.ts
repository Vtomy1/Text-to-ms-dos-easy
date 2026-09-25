/**
 * MS-DOS MZ Executable Encoder & Parser
 * Converts text into valid MZ headers and real-mode 8086 x86 executables.
 */

import { DosHeaderFields, GeneratorOptions, HeaderFieldMeta } from '../types/dos';

export const HEADER_FIELDS_META: HeaderFieldMeta[] = [
  {
    key: 'e_magic',
    label: 'e_magic',
    offsetHex: '0x00',
    offsetDec: 0,
    sizeBytes: 2,
    description: 'Magic number: 0x5A4D ("MZ") for Mark Zbikowski',
    role: 'Executable signature verified by DOS EXEC (INT 21h AH=4Bh)',
    colorClass: 'text-cyan-400 bg-cyan-950/40 border-cyan-700/60',
  },
  {
    key: 'e_cblp',
    label: 'e_cblp',
    offsetHex: '0x02',
    offsetDec: 2,
    sizeBytes: 2,
    description: 'Bytes on last 512-byte page (0 = 512 bytes)',
    role: 'Calculates exact file length: (e_cp - 1) * 512 + e_cblp',
    colorClass: 'text-purple-400 bg-purple-950/40 border-purple-700/60',
  },
  {
    key: 'e_cp',
    label: 'e_cp',
    offsetHex: '0x04',
    offsetDec: 4,
    sizeBytes: 2,
    description: 'Total number of 512-byte pages in file',
    role: 'Total allocated disk blocks needed to load file',
    colorClass: 'text-purple-400 bg-purple-950/40 border-purple-700/60',
  },
  {
    key: 'e_crlc',
    label: 'e_crlc',
    offsetHex: '0x06',
    offsetDec: 6,
    sizeBytes: 2,
    description: 'Relocation entries count in relocation table',
    role: 'Number of segment fixup pointers to patch at load time',
    colorClass: 'text-amber-400 bg-amber-950/40 border-amber-700/60',
  },
  {
    key: 'e_cparhdr',
    label: 'e_cparhdr',
    offsetHex: '0x08',
    offsetDec: 8,
    sizeBytes: 2,
    description: 'Header size in 16-byte paragraphs',
    role: 'File offset where executable code/data starts (e_cparhdr * 16)',
    colorClass: 'text-amber-400 bg-amber-950/40 border-amber-700/60',
  },
  {
    key: 'e_minalloc',
    label: 'e_minalloc',
    offsetHex: '0x0A',
    offsetDec: 10,
    sizeBytes: 2,
    description: 'Minimum extra paragraphs needed by program (BSS/heap)',
    role: 'DOS fails load if conventional memory free < minalloc',
    colorClass: 'text-blue-400 bg-blue-950/40 border-blue-700/60',
  },
  {
    key: 'e_maxalloc',
    label: 'e_maxalloc',
    offsetHex: '0x0C',
    offsetDec: 12,
    sizeBytes: 2,
    description: 'Maximum extra paragraphs requested (often 0xFFFF)',
    role: 'DOS allocates up to this much memory above program image',
    colorClass: 'text-blue-400 bg-blue-950/40 border-blue-700/60',
  },
  {
    key: 'e_ss',
    label: 'e_ss',
    offsetHex: '0x0E',
    offsetDec: 14,
    sizeBytes: 2,
    description: 'Initial relative SS (Stack Segment) register value',
    role: 'SS = program load segment + e_ss',
    colorClass: 'text-emerald-400 bg-emerald-950/40 border-emerald-700/60',
  },
  {
    key: 'e_sp',
    label: 'e_sp',
    offsetHex: '0x10',
    offsetDec: 16,
    sizeBytes: 2,
    description: 'Initial SP (Stack Pointer) register value',
    role: 'Top of initial runtime stack',
    colorClass: 'text-emerald-400 bg-emerald-950/40 border-emerald-700/60',
  },
  {
    key: 'e_csum',
    label: 'e_csum',
    offsetHex: '0x12',
    offsetDec: 18,
    sizeBytes: 2,
    description: 'Checksum (one\'s complement, usually 0x0000)',
    role: 'Ignored by most DOS loaders, historical verification',
    colorClass: 'text-zinc-400 bg-zinc-950/40 border-zinc-700/60',
  },
  {
    key: 'e_ip',
    label: 'e_ip',
    offsetHex: '0x14',
    offsetDec: 20,
    sizeBytes: 2,
    description: 'Initial IP (Instruction Pointer) entry point offset',
    role: 'First instruction offset to execute in code segment',
    colorClass: 'text-rose-400 bg-rose-950/40 border-rose-700/60',
  },
  {
    key: 'e_cs',
    label: 'e_cs',
    offsetHex: '0x16',
    offsetDec: 22,
    sizeBytes: 2,
    description: 'Initial relative CS (Code Segment) register value',
    role: 'CS = program load segment + e_cs',
    colorClass: 'text-rose-400 bg-rose-950/40 border-rose-700/60',
  },
  {
    key: 'e_lfarlc',
    label: 'e_lfarlc',
    offsetHex: '0x18',
    offsetDec: 24,
    sizeBytes: 2,
    description: 'File address of relocation table (usually 0x1C or 0x40)',
    role: 'Byte offset in file where (offset, segment) pairs begin',
    colorClass: 'text-amber-400 bg-amber-950/40 border-amber-700/60',
  },
  {
    key: 'e_ovno',
    label: 'e_ovno',
    offsetHex: '0x1A',
    offsetDec: 26,
    sizeBytes: 2,
    description: 'Overlay number (0 = root executable image)',
    role: 'Used by DOS overlay managers to swap program modules',
    colorClass: 'text-zinc-400 bg-zinc-950/40 border-zinc-700/60',
  },
  {
    key: 'e_res',
    label: 'e_res[4]',
    offsetHex: '0x1C',
    offsetDec: 28,
    sizeBytes: 8,
    description: 'Reserved words (4 words / 8 bytes)',
    role: 'Reserved space in extended DOS/PE header; often slack',
    colorClass: 'text-indigo-400 bg-indigo-950/40 border-indigo-700/60',
  },
  {
    key: 'e_oemid',
    label: 'e_oemid',
    offsetHex: '0x24',
    offsetDec: 36,
    sizeBytes: 2,
    description: 'OEM identifier (for e_oeminfo)',
    role: 'OEM identifier in PE stubs',
    colorClass: 'text-indigo-400 bg-indigo-950/40 border-indigo-700/60',
  },
  {
    key: 'e_oeminfo',
    label: 'e_oeminfo',
    offsetHex: '0x26',
    offsetDec: 38,
    sizeBytes: 2,
    description: 'OEM information (e_oemid specific)',
    role: 'OEM extra metadata',
    colorClass: 'text-indigo-400 bg-indigo-950/40 border-indigo-700/60',
  },
  {
    key: 'e_res2',
    label: 'e_res2[10]',
    offsetHex: '0x28',
    offsetDec: 40,
    sizeBytes: 20,
    description: 'Reserved words (10 words / 20 bytes)',
    role: 'Reserved space in extended DOS/PE header',
    colorClass: 'text-indigo-400 bg-indigo-950/40 border-indigo-700/60',
  },
  {
    key: 'e_lfanew',
    label: 'e_lfanew',
    offsetHex: '0x3C',
    offsetDec: 60,
    sizeBytes: 4,
    description: 'File address of new executable header (PE/NE/LE)',
    role: 'Pointer to "PE\\0\\0" signature for Windows NT loader',
    colorClass: 'text-fuchsia-400 bg-fuchsia-950/40 border-fuchsia-700/60',
  },
];

export interface EncodedExeResult {
  binary: Uint8Array;
  headerFields: DosHeaderFields;
  headerBytes: Uint8Array;
  codeBytes: Uint8Array;
  textOffsetInCode: number;
  textLength: number;
  fileSize: number;
  headerSize: number;
  codeSize: number;
  mode: string;
}

/**
 * Encodes text into a complete, valid MS-DOS MZ .EXE binary file
 */
export function encodeTextToDosExe(options: GeneratorOptions): EncodedExeResult {
  let normalizedText = options.text;
  // Normalize line endings to CRLF for DOS
  normalizedText = normalizedText.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');

  if (options.appendCrLf && !normalizedText.endsWith('\r\n')) {
    normalizedText += '\r\n';
  }

  const encoder = new TextEncoder();
  const rawTextBytes = Array.from(encoder.encode(normalizedText));

  // Determine code and data payload according to mode
  const codeOpcodes: number[] = [];
  let textOffsetInCode = 0;
  let headerSize = options.headerParagraphs * 16;
  if (headerSize < 32) headerSize = 32;
  if (options.includePeSignature && headerSize < 64) headerSize = 64;

  let e_lfanewVal = options.e_lfanew;

  switch (options.mode) {
    case 'dos_int21_09': {
      // INT 21h, AH=09h: Print '$'-terminated string
      // Code layout:
      // 0000: 0E            push cs
      // 0001: 1F            pop ds
      // 0002: BA xx xx      mov dx, offset text
      // 0005: B4 09         mov ah, 09h
      // 0007: CD 21         int 21h
      // 0009: B8 00 4C      mov ax, 4C00h
      // 000C: CD 21         int 21h
      // 000E: <text bytes>
      // Followed by '$' (0x24)
      textOffsetInCode = 14;
      codeOpcodes.push(
        0x0e,               // push cs
        0x1f,               // pop ds
        0xba, textOffsetInCode & 0xff, (textOffsetInCode >> 8) & 0xff, // mov dx, textOffset
        0xb4, 0x09,         // mov ah, 09h
        0xcd, 0x21,         // int 21h
        0xb8, 0x00, 0x4c,   // mov ax, 4C00h (exit with returncode 0)
        0xcd, 0x21          // int 21h
      );

      // Append text bytes
      for (const b of rawTextBytes) {
        codeOpcodes.push(b);
      }
      // Ensure '$' termination
      if (options.dollarTerminate && !normalizedText.endsWith('$')) {
        codeOpcodes.push(0x24); // '$'
      }
      break;
    }

    case 'dos_int21_02': {
      // INT 21h, AH=02h: Character loop (null-terminated string)
      // 0000: 0E            push cs
      // 0001: 1F            pop ds
      // 0002: BE xx xx      mov si, offset text
      // 0005: 8A 14         print_loop: mov dl, [si]
      // 0007: 84 D2         test dl, dl
      // 0009: 74 08         jz exit_prog (+8 bytes)
      // 000B: B4 02         mov ah, 02h
      // 000D: CD 21         int 21h
      // 000F: 46            inc si
      // 0010: EB F3         jmp print_loop (-13 bytes -> to 0005)
      // 0012: B8 00 4C      exit_prog: mov ax, 4C00h
      // 0015: CD 21         int 21h
      // 0017: <text bytes...> 00
      textOffsetInCode = 23;
      codeOpcodes.push(
        0x0e,               // push cs
        0x1f,               // pop ds
        0xbe, textOffsetInCode & 0xff, (textOffsetInCode >> 8) & 0xff, // mov si, textOffset
        0x8a, 0x14,         // mov dl, [si]
        0x84, 0xd2,         // test dl, dl
        0x74, 0x08,         // jz exit (+8)
        0xb4, 0x02,         // mov ah, 02h
        0xcd, 0x21,         // int 21h
        0x46,               // inc si
        0xeb, 0xf3,         // jmp loop (-13)
        0xb8, 0x00, 0x4c,   // mov ax, 4C00h
        0xcd, 0x21          // int 21h
      );

      for (const b of rawTextBytes) {
        codeOpcodes.push(b);
      }
      codeOpcodes.push(0x00); // null terminator
      break;
    }

    case 'bios_int10': {
      // BIOS INT 10h, AH=0Eh: Teletype character loop
      // 0000: 0E            push cs
      // 0001: 1F            pop ds
      // 0002: BE xx xx      mov si, offset text
      // 0005: 8A 04         loop: mov al, [si]
      // 0007: 84 C0         test al, al
      // 0009: 74 09         jz exit (+9 bytes)
      // 000B: B4 0E         mov ah, 0Eh
      // 000D: BB 07 00      mov bx, 0007h (page 0, light gray)
      // 0010: CD 10         int 10h
      // 0012: 46            inc si
      // 0013: EB F0         jmp loop (-16 bytes -> to 0005)
      // 0015: B8 00 4C      exit: mov ax, 4C00h
      // 0018: CD 21         int 21h
      // 001A: <text bytes...> 00
      textOffsetInCode = 26;
      codeOpcodes.push(
        0x0e,
        0x1f,
        0xbe, textOffsetInCode & 0xff, (textOffsetInCode >> 8) & 0xff,
        0x8a, 0x04,
        0x84, 0xc0,
        0x74, 0x09,
        0xb4, 0x0e,
        0xbb, 0x07, 0x00,
        0xcd, 0x10,
        0x46,
        0xeb, 0xf0,
        0xb8, 0x00, 0x4c,
        0xcd, 0x21
      );
      for (const b of rawTextBytes) {
        codeOpcodes.push(b);
      }
      codeOpcodes.push(0x00);
      break;
    }

    case 'pe_stub': {
      // Canonical Windows PE DOS Stub
      // Code is 14 bytes:
      // 0E 1F BA 0E 00 B4 09 CD 21 B8 01 4C CD 21
      // Followed by string: "This program cannot be run in DOS mode.\r\r\n$"
      headerSize = 64; // extended 64-byte DOS header
      textOffsetInCode = 14;
      codeOpcodes.push(
        0x0e,               // push cs
        0x1f,               // pop ds
        0xba, 0x0e, 0x00,   // mov dx, 000Eh (offset 14)
        0xb4, 0x09,         // mov ah, 09h
        0xcd, 0x21,         // int 21h
        0xb8, 0x01, 0x4c,   // mov ax, 4C01h (exit code 1)
        0xcd, 0x21          // int 21h
      );

      for (const b of rawTextBytes) {
        codeOpcodes.push(b);
      }
      if (!normalizedText.endsWith('$')) {
        codeOpcodes.push(0x24); // '$'
      }

      // Align to 16-byte boundary for PE stub elegance
      while (codeOpcodes.length % 16 !== 0) {
        codeOpcodes.push(0x00);
      }

      // If e_lfanew is enabled or default 0, calculate pointer to PE header
      if (e_lfanewVal === 0 || options.includePeSignature) {
        e_lfanewVal = headerSize + codeOpcodes.length;
        // Append minimal PE Signature "PE\0\0" at e_lfanew
        codeOpcodes.push(0x50, 0x45, 0x00, 0x00); // "PE\0\0"
      }
      break;
    }

    case 'slack_space': {
      // Steganographic / slack injection:
      // Embed up to 28 characters into e_res (8 bytes) + e_res2 (20 bytes)
      headerSize = 64;
      textOffsetInCode = 14;
      codeOpcodes.push(
        0x0e,
        0x1f,
        0xba, textOffsetInCode & 0xff, (textOffsetInCode >> 8) & 0xff,
        0xb4, 0x09,
        0xcd, 0x21,
        0xb8, 0x00, 0x4c,
        0xcd, 0x21
      );
      // Code payload also prints message
      for (const b of rawTextBytes) {
        codeOpcodes.push(b);
      }
      if (!normalizedText.endsWith('$')) {
        codeOpcodes.push(0x24);
      }
      break;
    }
  }

  // Ensure minimum payload size & stack alignment
  const codePayloadSize = codeOpcodes.length;
  const totalFileSize = headerSize + codePayloadSize;

  // Compute 512-byte page calculation
  const e_cp = Math.ceil(totalFileSize / 512) || 1;
  const e_cblp = totalFileSize % 512; // 0 means exactly 512 on last page

  const headerParagraphs = Math.ceil(headerSize / 16);

  // Stack calculation
  const e_sp = options.stackSize || 0x0200;
  const e_ss = 0; // stack in same base segment or following

  const headerFields: DosHeaderFields = {
    e_magic: 0x5a4d, // 'MZ' (0x4D, 0x5A)
    e_cblp,
    e_cp,
    e_crlc: 0, // No relocations in simple flat real-mode stubs
    e_cparhdr: headerParagraphs,
    e_minalloc: options.minAlloc,
    e_maxalloc: options.maxAlloc,
    e_ss,
    e_sp,
    e_csum: 0x0000,
    e_ip: options.entryIp,
    e_cs: options.entryCs,
    e_lfarlc: headerSize >= 64 ? 0x0040 : 0x001c,
    e_ovno: options.customOverlay,
    e_res: [0, 0, 0, 0],
    e_oemid: 0,
    e_oeminfo: 0,
    e_res2: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    e_lfanew: e_lfanewVal,
  };

  // If slack_space mode, inject user text bytes into reserved words
  if (options.mode === 'slack_space') {
    const textBytes = rawTextBytes;
    // e_res has 4 words (8 bytes)
    const resWords: number[] = [];
    for (let i = 0; i < 4; i++) {
      const b0 = textBytes[i * 2] ?? 0;
      const b1 = textBytes[i * 2 + 1] ?? 0;
      resWords.push(b0 | (b1 << 8));
    }
    headerFields.e_res = resWords;

    // e_res2 has 10 words (20 bytes)
    const res2Words: number[] = [];
    for (let i = 0; i < 10; i++) {
      const idx = 8 + i * 2;
      const b0 = textBytes[idx] ?? 0;
      const b1 = textBytes[idx + 1] ?? 0;
      res2Words.push(b0 | (b1 << 8));
    }
    headerFields.e_res2 = res2Words;
  }

  // Construct binary buffer
  const binary = new Uint8Array(totalFileSize);
  const view = new DataView(binary.buffer);

  // Write MZ Header (Little Endian)
  view.setUint16(0x00, headerFields.e_magic, true);
  view.setUint16(0x02, headerFields.e_cblp, true);
  view.setUint16(0x04, headerFields.e_cp, true);
  view.setUint16(0x06, headerFields.e_crlc, true);
  view.setUint16(0x08, headerFields.e_cparhdr, true);
  view.setUint16(0x0a, headerFields.e_minalloc, true);
  view.setUint16(0x0c, headerFields.e_maxalloc, true);
  view.setUint16(0x0e, headerFields.e_ss, true);
  view.setUint16(0x10, headerFields.e_sp, true);
  view.setUint16(0x12, headerFields.e_csum, true);
  view.setUint16(0x14, headerFields.e_ip, true);
  view.setUint16(0x16, headerFields.e_cs, true);
  view.setUint16(0x18, headerFields.e_lfarlc, true);
  view.setUint16(0x1a, headerFields.e_ovno, true);

  if (headerSize >= 64) {
    // Write extended reserved words
    for (let i = 0; i < 4; i++) {
      view.setUint16(0x1c + i * 2, headerFields.e_res[i] ?? 0, true);
    }
    view.setUint16(0x24, headerFields.e_oemid, true);
    view.setUint16(0x26, headerFields.e_oeminfo, true);
    for (let i = 0; i < 10; i++) {
      view.setUint16(0x28 + i * 2, headerFields.e_res2[i] ?? 0, true);
    }
    view.setUint32(0x3c, headerFields.e_lfanew, true);
  }

  // Copy code opcodes after header
  const codeBytes = new Uint8Array(codeOpcodes);
  binary.set(codeBytes, headerSize);

  const headerBytes = binary.slice(0, headerSize);

  return {
    binary,
    headerFields,
    headerBytes,
    codeBytes,
    textOffsetInCode,
    textLength: rawTextBytes.length,
    fileSize: totalFileSize,
    headerSize,
    codeSize: codePayloadSize,
    mode: options.mode,
  };
}

/**
 * Parses any raw binary or .EXE file into MZ Header fields and extracts strings
 */
export function parseDosExe(bytes: Uint8Array): {
  isMz: boolean;
  header: DosHeaderFields | null;
  extractedString: string;
  subType: 'DOS' | 'PE' | 'NE' | 'LE' | 'UNKNOWN';
  headerSize: number;
  payloadSize: number;
} {
  if (bytes.length < 28) {
    return {
      isMz: false,
      header: null,
      extractedString: '',
      subType: 'UNKNOWN',
      headerSize: 0,
      payloadSize: 0,
    };
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const magic = view.getUint16(0x00, true);

  // Magic 0x5A4D ('MZ') or 0x4D5A ('ZM')
  const isMz = magic === 0x5a4d || magic === 0x4d5a;
  if (!isMz) {
    return {
      isMz: false,
      header: null,
      extractedString: '',
      subType: 'UNKNOWN',
      headerSize: 0,
      payloadSize: 0,
    };
  }

  const e_cblp = view.getUint16(0x02, true);
  const e_cp = view.getUint16(0x04, true);
  const e_crlc = view.getUint16(0x06, true);
  const e_cparhdr = view.getUint16(0x08, true);
  const e_minalloc = view.getUint16(0x0a, true);
  const e_maxalloc = view.getUint16(0x0c, true);
  const e_ss = view.getUint16(0x0e, true);
  const e_sp = view.getUint16(0x10, true);
  const e_csum = view.getUint16(0x12, true);
  const e_ip = view.getUint16(0x14, true);
  const e_cs = view.getUint16(0x16, true);
  const e_lfarlc = view.getUint16(0x18, true);
  const e_ovno = view.getUint16(0x1a, true);

  const headerSize = e_cparhdr * 16;
  const payloadSize = Math.max(0, bytes.length - headerSize);

  let e_res: number[] = [0, 0, 0, 0];
  let e_oemid = 0;
  let e_oeminfo = 0;
  let e_res2: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let e_lfanew = 0;
  let subType: 'DOS' | 'PE' | 'NE' | 'LE' | 'UNKNOWN' = 'DOS';

  if (bytes.length >= 64) {
    e_res = [
      view.getUint16(0x1c, true),
      view.getUint16(0x1e, true),
      view.getUint16(0x20, true),
      view.getUint16(0x22, true),
    ];
    e_oemid = view.getUint16(0x24, true);
    e_oeminfo = view.getUint16(0x26, true);
    e_res2 = [];
    for (let i = 0; i < 10; i++) {
      e_res2.push(view.getUint16(0x28 + i * 2, true));
    }
    e_lfanew = view.getUint32(0x3c, true);

    // Check if e_lfanew points to a valid secondary header
    if (e_lfanew > 0 && e_lfanew + 2 <= bytes.length) {
      const sig1 = bytes[e_lfanew];
      const sig2 = bytes[e_lfanew + 1];
      if (sig1 === 0x50 && sig2 === 0x45) {
        subType = 'PE'; // Portable Executable (Windows NT/95+)
      } else if (sig1 === 0x4e && sig2 === 0x45) {
        subType = 'NE'; // New Executable (Win16 / OS/2)
      } else if (sig1 === 0x4c && sig2 === 0x45) {
        subType = 'LE'; // Linear Executable (VxD)
      }
    }
  }

  const header: DosHeaderFields = {
    e_magic: magic,
    e_cblp,
    e_cp,
    e_crlc,
    e_cparhdr,
    e_minalloc,
    e_maxalloc,
    e_ss,
    e_sp,
    e_csum,
    e_ip,
    e_cs,
    e_lfarlc,
    e_ovno,
    e_res,
    e_oemid,
    e_oeminfo,
    e_res2,
    e_lfanew,
  };

  // Attempt to extract printable text strings from the DOS code/data section
  const payloadBytes = bytes.slice(headerSize);
  let bestString = '';
  let currentString = '';

  for (let i = 0; i < payloadBytes.length; i++) {
    const b = payloadBytes[i];
    if (b >= 32 && b <= 126) {
      currentString += String.fromCharCode(b);
    } else if (b === 10 || b === 13) {
      currentString += '\n';
    } else {
      if (currentString.trim().length > bestString.trim().length) {
        bestString = currentString;
      }
      currentString = '';
    }
  }
  if (currentString.trim().length > bestString.trim().length) {
    bestString = currentString;
  }

  return {
    isMz,
    header,
    extractedString: bestString.trim(),
    subType,
    headerSize,
    payloadSize,
  };
}

/**
 * Generates C/C++ Header Source Code
 */
export function generateCHeader(h: DosHeaderFields, text: string, bytes: Uint8Array): string {
  const hexBytes = Array.from(bytes.slice(0, 64))
    .map((b, i) => `0x${b.toString(16).padStart(2, '0')}${i === 63 ? '' : (i % 12 === 11 ? ',\n  ' : ', ')}`)
    .join('');

  return `/**
 * Generated MS-DOS MZ Executable Header (IMAGE_DOS_HEADER)
 * Text Payload: "${text.replace(/"/g, '\\"').slice(0, 40)}${text.length > 40 ? '...' : ''}"
 * Standard: Microsoft PE/COFF Specification & MS-DOS Reference
 */

#include <stdint.h>

#pragma pack(push, 1)
typedef struct _IMAGE_DOS_HEADER {
    uint16_t e_magic;      /* 0x00: Magic number (0x5A4D = "MZ") */
    uint16_t e_cblp;       /* 0x02: Bytes on last 512-byte page  */
    uint16_t e_cp;         /* 0x04: Pages in file (512-byte)     */
    uint16_t e_crlc;       /* 0x06: Relocations count            */
    uint16_t e_cparhdr;    /* 0x08: Header size in paragraphs    */
    uint16_t e_minalloc;   /* 0x0A: Minimum extra paragraphs     */
    uint16_t e_maxalloc;   /* 0x0C: Maximum extra paragraphs     */
    uint16_t e_ss;         /* 0x0E: Initial (relative) SS        */
    uint16_t e_sp;         /* 0x10: Initial SP value             */
    uint16_t e_csum;       /* 0x12: Checksum                     */
    uint16_t e_ip;         /* 0x14: Initial IP value             */
    uint16_t e_cs;         /* 0x16: Initial (relative) CS        */
    uint16_t e_lfarlc;     /* 0x18: Relocation table file offset */
    uint16_t e_ovno;       /* 0x1A: Overlay number               */
    uint16_t e_res[4];     /* 0x1C: Reserved words               */
    uint16_t e_oemid;      /* 0x24: OEM identifier               */
    uint16_t e_oeminfo;    /* 0x26: OEM information              */
    uint16_t e_res2[10];   /* 0x28: Reserved words               */
    uint32_t e_lfanew;     /* 0x3C: File address of new exe (PE) */
} IMAGE_DOS_HEADER, *PIMAGE_DOS_HEADER;
#pragma pack(pop)

const IMAGE_DOS_HEADER dos_header = {
    .e_magic    = 0x${h.e_magic.toString(16).toUpperCase()},      /* 'MZ' */
    .e_cblp     = 0x${h.e_cblp.toString(16).padStart(4, '0').toUpperCase()},      /* ${h.e_cblp} bytes */
    .e_cp       = 0x${h.e_cp.toString(16).padStart(4, '0').toUpperCase()},      /* ${h.e_cp} pages */
    .e_crlc     = 0x${h.e_crlc.toString(16).padStart(4, '0').toUpperCase()},      /* ${h.e_crlc} relocations */
    .e_cparhdr  = 0x${h.e_cparhdr.toString(16).padStart(4, '0').toUpperCase()},      /* ${h.e_cparhdr * 16} bytes */
    .e_minalloc = 0x${h.e_minalloc.toString(16).padStart(4, '0').toUpperCase()},
    .e_maxalloc = 0x${h.e_maxalloc.toString(16).padStart(4, '0').toUpperCase()},
    .e_ss       = 0x${h.e_ss.toString(16).padStart(4, '0').toUpperCase()},
    .e_sp       = 0x${h.e_sp.toString(16).padStart(4, '0').toUpperCase()},
    .e_csum     = 0x${h.e_csum.toString(16).padStart(4, '0').toUpperCase()},
    .e_ip       = 0x${h.e_ip.toString(16).padStart(4, '0').toUpperCase()},
    .e_cs       = 0x${h.e_cs.toString(16).padStart(4, '0').toUpperCase()},
    .e_lfarlc   = 0x${h.e_lfarlc.toString(16).padStart(4, '0').toUpperCase()},
    .e_ovno     = 0x${h.e_ovno.toString(16).padStart(4, '0').toUpperCase()},
    .e_res      = {0x0000, 0x0000, 0x0000, 0x0000},
    .e_oemid    = 0x0000,
    .e_oeminfo  = 0x0000,
    .e_res2     = {0},
    .e_lfanew   = 0x${h.e_lfanew.toString(16).padStart(8, '0').toUpperCase()}
};

/* Raw 64-byte Header Bytes */
const uint8_t raw_dos_header[64] = {
  ${hexBytes}
};
`;
}

/**
 * Generates NASM Assembly Source
 */
export function generateNasmSource(h: DosHeaderFields, text: string, mode: string): string {
  const safeText = text.replace(/'/g, "', 27h, '");

  return `; ==============================================================================
; MS-DOS MZ Executable Assembly Source (NASM Syntax)
; Assembles to a 100% valid MS-DOS .EXE runnable under DOSBox, FreeDOS, or 8086 PC
; Compile: nasm -f bin -o output.exe source.asm
; ==============================================================================

[BITS 16]
[ORG 0x0000]

; --- MS-DOS MZ Header (64 bytes) ---
dos_header:
    db 'MZ'                                ; e_magic: 0x5A4D Signature
    dw (end_file - dos_header) % 512       ; e_cblp: bytes on last page
    dw ((end_file - dos_header) + 511) / 512 ; e_cp: 512-byte pages
    dw 0x0000                              ; e_crlc: relocations count
    dw 0x0004                              ; e_cparhdr: 4 paragraphs (64 bytes)
    dw 0x0000                              ; e_minalloc
    dw 0xFFFF                              ; e_maxalloc
    dw 0x0000                              ; e_ss
    dw 0x0200                              ; e_sp: 512-byte stack
    dw 0x0000                              ; e_csum
    dw 0x0000                              ; e_ip: entry point offset
    dw 0x0000                              ; e_cs: code segment
    dw 0x0040                              ; e_lfarlc: relocation table offset
    dw 0x0000                              ; e_ovno: overlay
    times 4 dw 0x0000                      ; e_res[4]
    dw 0x0000                              ; e_oemid
    dw 0x0000                              ; e_oeminfo
    times 10 dw 0x0000                     ; e_res2[10]
    dd 0x00000000                          ; e_lfanew: PE offset (0 for pure DOS)

; --- Program Code & Data (Starts at offset 0x40 / paragraph 4) ---
entry_point:
    push cs
    pop ds                                 ; DS = CS (load address)
    
${mode === 'dos_int21_02' ? `    mov si, msg_text
print_loop:
    mov dl, [si]
    test dl, dl
    jz exit_program
    mov ah, 0x02                           ; DOS Print Character
    int 0x21
    inc si
    jmp print_loop
exit_program:` : mode === 'bios_int10' ? `    mov si, msg_text
teletype_loop:
    mov al, [si]
    test al, al
    jz exit_program
    mov ah, 0x0E                           ; BIOS Teletype
    mov bx, 0x0007                         ; Page 0, Light Gray
    int 0x10
    inc si
    jmp teletype_loop
exit_program:` : `    mov dx, msg_text                       ; Offset of text string
    mov ah, 0x09                           ; DOS INT 21h AH=09h Print String
    int 0x21`}

    mov ax, 0x4C00                         ; DOS Exit with returncode 0
    int 0x21

; --- Text Payload ---
msg_text:
    db '${safeText}', 0x0D, 0x0A, '$'

end_file:
`;
}

/**
 * Generates Classic DOS DEBUG.COM script
 * Users can redirect this directly into debug.com on an original IBM PC or DOSBox!
 */
export function generateDebugScript(bytes: Uint8Array): string {
  const hexArray = Array.from(bytes);
  const lines: string[] = [];
  lines.push('; Classic MS-DOS DEBUG.COM Script');
  lines.push('; In MS-DOS prompt: debug < script.scr');
  lines.push('a 100');

  for (let i = 0; i < hexArray.length; i += 8) {
    const chunk = hexArray.slice(i, i + 8);
    lines.push(`db ${chunk.map(b => b.toString(16).padStart(2, '0').toUpperCase() + 'h').join(', ')}`);
  }
  lines.push(''); // blank line to exit assemble mode
  lines.push('r cx');
  lines.push(bytes.length.toString(16).toUpperCase());
  lines.push('n OUTPUT.EXE');
  lines.push('w');
  lines.push('q');
  return lines.join('\n');
}

/**
 * Generates a formatted Hex Dump string
 */
export function generateHexDump(bytes: Uint8Array): string {
  const lines: string[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const offset = i.toString(16).padStart(8, '0').toUpperCase();
    const chunk = bytes.slice(i, i + 16);
    const hexPart: string[] = [];
    let asciiPart = '';

    for (let j = 0; j < 16; j++) {
      if (j < chunk.length) {
        const b = chunk[j];
        hexPart.push(b.toString(16).padStart(2, '0').toUpperCase());
        asciiPart += (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.';
      } else {
        hexPart.push('  ');
        asciiPart += ' ';
      }
      if (j === 7) hexPart.push(''); // spacing in middle
    }

    lines.push(`${offset}  ${hexPart.join(' ')}  |${asciiPart}|`);
  }
  return lines.join('\n');
}
