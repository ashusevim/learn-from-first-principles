---
layout: ../../layouts/Chapter.astro
title: 'Networking: Interfaces, Routes & Sockets'
description: 'ip, routing tables, ARP, and sockets as file descriptors. Where nftables sits and what a packet crosses to reach your process.'
part: 'Part IV — The Running System'
written: true
---

Networking has a reputation for being its own terrifying discipline. Locally, on one Linux
machine, it isn't. A packet is just bytes crossing five checkpoints inside the kernel —
and every one of them is visible with the tools you already know the principles behind.
You've been preparing for this chapter since Chapter 5, because **a network connection is a
file descriptor**.

## The lie you were told

> "The internet just works" / "eth0 is my network card."

Interfaces are **kernel objects**, not hardware. `lo`, `eth0`, `wlan0`, `docker0` — all
just structures in kernel memory with addresses attached. You can create them out of thin
air (that's what Docker and VPNs do). The card is hardware; the interface is the kernel's
model of it.

## A packet's journey, checkpoint by checkpoint

```text
your process                          the internet
     │                                     ▲
     ▼ write() on a socket fd              │
[1] socket buffer ──► [2] routing decision ──► [3] firewall hooks (nftables)
                                              ──► [4] ARP (who has the next hop?)
                                              ──► [5] interface queue → driver → wire
```

1. **Socket** — an fd (Ch 6). Your program writes bytes; it knows nothing else.
2. **Routing** — the kernel asks: "which interface, which next hop?" for every packet,
   using a table. `ip route` *is* that table:

   ```sh
   ip route
   # default via 192.168.1.1 dev wlan0   ← "anything unknown → the router"
   # 192.168.1.0/24 dev wlan0 ...        ← "this street → out this door"
   ```

3. **Firewall hooks** — nftables/iptables sit at fixed points in this path, matching packets
   and dropping/rewriting/forwarding. Docker's port mapping? An nftables rule here.
4. **ARP** — "which MAC address owns IP 192.168.1.1?" The kernel asks the whole street and
   caches the answer: `ip neigh`.
5. **Interface** — the frame hits the wire. Repeat in reverse for incoming packets.

## Sockets: the punchline of Chapters 5 and 6

`socket()` returns an fd. `read()`/`write()` work on it. `accept()` returns *another* fd,
one per client. Everything from Chapter 6 — fd tables, dup2, non-magic — applies verbatim.
TCP is the kernel keeping a state machine per socket; your program just shovels bytes.

## Prove it to yourself

**1. Your machine's worldview, in three commands:**

```sh
ip addr show lo          # the loopback "fake NIC" — localhost is an interface
ip route                 # the routing table
ip neigh                 # the ARP cache — your neighbors' hardware addresses
```

**2. Watch ARP happen:** `ping -c1 192.168.1.1` then re-run `ip neigh` — a new entry
appeared, because your kernel *asked the room*.

**3. See a TCP server being born from syscalls:**

```sh
strace -e trace=socket,bind,listen,accept nc -l 8080
```

**4. Localhost traffic is real traffic** — two terminals:

```sh
sudo tcpdump -i lo -n port 8080     # terminal 1
curl -s localhost:8080 >/dev/null   # terminal 2 — packets, on the wire you forgot existed
```

## The build: a TCP echo server in ~30 lines

Every line maps to a checkpoint above:

```c
// echo-server.c — gcc -o echo-server echo-server.c && ./echo-server
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <netinet/in.h>
#include <sys/socket.h>

int main(void) {
    int server = socket(AF_INET, SOCK_STREAM, 0);      // [1] an fd — that's all

    struct sockaddr_in addr = {0};
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_ANY);          // all interfaces
    addr.sin_port = htons(8080);
    bind(server, (struct sockaddr *)&addr, sizeof(addr));  // claim :8080

    listen(server, 8);                                  // kernel: start queuing clients
    printf("listening on :8080\n");

    while (1) {
        int client = accept(server, NULL, NULL);        // NEW fd per client
        char buf[256];
        ssize_t n;
        while ((n = read(client, buf, sizeof(buf))) > 0)
            write(client, buf, n);                      // read bytes, give them back
        close(client);
    }
}
```

Test it from another terminal — `nc 127.0.0.1 8080`, type, watch your words return. Then
`curl -v localhost:8080` and enjoy the confusion on curl's face as you echo its HTTP
request back at it. **You just wrote the seed of every web server ever**: nginx is this
loop, industrially.

## What you now know

- Interfaces are kernel objects; the **routing table** decides every packet's exit.
- ARP answers "who owns this IP on *this street*"; firewalls hook the path with nftables.
- **Sockets are fds** — `socket/bind/listen/accept` is the whole ceremony (Ch 6 forever).
- You built a TCP server. Networking locally is not scary; it's syscalls.

Next: where do all these programs *come from*? Who compiled them, signed them, and put
them on your disk? The distro's real job.
