---
layout: ../../layouts/Chapter.astro
title: 'Teardown & the Strange States'
description: 'FIN, RST, TIME_WAIT — why connections linger and what netstat is really telling you.'
part: 'Part II — TCP from Raw Bytes'
written: true
---

Connections are born with three packets (Chapter 4), fed with numbered bytes (Chapter 5) —
and *buried* with four packets and a two-minute timeout. If you've ever seen
`Address already in use` or a wall of `TIME_WAIT` in `netstat`, this chapter is your
explanation. Teardown is where TCP shows its obsession with the one thing networks can't
give it: *knowing when you're really done*.

## The lie you were told

> "Closing a connection ends it."

The network is allowed to hold your packets for minutes and deliver them late (Chapter 2).
So a "polite close" can't just stop talking — **late-arriving bytes would be mistaken for
a new conversation**. TCP's teardown is designed so both sides are *certain* the other
side is certain. That certainty costs packets and time.

## The four-way goodbye

```text
A → B:  FIN          "I have no more data to send."
B → A:  ACK          "I heard you're done."  (but B may still send!)
B → A:  FIN          "I'm done too."
A → B:  ACK          "Confirmed. Goodbye for real."
```

Notice it's *four* packets, not three: each direction closes **independently** (that's the
"half-close" — a client can say "no more requests from me" while still receiving a big
download; HTTP/1.0 used exactly this trick).

## The afterlife: TIME_WAIT

The side that sends the *final* ACK must then sit in **TIME_WAIT for 2×MSL** (1–4 minutes)
before the port truly dies. Why? Two reasons, both "the network is a liar":

1. If your last ACK gets lost, the peer re-sends its FIN — *someone* must answer it.
2. Late packets from the old connection must have died before the same 4-tuple (same IPs
   and ports) is reused for a new one.

So every fast client that churns connections (a load tester, a scraper, your CI) leaves a
trail of zombie ports in TIME_WAIT. Nothing is wrong. The corpses are a *safety feature*.

## The rude exit: RST

Everything above is the polite goodbye. **RST** is slamming the door: one packet, no
ceremony, connection annihilated. You trigger it constantly — connect to a closed port,
kill a process mid-conversation, send data to a peer that already closed. `netstat`'s
`Connection refused` is an RST saying "no such service". It's not an error; it's TCP's
honesty (Chapter 2's ethos) in one flag.

## The state zoo, mapped to what you'll see

```sh
ss -tan | awk '{print $1}' | sort | uniq -c | sort -rn
#    156 ESTAB        ← healthy work
#     42 TIME-WAIT    ← recent polite closes (fine; ignore "tuning" blog posts)
#      8 LISTEN       ← servers waiting for the 3-way handshake
#      3 CLOSE-WAIT   ← ⚠️ the OTHER side closed; YOUR app never called close() — a bug
```

Memorize the one diagnostic that matters: **many CLOSE-WAIT = your process has leaked
sockets** (it received FIN and never responded with one). TIME-WAIT is normal;
CLOSE-WAIT is a bug report written by the kernel.

## Prove it to yourself

**1. Watch a goodbye in slow motion:**

```sh
sudo tcpdump -n 'tcp port 80 & host example.com' &
curl -s http://example.com >/dev/null
# Flags [F.] → [.] → [F.] → [.]   ← the four-way goodbye, live
```

**2. Manufacture TIME_WAIT** — close hard and look:

```sh
for i in $(seq 1 20); do curl -s http://example.com >/dev/null & done; sleep 1
ss -tan state time-wait | wc -l    # a wall of corpses. All safe. All temporary.
```

**3. Trigger RST by hand:**

```sh
nc 127.0.0.1 9    # port 9 (discard) isn't listening...
# (Instant "Connection refused" — that was an RST packet from your own kernel.)
```

## The build: feel each state from C

A tiny client that closes *rudely* vs *politely* — same data path, different goodbye:

```c
/* rude.c — gcc -o rude rude.c && ./rude  — then immediately: ss -tan | grep 8080 */
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <netinet/in.h>
#include <sys/socket.h>

int main(void) {
    int fd = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in a = {0};
    a.sin_family = AF_INET;  a.sin_port = htons(8080);
    a.sin_addr.s_addr = htonl(0x7f000001);           /* 127.0.0.1 */
    connect(fd, (struct sockaddr *)&a, sizeof(a));
    write(fd, "hello", 5);
    sleep(1);

    /* POLITELY: */ shutdown(fd, SHUT_WR);            /* sends FIN, keeps reading */
    char buf[64]; read(fd, buf, sizeof(buf));        /* collect the server's last words */
    close(fd);                                       /* then FIN the rest */

    /* To go RUDE instead, close(fd) without shutdown — or set:
       struct linger l = {1, 0};  setsockopt(fd, SOL_SOCKET, SO_LINGER, &l, sizeof l);
       → close() sends RST: no FIN, no TIME_WAIT, no goodbye at all. */
    return 0;
}
```

Run it against the echo server from the Linux course (Chapter 11), with `tcpdump tcp port
8080` open, and watch your choice of goodbye hit the wire: graceful `[F.]`s, or one brutal
`[R.]`.

## What you now know

- Teardown is **four packets, per direction** — half-close is a feature, not a bug.
- **TIME_WAIT** protects the next connection from this one's ghosts; it's normal, not a problem.
- **CLOSE-WAIT piling up = your app forgot to close. The kernel is filing the bug for you.**
- RST is the emergency exit — and "connection refused" is just an RST with a name.

Next: you've driven TCP from the raw-socket driver's seat. Time to see what the kernel's
comfortable API — the sockets you use every day — actually builds underneath.
