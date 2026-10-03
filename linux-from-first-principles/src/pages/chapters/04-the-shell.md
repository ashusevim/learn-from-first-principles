---
layout: ../../layouts/Chapter.astro
title: 'The Shell Is Just a REPL Over Syscalls'
description: 'Bash isn’t magic — it reads a line, expands it, and arranges syscalls. We build a mini shell in ~100 lines of C.'
part: 'Part II — Talking to the Machine'
written: true
---

You've been typing into a shell for years. Time to demote it. The shell is not part of the
operating system, has no special privileges, and can do nothing you can't do in C — because
everything it "does" *is* the syscalls from Chapters 2 and 3, arranged in a loop. By the end
of this chapter you'll have built your own, and bash will permanently lose its mystique.

## The lie you were told

> "The shell is the OS" / "the terminal is the shell."

The terminal is a window. The shell is an ordinary userland process — probably process
number 4000-something, spawned the same way everything else is. If it dies, you get a
prompt asking you to restart it. The kernel couldn't care less.

## A shell is a loop. That's it.

Bash's entire existence is this, forever:

```text
read a line → parse & expand → fork() → child execve(program) → parent wait() → repeat
```

That's it. `ls -l /tmp` decomposes to:

1. **Parse**: split on spaces → `ls`, `-l`, `/tmp`.
2. **Expand**: glob `*`, substitute `$VARS`, split words.
3. **Search PATH**: for each dir in `$PATH`, check if `ls` exists there (`execvp` does this).
4. **fork()** a child.
5. Child: **execve("/usr/bin/ls", ["ls", "-l", "/tmp"])**.
6. Parent: **wait()**, print the prompt, read the next line.

Every command you've ever run was this six-line dance.

## Why builtins exist

So why can't the shell be 100% uniform? Because three commands are **impossible** for a
child to do:

- **`cd`** — changes the shell's *own* working directory. A child's `chdir()` changes the
  child's directory; the parent keeps walking in the old one. `cd` must run in the shell
  itself, so it's a **builtin**.
- **`exit`** — same reason: the shell must kill *itself*, not a child.
- **`export`** — sets an environment variable the shell's own children will inherit.

Everything else — `ls`, `grep`, `python`, `docker` — is just a file in `$PATH` that gets
fork/exec'd like any other. Check: `type cd` says *shell builtin*; `type ls` says
*/usr/bin/ls*. That one command separates "shell features" from "real programs".

## Exit codes: the one-bit conversation

Every process dies with a number (0–255). Convention: **0 = success, anything else = failure**.
The shell stores it in `$?`, and `&&` / `||` are just branching on it:

```sh
make && echo BUILD OK || echo BUILD FAILED
```

That's the entire scripting language: read output through files and pipes (Chapter 6),
read success through `$?`.

## Prove it to yourself

**1. Watch bash do the dance** — the fork, the pipe setup, the execs:

```sh
strace -f -e trace=execve,pipe2,dup2,clone bash -c 'ls | wc -l' 2>&1 | grep -E 'pipe2|dup2|execve'
```

You'll see `pipe2(...)` creating a channel, `dup2(...)` wiring it to the children, two
`execve`s — bash setting the stage by hand (Chapter 6 explains every line).

**2. Builtins are features of the shell program:**

```sh
type cd        # cd is a shell builtin
type ls        # ls is /usr/bin/ls
```

**3. Shells are just processes:**

```sh
echo $$        # your shell's PID
bash -c 'echo $$'   # a different PID — another whole shell, briefly alive
```

## The build: a shell in ~60 lines

Save this, compile it, run it. It has a prompt, runs programs, handles `cd`, `exit`,
`> redirection` (Chapter 6 will make the `dup2` line click), and prints exit codes:

```c
// minishell.c — gcc -o minishell minishell.c && ./minishell
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <errno.h>
#include <sys/wait.h>

int main(void) {
    char line[1024];

    while (1) {
        printf("mini$ ");
        fflush(stdout);

        if (!fgets(line, sizeof(line), stdin)) break;    /* EOF: exit */
        line[strcspn(line, "\n")] = '\0';
        if (!line[0]) continue;

        char *args[64];                    /* 1. parse */
        int n = 0;
        for (char *t = strtok(line, " "); t && n < 63; t = strtok(NULL, " "))
            args[n++] = t;
        args[n] = NULL;
        if (!n) continue;

        if (!strcmp(args[0], "exit")) break;            /* 2. builtins */
        if (!strcmp(args[0], "cd")) {
            if (chdir(args[1] ? args[1] : getenv("HOME"))) perror("cd");
            continue;
        }

        char *outfile = NULL;              /* 3. find '>' */
        for (int i = 0; i < n; i++)
            if (!strcmp(args[i], ">")) {
                outfile = args[i + 1];
                args[i] = NULL;
                break;
            }

        pid_t pid = fork();                /* 4. fork */
        if (pid == 0) {                    /* child: */
            if (outfile) {
                int fd = open(outfile, O_WRONLY | O_CREAT | O_TRUNC, 0644);
                dup2(fd, 1);               /* stdout now IS the file */
                close(fd);
            }
            execvp(args[0], args);         /* 5. exec */
            fprintf(stderr, "mini: %s: %s\n", args[0], strerror(errno));
            _exit(127);
        }

        int status;                        /* 6. wait */
        waitpid(pid, &status, 0);
        if (WIFEXITED(status))
            printf("[exit %d]\n", WEXITSTATUS(status));
    }
    return 0;
}
```

Take it for a spin:

```sh
./minishell
mini$ ls -l
mini$ echo hi > hi.txt
mini$ cd /tmp
mini$ exit
```

**Homework that teaches more than any book:** add `|` yourself. The recipe is in the
`strace` output above — `pipe2()`, then `dup2()` each end into a child. When it works,
you'll have implemented the feature that made Unix famous.

## What you now know

- The shell = parse → expand → fork/exec → wait, in a loop. No privileges, no magic.
- Builtins (`cd`, `exit`, `export`) exist because children physically can't do them.
- `$?` is the process exit code; `&&`/`||` are branch instructions in disguise.
- You've built a real shell — bash is this with 50 years of polish and 150k lines.

Next: the deepest idea in Unix — why disks, terminals, kernel statistics, and randomness
are all "files".
