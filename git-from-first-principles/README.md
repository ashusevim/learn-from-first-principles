# Git from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that opens the `.git` directory and teaches Git from the hash up —
blobs, trees, refs, packfiles — until the porcelain commands stop being incantations and
become obvious wrappers over a database you fully understand.

Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle)
(siblings: [Linux](../linux-from-first-principles) and [Networking](../networking-from-first-principles)).

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

**Part I — The Object Database**
1. Git Is a Key-Value Store ✅
2. Trees & Commits: Snapshots, Not Diffs ✅
3. Branches & HEAD: It's All Just Files ✅

**Part II — The Mechanics**
4. The Index: Staging Is a File ✅
5. Packfiles & Deltas: Why .git Is Small ✅
6. git status Demystified: The Three Trees ✅

**Part III — Working with Others**
7. Remotes: Copying Objects, Moving Pointers ✅
8. Merge: Three-Way and the Conflict Markers ✅
9. Rebase: Rewriting History ✅

**Part IV — Recovery & Mastery**
10. Reflog: Nothing Is Ever Lost ✅
11. Hooks, Worktrees & Attributes ✅
12. Final Boss: mini-git in ~200 Lines ✅ *(a working VCS in one Python file)*

All 12 chapters are fully written, each with runnable proofs and a hands-on build.
Things you build along the way: a raw blob store Git reads natively, a handcrafted commit,
branches made with `echo`, commits from the index, a packfile audit, your own git status,
a fetch performed by hand, a dissected merge conflict, a handmade rebase, a disaster
recovery drill, and mini-git itself.

## The rules of the course

1. **Start below the abstraction.** Before "how to branch", answer "what is a branch, physically?"
2. **Nothing is magic.** Every Git concept is a file in `.git` you can read with `cat`.
3. **Build a toy version.** The finale: a working mini-git — init/add/commit/log — in ~300 lines.
4. **Then the porcelain is obvious.** The course ends where `git help` becomes redundant.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages are all welcome —
open an issue or PR. The goal is simple: help people understand.

## Code

Second-language implementations of the flagship builds live in `code/`:

`code/go/blobstore.go` (Chapter 1's content-addressed store — `git cat-file -p` reads its output).
