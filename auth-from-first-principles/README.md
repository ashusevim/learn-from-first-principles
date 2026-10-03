# Auth from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that builds authentication from first principles — password
hashing, session tokens, cookies, JWT signed claims, OAuth delegation — breaking
every naive construction on the way, and composing the defenses into a complete
auth system.

Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle)
(siblings: [Cryptography](../cryptography-from-first-principles), [The Web](../the-web-from-first-principles),
[Compilers](../compilers-from-first-principles), [LLMs](../llms-from-first-principles)).

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

**Part I — Identity Foundations**
1. What Is Auth, Really? ✅
2. Password Storage Done Right ✅
3. Sessions: The Server Remembers ✅

**Part II — Tokens**
4. Cookies & the Browser Contract ✅
5. JWT: Signed Claims ✅
6. JWT Pitfalls: alg=none & the Confusion Attacks ✅

**Part III — Delegation**
7. OAuth 2.0: The Delegation Problem ✅
8. OpenID Connect: Who Are You? ✅
9. API Keys & Machine Identity ✅

**Part IV — The Real World**
10. TLS: Auth Without the Channel Is Theater ✅
11. The Attack Catalog: CSRF, XSS, Fixation & Stuffing ✅
12. Final Boss: A Complete Auth System in ~300 Lines ✅ *(register/login/sessions/protected routes)*

All 12 chapters are fully written, each with runnable stdlib-Python builds and
staged attacks. Things you build along the way: the naive system's three holes
demonstrated, PBKDF2 register/login, a session store with expiry and logout, a
cookie jar enforcing the contract, JWTs built and tamper-detected, the alg=none
and confusion attacks performed, the OAuth code flow simulated, OIDC claims
verified, scoped API keys with rotation, the http:// theater demonstrated, four
classic attacks staged and blocked — and the complete auth system.

## The rules of the course

1. **Start below the abstraction.** Before "use OAuth", answer "what does a session token actually prove?"
2. **Break the naive system.** Every weak construction gets attacked — by you, successfully.
3. **Build the real thing.** Passwords, sessions, JWT, OAuth — all stdlib Python.
4. **Assemble honestly.** The finale composes every defense — and names the remaining gaps.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages are all welcome —
open an issue or PR. The goal is simple: help people understand.
