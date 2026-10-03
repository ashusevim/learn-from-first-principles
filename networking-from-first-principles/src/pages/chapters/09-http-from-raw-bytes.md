---
layout: ../../layouts/Chapter.astro
title: 'HTTP Is Just Text (Until It Isn’t)'
description: 'Requests and responses on the wire, headers as lines, keep-alive. Build: an HTTP server on raw sockets, zero libraries.'
part: 'Part III — Programs on Top'
written: true
---

You've built frames (Ch 1), spoken TCP (Ch 4–6), resolved names (Ch 8). Now the protocol
your entire career sits on top of — and the punchline is almost rude: **HTTP/1.1 is lines
of ASCII text separated by `\r\n`, terminated by a blank line.** You have been running
"frameworks" over *text files on a wire*. Let's look at the actual bytes.

## The lie you were told

> "HTTP is a complex protocol requiring frameworks."

HTTP/1.1 is a grammar school note:

```text
GET /index.html HTTP/1.1        ← request line: verb, path, version
Host: example.com               ← headers: Key: value lines
User-Agent: curl/8.7.1
                                ← BLANK LINE = headers done
(body, if any)
```

The response, same grammar:

```text
HTTP/1.1 200 OK                 ← status line
Content-Type: text/html
Content-Length: 1256
                                ← blank line
<html>...                       ← the body, raw bytes
```

That's it. That's the protocol that runs civilization. Everything else — chunked encoding,
caching headers, cookies — is *vocabulary*, not grammar.

## The four things that actually matter

1. **Stateless.** Every request stands alone; the server remembers nothing. That's why
   "sessions" and cookies exist — HTTP's amnesia is a feature that userland pays for.
2. **Content-Length or chunked.** The receiver must know where the body ends. Either a
   byte count, or `Transfer-Encoding: chunked` — the body in `<size-in-hex>\r\n<size
   bytes>\r\n` chunks. That's the whole mystery of chunked.
3. **Keep-alive.** One TCP connection (Ch 4's handshake!) can carry many requests — that's
   why the blank line matters: it's the frame between messages on a reused stream.
4. **It's plaintext.** `tcpdump -A` shows entire HTTP conversations in the clear. The
   network is a public room; TLS (Chapter 10) is the private booth you book afterwards.

## Prove it to yourself

**1. Be the browser** — no client software, just your fingers and `nc`:

```sh
printf 'GET / HTTP/1.1\r\nHost: example.com\r\nConnection: close\r\n\r\n' | nc example.com 80
```

You *spoke HTTP* with a shell one-liner. Read the status line, the headers, the HTML —
all text, all yours.

**2. The whole conversation, captured:**

```sh
sudo tcpdump -A -n 'tcp port 80 & host example.com' &
curl -s http://example.com >/dev/null
```

Scanning past the TCP noise (Ch 4 trained you to ignore it), the ASCII request and response
sit right there in the capture.

**3. Watch keep-alive reuse the connection:**

```sh
curl -sv http://example.com http://example.com 2>&1 | grep -i 're-using\|connected'
# * Re-using existing connection — one handshake, two requests (Ch 6: no TIME_WAIT pileup)
```

## The build: an HTTP server with zero libraries

You already built an echo server (Linux course, Ch 11) and fork-per-client (Ch 7). The only
new skill: **parse the request line** and answer in grammar. Fifty lines, no frameworks —
this *is* an HTTP server:

```c
/* httpd.c — gcc -o httpd httpd.c && ./httpd    →  curl localhost:8080 */
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <netinet/in.h>
#include <sys/socket.h>

int main(void) {
    int srv = socket(AF_INET, SOCK_STREAM, 0);
    int one = 1;
    setsockopt(srv, SOL_SOCKET, SO_REUSEADDR, &one, sizeof one);
    struct sockaddr_in a = {0};
    a.sin_family = AF_INET;  a.sin_port = htons(8080);
    a.sin_addr.s_addr = htonl(0x7f000001);
    bind(srv, (struct sockaddr *)&a, sizeof a);
    listen(srv, 8);

    while (1) {
        int c = accept(srv, NULL, NULL);

        char req[2048] = {0};
        read(c, req, sizeof req - 1);

        /* parse the request line: "GET /path HTTP/1.1" */
        char method[8] = "", path[256] = "/";
        sscanf(req, "%7s %255s", method, path + 0);
        int is_get = strcmp(method, "GET") == 0;

        char body[512];
        if (!is_get)
            snprintf(body, sizeof body, "405: only GET here");
        else if (strcmp(path, "/") == 0)
            snprintf(body, sizeof body,
                "<h1>hello from a %ld-line HTTP server</h1>"
                "<p>you asked for: <code>%s</code></p>", 0L, path);
        else
            snprintf(body, sizeof body, "404: no such page: %s", path);

        char head[256];
        snprintf(head, sizeof head,
            "HTTP/1.1 %s\r\n"
            "Content-Type: text/html\r\n"
            "Content-Length: %zu\r\n"
            "Connection: close\r\n\r\n",                       /* one request per conn: simplest */
            is_get && !strcmp(path, "/") ? "200 OK" : "404 Not Found",
            strlen(body));

        write(c, head, strlen(head));                          /* status line + headers */
        write(c, body, strlen(body));                          /* blank line already in head */
        close(c);                                              /* [F.] — Ch 6's goodbye */
    }
}
```

Point a real browser at `http://localhost:8080` and see your text protocol render a page.
Try `curl -v localhost:8080/foo` and watch your 404 travel back. Every "web framework"
ever — Express, Django, gin — starts exactly here and adds *convenience*, not protocol.

## What you now know

- HTTP/1.1 is **text grammar**: request/status line, `\r\n` headers, blank line, body.
- **Stateless** — sessions/cookies are userland patches for the amnesia.
- Bodies end at **Content-Length or chunks**; connections are reused via **keep-alive**.
- You wrote an HTTP server with no libraries. The framework mystery is over.

Next: your server just shipped HTML as *plaintext over a public network*. Every hop could
read it, alter it, forge it. Time to build the private booth — TLS.
