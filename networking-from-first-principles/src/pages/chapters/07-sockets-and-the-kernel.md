---
layout: ../../layouts/Chapter.astro
title: 'Sockets: The Kernel’s Side of the Deal'
description: 'What socket/bind/listen/accept actually build inside the kernel, and how fd tables meet TCP state.'
part: 'Part III — Programs on Top'
written: true
---

You already know sockets are file descriptors (Linux course, Chapter 6; you built a TCP
server with `socket/bind/listen/accept`). But *what did those four calls actually create in
the kernel?* This chapter opens the black box — and suddenly the weird parts of the socket
API (why accept returns a new fd, why `backlog` exists, what `SO_REUSEADDR` is really for)
stop being folklore and become consequences.

## The lie you were told

> "A listening socket is what clients connect to."

The listening socket **never carries data and never talks to a client**. It's a *classified
ad*: "kernel, please queue connection attempts for port 8080". Every real conversation
happens on a *different* socket that accept hands you. Conflating these two is the root of
half the confusion in socket programming.

## What each call actually does

```text
socket()   → allocate an fd + a kernel struct: "a channel exists, it's nothing yet"
bind()     → weld an address/port onto it ("this channel answers at :8080")
listen()   → flip it to LISTEN state + create TWO queues:
                SYN queue:     got your SYN, replied SYN-ACK, waiting for the final ACK
                accept queue:  fully established connections, waiting for accept()
accept()   → pop ONE entry from the accept queue → mint a brand-new fd wired to that peer
connect()  → send SYN, drive the 3-way handshake (Ch 4), block until established
```

So the famous handshake you built by hand? The kernel was doing exactly that — Chapter 4
just let you drive.

## The queues: where backpressure lives

```text
client SYN ──► [ SYN queue ]── handshake ──► [ accept queue ]── accept() ──► your fd
               (half-open)                    (backlog deep)                  │
                                                                              ▼
                                                    your single-threaded loop, one client at a time
```

`listen(fd, backlog)` sizes the accept queue. If your app accepts slowly, the queue fills
and new SYNs get dropped — **that's "the server is overloaded", stated as a data structure**.
(Fun history: the SYN queue is where the 1996 SYN-flood attacks lived; modern kernels
synthesize connections without touching real state until the ACK — the "SYN cookies"
still arriving in your `dmesg`.)

And when accept() is full of established clients while your process handles one... that's
the exact moment every "why is my server slow" investigation should start.

## SO_REUSEADDR: the TIME_WAIT treaty

Chapter 6 left your polite server drowning in TIME_WAIT corpses. Now the treaty: when you
restart your server 10 seconds after killing it, `bind()` fails with `Address already in
use` — the kernel refuses to reuse a 4-tuple that TIME_WAIT might still guard.
`SO_REUSEADDR` is you signing: *"I promise the old connections' ghosts won't confuse me."*
Every server you've ever seen sets it in its first ten lines. Now you know what it's
actually saying.

## Prove it to yourself

**1. Watch the two queues separately** — one terminal, a slow-accepting server; another, a
flurry of clients:

```sh
ss -nlt 'sport = :8080'     # Recv-Q/Send-Q on LISTEN = accept queue depth
ss -n state syn-recv        # half-open connections in the SYN queue
```

**2. Confirm accept() mints new fds:**

```sh
ls -l /proc/$(pgrep -f my-server)/fd    # watch fd 4,5,6… appear per client
```

**3. The backlog, violated live** — a server with `listen(fd, 1)` and 20 concurrent
clients: some SYNs get dropped. You just watched "server overloaded" as a queue overflow.

## The build: one socket per client, the honest way

The fork-per-client server — the *actual* ancestor of nginx's worker model — and the place
where the Linux course (fork, exec, wait, fds) and this course finally merge:

```c
/* servetcp.c — gcc -o servetcp servetcp.c && ./servetcp
   Handles many clients "concurrently" using nothing but Chapter 3's fork(). */
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <sys/wait.h>
#include <netinet/in.h>
#include <sys/socket.h>

int main(void) {
    int srv = socket(AF_INET, SOCK_STREAM, 0);
    int one = 1;
    setsockopt(srv, SOL_SOCKET, SO_REUSEADDR, &one, sizeof one);   /* the treaty */

    struct sockaddr_in a = {0};
    a.sin_family = AF_INET;  a.sin_port = htons(8080);
    a.sin_addr.s_addr = htonl(0x7f000001);
    bind(srv, (struct sockaddr *)&a, sizeof a);
    listen(srv, 8);                                    /* the classified ad */

    while (1) {
        int c = accept(srv, NULL, NULL);               /* NEW fd per client */
        if (fork() == 0) {                             /* child owns THIS client */
            close(srv);                                /* child doesn't answer ads */
            char buf[256]; ssize_t n;
            while ((n = read(c, buf, sizeof buf)) > 0)
                write(c, buf, n);                      /* echo — your Ch 11 server, again */
            close(c);
            return 0;
        }
        close(c);                                      /* parent: done with this fd */
        waitpid(-1, NULL, WNOHANG);                    /* reap finished children */
    }
}
```

`nc localhost 8080` from two terminals at once — both echo, because both have their own
process and their own fd. Twenty years of "concurrency" debates, and this 30-line loop is
where every one of them starts.

## What you now know

- A LISTEN socket is an **ad + two queues**; accept() mints a fresh fd per established client.
- **Backlog** is a queue depth; overflow is "server overloaded" in its rawest form.
- **SO_REUSEADDR** is a treaty with TIME_WAIT, signed in every server's first lines.
- fork-per-client merges both courses: processes + fds = concurrent servers.

Next: your server speaks TCP and the kernel ships bytes. But clients still ask for
`example.com` — and no packet on the wire knows what that is. Time to meet the phone book.
