/**
 * 8086 Real-Mode CPU & MS-DOS Subsystem Emulator
 * Simulates segmented memory, register execution, DOS INT 21h, and BIOS INT 10h.
 */

import { CpuState, DisassembledInstruction, DosHeaderFields } from '../types/dos';

export class Dos8086VirtualMachine {
  // 1 Megabyte 8086 real mode memory
  public memory = new Uint8Array(1024 * 1024);
  public cpu: CpuState;
  public screenOutput: string[] = ['']; // Lines of text printed to DOS console
  public cursorCol = 0;
  public cursorRow = 0;
  public logMessages: string[] = [];
  public loadSegment = 0x1000; // Load segment for DOS program (standard base 0x1000:0000)
  public pspSegment = 0x0FF0;  // Program Segment Prefix 256 bytes before load segment
  public maxInstructions = 20000;

  constructor() {
    this.cpu = this.createInitialCpuState();
  }

  public reset() {
    this.memory.fill(0);
    this.cpu = this.createInitialCpuState();
    this.screenOutput = [''];
    this.cursorCol = 0;
    this.cursorRow = 0;
    this.logMessages = [];
  }

  private createInitialCpuState(): CpuState {
    return {
      ax: 0x0000,
      bx: 0x0000,
      cx: 0x0000,
      dx: 0x0000,
      si: 0x0000,
      di: 0x0000,
      bp: 0x0000,
      sp: 0x0200,
      cs: this.loadSegment,
      ds: this.pspSegment,
      ss: this.loadSegment,
      es: this.pspSegment,
      ip: 0x0000,
      flags: {
        cf: false,
        zf: false,
        sf: false,
        of: false,
        if: true,
        df: false,
      },
      halted: false,
      cycles: 0,
    };
  }

  /**
   * Loads an MZ executable binary into memory according to the MZ header specifications
   */
  public loadMzExecutable(binary: Uint8Array, header: DosHeaderFields) {
    this.reset();

    const headerSize = header.e_cparhdr * 16;
    const payloadBytes = binary.slice(headerSize);

    // Physical load address in 8086 segmented address space: (loadSegment * 16)
    const loadPhysicalAddress = this.loadSegment * 16;

    // Load payload directly into memory at loadPhysicalAddress
    for (let i = 0; i < payloadBytes.length; i++) {
      if (loadPhysicalAddress + i < this.memory.length) {
        this.memory[loadPhysicalAddress + i] = payloadBytes[i];
      }
    }

    // Set initial register state according to MZ Header
    this.cpu.cs = (this.loadSegment + header.e_cs) & 0xffff;
    this.cpu.ip = header.e_ip & 0xffff;
    this.cpu.ss = (this.loadSegment + header.e_ss) & 0xffff;
    this.cpu.sp = header.e_sp & 0xffff;
    this.cpu.ds = this.loadSegment; // In typical DOS loaders DS/ES start at PSP (0x0FF0) or LoadSegment
    this.cpu.es = this.loadSegment;

    this.logMessages.push(
      `[DOS EXEC] Program loaded at ${this.loadSegment.toString(16).toUpperCase()}:0000 (Payload size: ${payloadBytes.length} bytes)`,
      `[MZ LOADER] Entry Point: CS:IP = ${this.cpu.cs.toString(16).padStart(4, '0').toUpperCase()}:${this.cpu.ip.toString(16).padStart(4, '0').toUpperCase()}`,
      `[MZ LOADER] Stack: SS:SP = ${this.cpu.ss.toString(16).padStart(4, '0').toUpperCase()}:${this.cpu.sp.toString(16).padStart(4, '0').toUpperCase()}`
    );
  }

  /**
   * Helper to resolve physical address: Segment * 16 + Offset
   */
  public getPhysicalAddress(segment: number, offset: number): number {
    return ((segment & 0xffff) * 16 + (offset & 0xffff)) & 0xfffff; // 20-bit address bus (1MB wrap)
  }

  public readByte(segment: number, offset: number): number {
    const addr = this.getPhysicalAddress(segment, offset);
    return this.memory[addr];
  }

  public writeByte(segment: number, offset: number, val: number) {
    const addr = this.getPhysicalAddress(segment, offset);
    this.memory[addr] = val & 0xff;
  }

  public readWord(segment: number, offset: number): number {
    const lo = this.readByte(segment, offset);
    const hi = this.readByte(segment, offset + 1);
    return lo | (hi << 8);
  }

  public push16(val: number) {
    this.cpu.sp = (this.cpu.sp - 2) & 0xffff;
    const addr = this.getPhysicalAddress(this.cpu.ss, this.cpu.sp);
    this.memory[addr] = val & 0xff;
    this.memory[addr + 1] = (val >> 8) & 0xff;
  }

  public pop16(): number {
    const addr = this.getPhysicalAddress(this.cpu.ss, this.cpu.sp);
    const lo = this.memory[addr];
    const hi = this.memory[addr + 1];
    this.cpu.sp = (this.cpu.sp + 2) & 0xffff;
    return lo | (hi << 8);
  }

  /**
   * Disassembles instruction at current CS:IP or given offset
   */
  public disassembleAt(cs: number, ip: number): DisassembledInstruction {
    const b0 = this.readByte(cs, ip);
    const b1 = this.readByte(cs, ip + 1);
    const b2 = this.readByte(cs, ip + 2);

    if (b0 === 0x0e) {
      return {
        offset: ip,
        bytes: [0x0e],
        mnemonic: 'PUSH',
        operands: 'CS',
        description: 'Push Code Segment register onto stack',
      };
    }
    if (b0 === 0x1f) {
      return {
        offset: ip,
        bytes: [0x1f],
        mnemonic: 'POP',
        operands: 'DS',
        description: 'Pop Stack into Data Segment register (DS = CS)',
      };
    }
    if (b0 === 0xba) {
      const imm16 = b1 | (b2 << 8);
      return {
        offset: ip,
        bytes: [0xba, b1, b2],
        mnemonic: 'MOV',
        operands: `DX, 0x${imm16.toString(16).padStart(4, '0').toUpperCase()}`,
        description: `Load DX with string offset 0x${imm16.toString(16).toUpperCase()}`,
      };
    }
    if (b0 === 0xbe) {
      const imm16 = b1 | (b2 << 8);
      return {
        offset: ip,
        bytes: [0xbe, b1, b2],
        mnemonic: 'MOV',
        operands: `SI, 0x${imm16.toString(16).padStart(4, '0').toUpperCase()}`,
        description: `Load SI with text buffer address 0x${imm16.toString(16).toUpperCase()}`,
      };
    }
    if (b0 === 0xb4) {
      return {
        offset: ip,
        bytes: [0xb4, b1],
        mnemonic: 'MOV',
        operands: `AH, 0x${b1.toString(16).padStart(2, '0').toUpperCase()}`,
        description: `Set DOS/BIOS function subcode AH = 0x${b1.toString(16).toUpperCase()}`,
      };
    }
    if (b0 === 0xb8) {
      const imm16 = b1 | (b2 << 8);
      return {
        offset: ip,
        bytes: [0xb8, b1, b2],
        mnemonic: 'MOV',
        operands: `AX, 0x${imm16.toString(16).padStart(4, '0').toUpperCase()}`,
        description: `Set AX = 0x${imm16.toString(16).toUpperCase()} (DOS Exit Function)`,
      };
    }
    if (b0 === 0xbb) {
      const imm16 = b1 | (b2 << 8);
      return {
        offset: ip,
        bytes: [0xbb, b1, b2],
        mnemonic: 'MOV',
        operands: `BX, 0x${imm16.toString(16).padStart(4, '0').toUpperCase()}`,
        description: `Set BX = 0x${imm16.toString(16).toUpperCase()} (Video attribute / page)`,
      };
    }
    if (b0 === 0x8a && b1 === 0x14) {
      return {
        offset: ip,
        bytes: [0x8a, 0x14],
        mnemonic: 'MOV',
        operands: 'DL, [SI]',
        description: 'Load byte from DS:SI into DL register',
      };
    }
    if (b0 === 0x8a && b1 === 0x04) {
      return {
        offset: ip,
        bytes: [0x8a, 0x04],
        mnemonic: 'MOV',
        operands: 'AL, [SI]',
        description: 'Load byte from DS:SI into AL register',
      };
    }
    if (b0 === 0x84 && b1 === 0xd2) {
      return {
        offset: ip,
        bytes: [0x84, 0xd2],
        mnemonic: 'TEST',
        operands: 'DL, DL',
        description: 'Test if character in DL is null terminator (0x00)',
      };
    }
    if (b0 === 0x84 && b1 === 0xc0) {
      return {
        offset: ip,
        bytes: [0x84, 0xc0],
        mnemonic: 'TEST',
        operands: 'AL, AL',
        description: 'Test if character in AL is null terminator (0x00)',
      };
    }
    if (b0 === 0x74) {
      const rel8 = (b1 << 24) >> 24; // sign extend
      const target = (ip + 2 + rel8) & 0xffff;
      return {
        offset: ip,
        bytes: [0x74, b1],
        mnemonic: 'JZ',
        operands: `0x${target.toString(16).padStart(4, '0').toUpperCase()}`,
        description: `Jump if Zero flag is set to 0x${target.toString(16).toUpperCase()}`,
      };
    }
    if (b0 === 0x75) {
      const rel8 = (b1 << 24) >> 24;
      const target = (ip + 2 + rel8) & 0xffff;
      return {
        offset: ip,
        bytes: [0x75, b1],
        mnemonic: 'JNZ',
        operands: `0x${target.toString(16).padStart(4, '0').toUpperCase()}`,
        description: `Jump if Not Zero flag is set to 0x${target.toString(16).toUpperCase()}`,
      };
    }
    if (b0 === 0x46) {
      return {
        offset: ip,
        bytes: [0x46],
        mnemonic: 'INC',
        operands: 'SI',
        description: 'Increment SI pointer to next character',
      };
    }
    if (b0 === 0xeb) {
      const rel8 = (b1 << 24) >> 24;
      const target = (ip + 2 + rel8) & 0xffff;
      return {
        offset: ip,
        bytes: [0xeb, b1],
        mnemonic: 'JMP',
        operands: `0x${target.toString(16).padStart(4, '0').toUpperCase()}`,
        description: `Unconditional short jump to 0x${target.toString(16).toUpperCase()}`,
      };
    }
    if (b0 === 0xcd && b1 === 0x21) {
      return {
        offset: ip,
        bytes: [0xcd, 0x21],
        mnemonic: 'INT',
        operands: '21h',
        description: 'Invoke MS-DOS API Service Interrupt',
      };
    }
    if (b0 === 0xcd && b1 === 0x10) {
      return {
        offset: ip,
        bytes: [0xcd, 0x10],
        mnemonic: 'INT',
        operands: '10h',
        description: 'Invoke BIOS Video Service Interrupt',
      };
    }
    if (b0 === 0x90) {
      return {
        offset: ip,
        bytes: [0x90],
        mnemonic: 'NOP',
        operands: '',
        description: 'No operation',
      };
    }
    if (b0 === 0xf4) {
      return {
        offset: ip,
        bytes: [0xf4],
        mnemonic: 'HLT',
        operands: '',
        description: 'Halt CPU',
      };
    }

    return {
      offset: ip,
      bytes: [b0],
      mnemonic: 'DB',
      operands: `0x${b0.toString(16).padStart(2, '0').toUpperCase()}`,
      description: 'Data or unhandled opcode',
    };
  }

  /**
   * Executes a single instruction at CS:IP
   */
  public step(): boolean {
    if (this.cpu.halted) return false;

    const op = this.disassembleAt(this.cpu.cs, this.cpu.ip);
    this.cpu.cycles++;

    // Advance IP past current instruction
    const currentIp = this.cpu.ip;
    this.cpu.ip = (this.cpu.ip + op.bytes.length) & 0xffff;

    // Handle Opcode
    const b0 = op.bytes[0];
    const b1 = op.bytes[1] ?? 0;
    const b2 = op.bytes[2] ?? 0;

    if (b0 === 0x0e) {
      // PUSH CS
      this.push16(this.cpu.cs);
      return true;
    }

    if (b0 === 0x1f) {
      // POP DS
      this.cpu.ds = this.pop16();
      return true;
    }

    if (b0 === 0xba) {
      // MOV DX, imm16
      this.cpu.dx = b1 | (b2 << 8);
      return true;
    }

    if (b0 === 0xbe) {
      // MOV SI, imm16
      this.cpu.si = b1 | (b2 << 8);
      return true;
    }

    if (b0 === 0xb4) {
      // MOV AH, imm8
      this.cpu.ax = (this.cpu.ax & 0x00ff) | (b1 << 8);
      return true;
    }

    if (b0 === 0xb8) {
      // MOV AX, imm16
      this.cpu.ax = b1 | (b2 << 8);
      return true;
    }

    if (b0 === 0xbb) {
      // MOV BX, imm16
      this.cpu.bx = b1 | (b2 << 8);
      return true;
    }

    if (b0 === 0x8a && b1 === 0x14) {
      // MOV DL, [SI]
      const charByte = this.readByte(this.cpu.ds, this.cpu.si);
      this.cpu.dx = (this.cpu.dx & 0xff00) | charByte;
      return true;
    }

    if (b0 === 0x8a && b1 === 0x04) {
      // MOV AL, [SI]
      const charByte = this.readByte(this.cpu.ds, this.cpu.si);
      this.cpu.ax = (this.cpu.ax & 0xff00) | charByte;
      return true;
    }

    if (b0 === 0x84 && (b1 === 0xd2 || b1 === 0xc0)) {
      // TEST DL, DL or TEST AL, AL
      const val = b1 === 0xd2 ? (this.cpu.dx & 0xff) : (this.cpu.ax & 0xff);
      this.cpu.flags.zf = val === 0;
      this.cpu.flags.sf = (val & 0x80) !== 0;
      this.cpu.flags.cf = false;
      this.cpu.flags.of = false;
      return true;
    }

    if (b0 === 0x74) {
      // JZ rel8
      if (this.cpu.flags.zf) {
        const rel8 = (b1 << 24) >> 24;
        this.cpu.ip = (this.cpu.ip + rel8) & 0xffff;
      }
      return true;
    }

    if (b0 === 0x75) {
      // JNZ rel8
      if (!this.cpu.flags.zf) {
        const rel8 = (b1 << 24) >> 24;
        this.cpu.ip = (this.cpu.ip + rel8) & 0xffff;
      }
      return true;
    }

    if (b0 === 0x46) {
      // INC SI
      this.cpu.si = (this.cpu.si + 1) & 0xffff;
      return true;
    }

    if (b0 === 0xeb) {
      // JMP short rel8
      const rel8 = (b1 << 24) >> 24;
      this.cpu.ip = (this.cpu.ip + rel8) & 0xffff;
      return true;
    }

    if (b0 === 0xcd && b1 === 0x21) {
      // INT 21h (MS-DOS API)
      const ah = (this.cpu.ax >> 8) & 0xff;
      const al = this.cpu.ax & 0xff;

      if (ah === 0x09) {
        // AH=09h: Print '$'-terminated string at DS:DX
        let strOffset = this.cpu.dx;
        let charCount = 0;
        while (charCount < 4096) {
          const charCode = this.readByte(this.cpu.ds, strOffset);
          if (charCode === 0x24) break; // '$' termination
          this.outputChar(charCode);
          strOffset = (strOffset + 1) & 0xffff;
          charCount++;
        }
        this.logMessages.push(`[DOS INT 21h AH=09h] Printed string (${charCount} chars) from DS:DX`);
        return true;
      }

      if (ah === 0x02) {
        // AH=02h: Print single character in DL
        const dl = this.cpu.dx & 0xff;
        this.outputChar(dl);
        return true;
      }

      if (ah === 0x4c) {
        // AH=4Ch: Exit program with return code AL
        this.cpu.halted = true;
        this.logMessages.push(`[DOS INT 21h AH=4Ch] Program terminated normally with exit code ${al}`);
        return false;
      }

      // Other DOS INT 21h functions
      this.logMessages.push(`[DOS INT 21h] Unhandled function AH=0x${ah.toString(16)}`);
      return true;
    }

    if (b0 === 0xcd && b1 === 0x10) {
      // INT 10h (BIOS Video)
      const ah = (this.cpu.ax >> 8) & 0xff;
      const al = this.cpu.ax & 0xff;

      if (ah === 0x0e) {
        // AH=0Eh: Teletype character in AL
        this.outputChar(al);
        return true;
      }

      this.logMessages.push(`[BIOS INT 10h] Video function AH=0x${ah.toString(16)}`);
      return true;
    }

    if (b0 === 0xf4) {
      // HLT
      this.cpu.halted = true;
      return false;
    }

    // Default: unknown opcode or hit text data
    this.logMessages.push(`[CPU] Stopped at offset 0x${currentIp.toString(16).toUpperCase()}: 0x${b0.toString(16)}`);
    this.cpu.halted = true;
    return false;
  }

  /**
   * Run until program halts or cycle limit reached
   */
  public run(maxSteps = 5000): { steps: number; halted: boolean } {
    let steps = 0;
    while (!this.cpu.halted && steps < maxSteps) {
      const ok = this.step();
      steps++;
      if (!ok) break;
    }
    return { steps, halted: this.cpu.halted };
  }

  /**
   * Emulates console character printing, handling CR/LF and tabs
   */
  private outputChar(byte: number) {
    if (byte === 0x0d) {
      // Carriage return '\r' -> cursor moves to col 0
      this.cursorCol = 0;
      return;
    }
    if (byte === 0x0a) {
      // Line feed '\n' -> new line
      this.screenOutput.push('');
      this.cursorRow++;
      this.cursorCol = 0;
      return;
    }
    if (byte === 0x09) {
      // Tab '\t' -> advance 4 spaces
      const spaces = 4 - (this.cursorCol % 4);
      for (let s = 0; s < spaces; s++) {
        this.outputChar(0x20);
      }
      return;
    }

    const char = String.fromCharCode(byte);
    const lastIndex = this.screenOutput.length - 1;
    this.screenOutput[lastIndex] += char;
    this.cursorCol++;
  }
}
