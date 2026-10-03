# The First Principles Project

> Don't memorize the tool. Understand the machine.

A family of free, open-source courses that teach technology **from first principles**.
Every course starts at the layer nobody shows you — what the hardware, kernel, or protocol is
actually doing — and builds up until the frameworks and tools you use every day become obvious.

Each course is a standalone Astro site, deployed free, with runnable code snippets that
**prove** every claim. Not "trust me" — "run this yourself and watch it happen."

## Courses

| # | Course | Status | What you build to prove it |
|---|--------|--------|----------------------------|
| 1 | [Linux from First Principles](./linux-from-first-principles) | 🟢 Complete — 14/14 chapters | A container from raw namespaces + cgroups |
| 2 | [Networking from First Principles](./networking-from-first-principles) | 🟢 Complete — 12/12 chapters | A TCP stack over raw Ethernet frames |
| 3 | [Databases from First Principles](./databases-from-first-principles) | 🟢 Complete — 12/12 chapters | A toy RDBMS: storage engine, B-tree, WAL |
| 4 | [Git from First Principles](./git-from-first-principles) | 🟢 Complete — 12/12 chapters | mini-git in ~200 lines |
| 5 | [Concurrency & Async from First Principles](./concurrency-from-first-principles) | 🟢 Complete — 12/12 chapters | Your own event loop |
| 6 | [Containers from First Principles](./containers-from-first-principles) | 🟢 Complete — 12/12 chapters | Docker's core, from kernel features up |
| 7 | [Distributed Systems from First Principles](./distributed-systems-from-first-principles) | 🟢 Complete — 12/12 chapters | Raft consensus, working replication |
| 8 | [The Web from First Principles](./the-web-from-first-principles) | 🟢 Complete — 12/12 chapters | One page load traced byte-by-byte |
| 9 | [React from First Principles](./react-from-first-principles) | 🟢 Complete — 12/12 chapters | A 100-line React with hooks |
| 10 | [A Browser from First Principles](./a-browser-from-first-principles) | 🟢 Complete — 12/12 chapters | HTML parser → CSS engine → layout |
| 11 | [Search Engines from First Principles](./search-engines-from-first-principles) | 🟢 Complete — 12/12 chapters | A mini-Google: crawler, index, ranking |
| 12 | [LLMs from First Principles](./llms-from-first-principles) | 🟢 Complete — 12/12 chapters | A transformer that generates text |
| 13 | [ML Foundations from First Principles](./ml-foundations-from-first-principles) | 🟢 Complete — 12/12 chapters | Backprop + a tiny autograd engine |
| 14 | [Cryptography from First Principles](./cryptography-from-first-principles) | 🟢 Complete — 12/12 chapters | Hashes → ciphers → a TLS handshake |
| 15 | [Compilers from First Principles](./compilers-from-first-principles) | 🟢 Complete — 12/12 chapters | Lexer → parser → bytecode VM |
| 16 | [Regex from First Principles](./regex-from-first-principles) | 🟢 Complete — 12/12 chapters | A regex engine from NFA/DFA theory |
| 17 | [Graphics from First Principles](./graphics-from-first-principles) | 🟢 Complete — 12/12 chapters | A software rasterizer → ray tracer |
| 18 | [Game Engines from First Principles](./game-engines-from-first-principles) | 🟢 Complete — 12/12 chapters | Game loop, ECS, physics |
| 19 | [Audio & DSP from First Principles](./audio-dsp-from-first-principles) | 🟢 Complete — 12/12 chapters | A synthesizer, samples to sound |
| 20 | [CPUs from First Principles](./cpus-from-first-principles) | 🟢 Complete — 12/12 chapters | Logic gates → ALU → a running program |
| 21 | [Emulation from First Principles](./emulation-from-first-principles) | 🟢 Complete — 12/12 chapters | CHIP-8 emulator running real ROMs |
| 22 | [Auth from First Principles](./auth-from-first-principles) | 🟢 Complete — 12/12 chapters | Sessions, JWT, OAuth |
| 23 | [Observability from First Principles](./observability-from-first-principles) | 🟢 Complete — 12/12 chapters | Logs, metrics, traces |
| 24 | [Blockchain from First Principles](./blockchain-from-first-principles) | 🟢 Complete — 12/12 chapters | Toy chain with proof-of-work |

## The method (every course follows this)

1. **Start below the abstraction.** Before "how to use X", answer "what is X made of?"
2. **Nothing is magic.** Every concept comes with a snippet you can run to see it happen.
3. **Build a toy version.** If you can build a 300-line version of it, you understand it.
4. **Then the real tool is obvious.** The course ends where the documentation begins.

## Running a course locally

```sh
cd <course-folder>
npm install
npm run dev      # local dev server
npm run build    # static build in dist/
```

Each course is deployable free on Vercel / Netlify / GitHub Pages.

## Contributing

Spotted a mistake? That's the best kind of issue to open. Explanations, diagrams,
snippets in other languages — all welcome. The goal is simple: **help people understand.**
