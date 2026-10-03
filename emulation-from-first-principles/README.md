# Emulation from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that builds an emulator from first principles — memory, registers,
fetch-decode-execute for a foreign ISA, 35 opcodes, XOR sprites, timers, sound —
ending with a complete CHIP-8 emulator running real ROMs unmodified.

Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle)
(siblings: [CPUs](../cpus-from-first-principles), [Graphics](../graphics-from-first-principles),
[Compilers](../compilers-from-first-principles), [Cryptography](../cryptography-from-first-principles)).

## Read it

```sh
npm install
npm run dev      # http://localhost:4321
```

Or build and deploy anywhere static:

```sh
npm run build    # outputs dist/
```

## The course

**Part I — The Machine**
1. What Is Emulation, Really? ✅
2. Fetch–Decode–Execute, Again — For Someone Else's CPU ✅
3. Opcode Decoding: The Wild Encodings ✅

**Part II — Screen & Sound**
4. Graphics: The 64×32 Display ✅
5. Timers & Input: The Heartbeat ✅
6. Sound: The Beeper ✅

**Part III — A Real Program**
7. Writing CHIP-8 Programs ✅
8. ROMs: Loading Real Software ✅
9. Debugging the Emulator ✅

**Part IV — The Real World**
10. Why Emulation Is Hard: The Quirks ✅
11. Beyond CHIP-8: NES, Cycle Accuracy & Recompilation ✅
12. Final Boss: The Complete Emulator in ~400 Lines ✅ *(full CHIP-8, real ROMs)*

All 12 chapters are fully written, each with runnable builds and verified outputs.
Things you build along the way: the emulator skeleton, big-endian fetch-decode-
execute, the complete 35-opcode dispatcher, XOR sprites with the collision flag,
the 60 Hz decimated timer loop, a beeper through the audio course's pipeline, a
hand-assembled moving-sprite program, a real ROM loader and maze render, trace
mode with breakpoints, quirk toggles with both folklore interpretations — and the
complete emulator.

## The rules of the course

1. **Start below the abstraction.** Before "emulators are wizardry", answer "what is an opcode, physically?"
2. **Nothing is magic.** Every opcode is a case in a switch — readable and testable.
3. **Run real software.** Public-domain ROMs, unmodified, on your emulator.
4. **Then the quirks become history.** Every disagreement traces to the original hardware.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages are all welcome —
open an issue or PR. The goal is simple: help people understand.
