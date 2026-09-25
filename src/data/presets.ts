import { GenerationMode } from '../types/dos';

export interface Preset {
  id: string;
  name: string;
  mode: GenerationMode;
  text: string;
  description: string;
}

export const PRESETS: Preset[] = [
  {
    id: 'hello_dos',
    name: 'Hello, MS-DOS!',
    mode: 'dos_int21_09',
    text: 'Hello, World from MS-DOS 6.22!\r\nWelcome to 16-bit real mode.',
    description: 'Standard MS-DOS application using INT 21h, Function 09h ($ terminated).',
  },
  {
    id: 'pe_stub',
    name: 'Windows PE DOS Stub',
    mode: 'pe_stub',
    text: 'This program cannot be run in DOS mode.',
    description: 'The canonical DOS stub present at the start of every modern Windows .exe (PE) since Windows NT 3.1.',
  },
  {
    id: 'ascii_art',
    name: 'Retro ASCII Art Banner',
    mode: 'dos_int21_09',
    text: `  _________________________
 /                         \\
|   MS-DOS EXE HEADER 1983  |
|       [ 8086 CPU ]        |
 \\_________________________/
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||`,
    description: 'Multi-line ASCII illustration compiled into a runnable real-mode executable.',
  },
  {
    id: 'mark_zbikowski',
    name: 'Mark Zbikowski Tribute (MZ)',
    mode: 'dos_int21_09',
    text: 'MZ = Mark Zbikowski, architect of MS-DOS 2.0!\r\nEvery Windows 11 EXE still starts with his initials 40+ years later.',
    description: 'Historical note on why the magic number 0x5A4D ("MZ") exists in all executables.',
  },
  {
    id: 'bios_teletype',
    name: 'Bare-Metal BIOS Teletype',
    mode: 'bios_int10',
    text: 'Booting directly via BIOS INT 10h (AH=0Eh)!\r\nNo DOS kernel required.',
    description: 'Loop that prints characters through IBM PC BIOS video service, independent of DOS.',
  },
  {
    id: 'slack_secret',
    name: 'Steganographic Header Slack',
    mode: 'slack_space',
    text: 'SECRET_PAYLOAD_IN_HEADER_SLACK',
    description: 'Injects ASCII bytes directly into the reserved header fields (e_res & e_res2).',
  },
];
