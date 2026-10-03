---
layout: ../../layouts/Chapter.astro
title: 'Blocking Is Expensive: Thread-per-Client Dies at 10k'
description: 'A blocked thread is a stack plus a kernel object — multiply by 10,000 clients. Build: measure C10K dying, byte by byte.'
part: 'Part II — Waiting Efficiently'
written: true
---

Chapter 4 gave you the thread toolkit: locks, condvars, producer/consumer. The natural
server design follows: **one thread per client** — each blocks on `read()`, simple code,
beautiful isolation. It works at 10 clients, 100 clients, 1,000 clients... and then the
"simple model" collides with arithmetic. This chapter does that arithmetic out loud,
measures the wreckage, and sets up the idea that replaces threads for waiting: the event
loop (Chapter 6).

## The lie you were told

> "One thread per client is the simple, correct model."

It's correct — and the cost per client is not zero:

```text
1 client thread  =
  1 stack          8 MB virtual (typically 64–128 KB actually touched)
  1 kernel object  task_struct, scheduler bookkeeping, fd table
  1 scheduling     10k threads ⇒ context-switch storm on every network hiccup
```

At 10,000 clients: gigabytes of stack reservation, tens of MB of kernel structures, and
— the real killer — **99.9% of those threads are asleep** in `read()`, waiting. A thread
is the most expensive "wait for data" primitive that exists. This is the **C10K problem**
(named in 1999 by Dan Kegel), and it shaped every server you use: nginx, redis, node,
go — all exist because thread-per-client hit this wall.

## Where the model actually breaks

Not at "too much CPU" — mostly-blocked threads cost little CPU. The deaths, in order:

1. **Memory**: 10k × 8 MB stack reservations → address-space exhaustion (32-bit) or
   real-memory pressure (64-bit).
2. **Wake storms**: traffic arrives in bursts; 10k threads wake *simultaneously*; the
   scheduler drowns in context switches before a single byte is processed.
3. **The waiting waste**: a thread blocked in `read()` owns a stack it isn't using.
   The *computation* needs ~100 bytes of state per client; the *thread* provides megabytes.

Point 3 is the insight: **waiting and computing have wildly different costs, and the
thread bundles them together.** The event loop (Ch 6) unbundles them: tiny state per
connection, and threads only for actual computation.

## Prove it to yourself

**1. Measure what threads cost:**

```sh
python3 - <<'EOF'
import threading, os, time

def rss_mb():
    for line in open(f"/proc/{os.getpid()}/status"):
        if line.startswith("VmRSS"): return int(line.split()[1]) // 1024

before = rss_mb()
threads = [threading.Thread(target=lambda: time.sleep(60)) for _ in range(10000)]
t = time.time()
for th in threads: th.start()
print(f"started 10k threads in {time.time()-t:.2f}s")
time.sleep(1)
print(f"RSS: {before} MB -> {rss_mb()} MB  (+{rss_mb()-before} MB just to exist)")
EOF
```

Ten thousand threads *doing absolutely nothing* cost hundreds of MB. Add per-thread
stacks of real work, kernel objects, and context switches, and the model's invoice
arrives.

**2. Feel the wake storm:**

```sh
vmstat 1        # watch cs (context switches) while 10k threads wake on a burst
```

**3. The contrast, in one number** — a socket needs ~100 bytes of app state. Compare:

```text
thread per socket:  ~8 MB virtual / ~64 KB real   per connection
socket state only:  ~100 bytes                    per connection
```

A **five-orders-of-magnitude** gap. The event loop is the claim that the second number
is enough, if you're willing to restructure your code.

## The build: measure your own server's ceiling

Thread-per-client echo server (the Linux course, Chapter 11, fork swapped for threads):

```c
/* threaded-echo.c — gcc -pthread -o techo techo.c && ./techo */
#include <stdio.h>
#include <pthread.h>
#include <unistd.h>
#include <netinet/in.h>
#include <sys/socket.h>

void *client(void *arg) {
    int fd = (long)arg;
    char buf[256]; ssize_t n;
    while ((n = read(fd, buf, sizeof buf)) > 0)   /* BLOCKS: this thread's whole job */
        write(fd, buf, n);                         /* is waiting for this read */
    close(fd);
    return NULL;
}

int main(void) {
    int srv = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in a = {0};
    a.sin_family = AF_INET; a.sin_port = htons(8080); a.sin_addr.s_addr = 0;
    setsockopt(srv, 1, 2, &(int){1}, sizeof(int));    /* SO_REUSEADDR */
    bind(srv, (void *)&a, sizeof a); listen(srv, 100);

    while (1) {
        int c = accept(srv, NULL, NULL);
        pthread_t t;
        pthread_create(&t, NULL, client, (void *)(long)c);   /* one thread per client */
    }
}
```

Then load it until it tells you the truth:

```sh
# from one machine, open connections until it hurts:
for i in $(seq 1 5000); do nc 127.0.0.1 8080 & done
ps -o nlwp= -p $(pgrep techo)          # thread count climbs...
cat /proc/$(pgrep techo)/status | grep VmRSS
```

Somewhere in the thousands of connections, latency spikes and memory balloons — while
the CPU idles. **The machine is not out of compute; it's out of threads.** That's the
C10K wall, felt firsthand.

## What you now know

- A thread bundles *state* (cheap, ~100 B) with *execution* (expensive, ~KB–MB): the
  bundle is wrong for pure waiting.
- C10K deaths: **memory → wake storms → scheduler collapse**, with the CPU mostly idle.
- nginx/redis/node/go all exist because someone unbundled waiting from computing.
- The fix needs a way to ask "which of my 10k sockets is READY?" in one syscall — and
  the kernel has one: epoll. That's Chapter 6.

Next: the event loop — one thread, ten thousand sockets, and the syscall that makes it
possible. nginx, redis, and node.js in miniature.
