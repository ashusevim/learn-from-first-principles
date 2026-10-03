# The Web from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that traces one page load byte-by-byte — DNS, TCP, TLS, HTTP/2,
parsing, the cascade, layout, paint — then builds a mini browser, until the web's stack
becomes a machine you've personally held.

Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle)
(siblings: [Linux](../linux-from-first-principles), [Networking](../networking-from-first-principles),
[Databases](../databases-from-first-principles), [Containers](../containers-from-first-principles)).

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

**Part I — The Pipe**
1. One Page Load, Traced End to End ✅
2. DNS in the Browser: Caches All the Way Down ✅
3. TCP & TLS: The Connection Tax ✅
4. HTTP/2: One Connection, Many Streams ✅

**Part II — The Document**
5. HTML Parsing & the DOM Tree ✅
6. CSS: Selectors, Specificity & the Cascade ✅
7. JavaScript: The Single Thread That Runs Everything ✅
8. The Render Pipeline: Layout, Paint, Composite ✅

**Part III — Fast & Modern**
9. Caching: The Headers That Save the World ✅
10. Compression & Images: Bytes on the Wire ✅
11. HTTP/3 & QUIC: The UDP Gamble ✅
12. Final Boss: A Mini Browser in ~300 Lines ✅ *(fetch → parse → cascade → layout → render)*

All 12 chapters are fully written, each with runnable measurements and a hands-on build.
Things you build along the way: a five-number page-load harness, a TTL-honest DNS cache,
a connection-tax model, h1/h2/h3 stall simulations, a forgiving HTML tokenizer, a CSS
specificity resolver that predicts every winner, a browser-faithful event loop, a
block-layout engine showing the reflow cascade, an ETag server, a bytes audit, and a
mini browser that draws remote pages.

## The rules of the course

1. **Start below the abstraction.** Before "optimize your site", answer "what happens
   between Enter and pixels?"
2. **Nothing is magic.** Every hop is measurable with devtools, curl, tcpdump.
3. **Build a toy version.** Tokenizer, cascade resolver, event-loop tracer, mini browser.
4. **Then the standards are readable.** The course ends where the specs begin to feel familiar.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages are all welcome —
open an issue or PR. The goal is simple: help people understand.

## Code

Second-language implementations of the flagship builds live in `code/`:

`code/go/tokenizer.go` (Chapter 5's forgiving HTML tokenizer).
