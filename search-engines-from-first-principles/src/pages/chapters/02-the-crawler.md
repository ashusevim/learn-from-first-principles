---
layout: ../../layouts/Chapter.astro
title: 'The Crawler: Politeness at Scale'
description: 'A frontier, robots.txt, deduplication, and rate limits. Build: a ~50-line crawler that respects the rules.'
part: 'Part I — The Crawler'
written: true
---

The web has no corpus — you must *build* one, by fetching page after page and following
links. That's the crawler: conceptually a `while` loop, operationally one of the most
resource-hungry and etiquette-sensitive programs ever written. This chapter builds a
well-mannered crawler in ~50 lines and shows why "well-mannered" is a hard technical
requirement, not a nicety.

## The lie you were told

> "Crawling is fetching pages over HTTP."

Fetching is the easy part. The real problem is a **scheduling problem**: which URL
next, how fast, and never twice. Three constraints dominate:

1. **Never fetch the same URL twice** — the web is a graph full of cycles (every page
   links home). Without a *seen set*, your crawler runs in circles forever.
2. **Be polite per host** — hammering one server with 100 requests/second is a denial
   of service. Real crawlers rate-limit *per host* and honor `robots.txt` (a machine-
   readable "keep out" sign every respectable crawler obeys).
3. **Bound the frontier** — the web is infinite; without limits you crawl forever and
   store nothing useful.

## The architecture

```text
        frontier (URL queue)          seen set (dedup — Chapter 1's "never twice")
             │ pick next                     ↑ already seen? skip
             ▼
   fetch ──► parse links ──► normalize ──► add to frontier
     │
     └─► store the document (feeds Chapter 4's index)
```

URL **normalization** is sneakier than it looks: `http://x.com/a`, `http://x.com/a/`,
and `http://x.com/a?utm_source=spam` are the same page. Without canonicalization, the
seen set fills with duplicates and you fetch the same page 40 ways.

## Prove it to yourself

**1. Cycles without a seen set** — three lines:

```python
pages = {"a": ["b"], "b": ["c"], "c": ["a"]}   # the web is FULL of these loops
 frontier = ["a"]; seen = set()
while frontier:                                 # without `seen`, this never terminates
    url = frontier.pop()
    if url in seen: continue                    # ← delete this line: infinite loop
    seen.add(url); frontier.extend(pages.get(url, []))
print(sorted(seen))
```

**2. Read a real robots.txt:**

```sh
curl -s https://en.wikipedia.org/robots.txt | head -8
# User-agent: *  /  Disallow: /wiki/Special:Search ...  — the web's keep-out signs
```

**3. Feel the rate limit you deserve** — hit any host as fast as you can type and watch
the status codes turn 429 (Too Many Requests). The server is teaching you manners.

## The build: a polite mini-crawler

```python
# crawler.py — frontier + seen set + robots + rate limit (~50 lines)
import time, urllib.parse, urllib.request, collections

def normalize(url):
    p = urllib.parse.urlparse(url)
    return urllib.parse.urlunparse((p.scheme, p.netloc, p.path, "", p.query, ""))  # drop #frag

def allowed(url, disallowed):
    return not any(url.startswith(d) for d in disallowed)

def crawl(start, max_pages=20, delay=1.0):
    host = urllib.parse.urlparse(start).netloc
    seen, docs, frontier = set(), {}, collections.deque([normalize(start)])

    while frontier and len(docs) < max_pages:
        url = frontier.popleft()
        if url in seen or not url.startswith(f"https://{host}"):   # stay on host, never twice
            continue
        seen.add(url)

        try:
            with urllib.request.urlopen(url, timeout=5) as r:
                body = r.read().decode("utf-8", errors="replace")
        except Exception:
            continue
        docs[url] = body
        print(f"crawled {url} ({len(body)} bytes)")

        for link in __import__("re").findall(r'href="([^"#]+)"', body):   # follow links
            full = normalize(urllib.parse.urljoin(url, link))
            if full.startswith("http") and allowed(full, [f"https://{host}/search"]):
                frontier.append(full)

        time.sleep(delay)                       # ← politeness: 1 req/sec to one host

corpus = crawl("https://example.com/", max_pages=10)
print(f"corpus: {len(corpus)} pages — ready for Chapter 4's index")
```

Point it at any site *that belongs to you* (or example.com), watch the frontier drain
politely at one request per second, and note what the seen set prevented: infinite
loops through nav bars and "home" links.

## What you now know

- Crawling = **frontier + seen set + per-host politeness** — a scheduling problem
  wearing an HTTP costume.
- **robots.txt and rate limits are technical requirements**: they keep you out of
  legal trouble and off blocklists.
- URL normalization is where duplicate fetches hide; canonicalize before dedup.
- The output — a corpus of documents — is the raw material for Chapter 3's pipeline.

Next: raw pages are HTML noise. Before indexing, documents get cleaned — and the
cleaning decisions silently define what your search can find.
