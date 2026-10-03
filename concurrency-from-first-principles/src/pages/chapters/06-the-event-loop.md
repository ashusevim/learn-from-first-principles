---
layout: ../../layouts/Chapter.astro
title: 'The Event Loop: One Thread, Ten Thousand Sockets'
description: 'epoll lets one thread watch 10k sockets and act only when ready. Build: an epoll echo server — the heart of nginx, redis, node.'
part: 'Part II — Waiting Efficiently'
written: true
---

Chapter 5 proved threads die at 10k waiting clients. The fix is a different *shape* of
program: instead of "one thread sleeps per socket", ask the kernel — **in one syscall —
which sockets are ready right now**, and act on only those. That's the event loop: one
thread, one stack, ten thousand connections, each costing ~100 bytes of state. nginx,
redis, and node.js are this chapter, industrialized.

## The lie you were told

> "Many sockets require many threads."

The kernel can *watch* every socket for you. The history of "please tell me which are
ready": `select()`/`poll()` (1990s) pass **all** fds every call — O(total sockets) per
call, so 10k connections means shipping 10k fd entries to the kernel each time. `epoll`
(Linux, 2002) flips it: register each socket **once**, then `epoll_wait` returns only
the ready ones — O(ready), not O(total).

```text
select/poll:  every call: [fd0][fd1]...[fd9999] ──► kernel ──► 3 ready
epoll:        epoll_wait( ) ──► [fd42][fd808][fd9001]    ← just the ready ones
```

## The shape: a loop, not a thread tree

```text
state = {fd → per-connection data}          ← ~100 bytes per client, no stacks

while (true) {
    ready = epoll_wait(...)                  // BLOCKS here once, for ALL sockets
    for fd in ready:
        event = state[fd]                    // never blocks per-connection
        handle(event)                        // read/write NON-BLOCKING, update state
}
```

One thread blocks *once for everyone* (in `epoll_wait`) instead of 10k threads blocking
once each (in `read`). The trade: your handlers must be **non-blocking** — read what's
available, save partial state, return immediately. A single slow handler now stalls
*everyone* (that's the event loop's own tax — see "the one rule" below).

## Prove it to yourself

**1. Watch the loop breathe** — `strace` nginx/redis/node for a second:

```sh
strace -c -f redis-server --port 6380 2>&1 | grep -E 'epoll|total'
# epoll_wait dominates: the loop's one blocking syscall, exactly as drawn
```

**2. Feel O(ready) vs O(total)** — the reason epoll beat select, demonstrated with your
own build below: connect 1000 clients, send on 2, and the server touches exactly 2.

**3. One thread, verified:**

```sh
ps -o nlwp= -p $(pgrep epollecho)      # 1. Ten thousand clients later: still 1.
```

## The build: an epoll echo server (~55 lines)

The same echo server as Chapter 5's threaded one — but one thread, zero per-connection
state on the kernel side:

```c
/* epollecho.c — gcc -O2 -o epollecho epollecho.c && ./epollecho
   test: nc 127.0.0.1 8080 &  (repeat 100×) — threads stay at 1 */
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/epoll.h>
#include <netinet/in.h>
#include <sys/socket.h>

int main(void) {
    int srv = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in a = {0};
    a.sin_family = AF_INET; a.sin_port = htons(8080);
    bind(srv, (void *)&a, sizeof a); listen(srv, 100);

    int ep = epoll_create1(0);                       /* 1. the watcher */
    struct epoll_event ev = { .events = EPOLLIN, .data.fd = srv };
    epoll_ctl(ep, EPOLL_CTL_ADD, srv, &ev);          /* register the listener, once */

    while (1) {                                      /* 2. THE LOOP */
        struct epoll_event ready[64];
        int n = epoll_wait(ep, ready, 64, -1);       /* blocks ONCE for ALL sockets */
        for (int i = 0; i < n; i++) {                /* only READY fds come back */
            int fd = ready[i].data.fd;
            if (fd == srv) {                         /* new client: register it, move on */
                int c = accept(srv, NULL, NULL);
                fcntl(c, F_SETFL, O_NONBLOCK);       /* handlers must NEVER block */
                struct epoll_event ce = { .events = EPOLLIN, .data.fd = c };
                epoll_ctl(ep, EPOLL_CTL_ADD, c, &ce);
            } else {                                 /* an existing client is ready */
                char buf[256];
                ssize_t r = read(fd, buf, sizeof buf);   /* non-blocking: never sleeps */
                if (r <= 0) { epoll_ctl(ep, EPOLL_CTL_DEL, fd, NULL); close(fd); }
                else write(fd, buf, r);
            }
        }
    }
}
```

Open 100 terminals of `nc 127.0.0.1 8080`, type in one, watch the echo come back —
while `ps -o nlwp=` confirms the whole server is **one thread**. You have written the
architecture of nginx.

## The one rule (and its price)

**Never block in a handler.** Every `read` on a slow disk, every `sleep`, every CPU-heavy
parse stalls all 10k clients. This is the event loop's tax, and it's why the real
servers (Chapter 12) are *hybrids*: the loop owns sockets, and a **thread pool** does the
blocking/CPU work. async/await (Chapter 7) exists to make "return immediately, resume
later" code writable by humans — the event loop's rules, wrapped in syntax.

## What you now know

- `epoll` = register once, **wait returns only ready fds** — O(ready) instead of O(total).
- The event loop: one thread, one `epoll_wait`, non-blocking handlers, ~100 B per client.
- The trade is **discipline**: one blocking call stalls everyone — hence async/await and
  thread pools as companions.
- nginx, redis, node — this loop. You've written it.

Next: the loop's handlers are written as "do step, save state, return" — painful.
async/await is the compiler writing that state machine *for* you. Next chapter, you
build it by hand with generators and the magic evaporates.
