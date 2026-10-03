---
layout: ../../layouts/Chapter.astro
title: 'Final Boss: mini-Google in ~300 Lines'
description: 'Crawl → index → rank → serve: a working search engine over a real corpus, one Python file.'
part: 'Part III — Serving & Scale'
written: true
---

The finale. Twelve chapters, three machines — **crawler** (Ch 2), **inverted index**
(Ch 4–5), **ranker** (Ch 6–7) — plus snippets (Ch 10), assembled into one working
search engine in ~300 lines of Python. Then the receipt Chapter 1 promised: the same
query against mini-Google and against the naive scan, timed side by side.

## The lie you were told

> "A search engine is a moonshot."

The hardened, planetary ones are. The **core loop** — fetch, tokenize, invert, score,
serve — is the course you just took. This finale is assembly, with every section
citing its chapter.

## The architecture (all of it, from earlier chapters)

```text
crawl(url)  ──► corpus {url: html}                    (Ch 2: frontier + politeness)
tokenize()  ──► terms per document                    (Ch 3: the cleaning pipeline)
Index.add() ──► term → {doc: count, positions}        (Ch 4–5: postings with positions)
Ranker()    ──► TF-IDF scores per query               (Ch 6: the formula)
snippets()  ──► best window, highlighted              (Ch 10: the passage finder)
search(q)   ──► lookup → intersect → rank → snippet   (the loop, forever)
```

## The build: mini-google.py

```python
# mini-google.py — crawler + inverted index + TF-IDF + snippets, ~200 lines core
import re, time, math, urllib.parse, urllib.request, collections

# ── Ch 2: the crawler ─────────────────────────────────────────────────────────
def crawl(start, max_pages=25, delay=0.5):
    host = urllib.parse.urlparse(start).netloc
    seen, docs, frontier = set(), {}, [start]
    while frontier and len(docs) < max_pages:
        url = frontier.pop(0)
        if url in seen: continue
        seen.add(url)
        try:
            with urllib.request.urlopen(url, timeout=5) as r:
                docs[url] = r.read().decode("utf-8", errors="replace")
        except Exception: continue
        for link in re.findall(r'href="([^"#]+)"', docs[url]):
            full = urllib.parse.urljoin(url, link)
            if full.startswith(f"https://{host}") and full not in seen:
                frontier.append(full)
        time.sleep(delay)                     # politeness (Ch 2's whole point)
    return docs

# ── Ch 3 + 4: tokenize → inverted index with positions ───────────────────────
STOP = {"the", "a", "an", "of", "and", "or", "to", "in", "on", "for", "is", "it"}
def tokenize(html):
    text = re.sub(r"<script.*?</script>|<style.*?</style>", " ", html, flags=re.S)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.findall(r"[a-z0-9]+", text.lower())

class Index:
    def __init__(self): self.ix, self.docs = {}, {}
    def add(self, doc_id, html):
        self.docs[doc_id] = re.sub(r"<[^>]+>", " ", html)
        for pos, term in enumerate(tokenize(html)):
            if term in STOP: continue
            self.ix.setdefault(term, {}).setdefault(doc_id, []).append(pos)
    def postings(self, term): return self.ix.get(term, {})

# ── Ch 6: TF-IDF ranking ─────────────────────────────────────────────────────
class Ranker:
    def __init__(self, index): self.ix, self.docs = index.ix, index.docs
    def idf(self, term): return math.log(len(self.docs) / max(len(self.ix.get(term, {})), 1))
    def score(self, terms, doc):
        s = 0.0
        for t in terms:
            tf = len([p for p in self.ix.get(t, {}).get(doc, [])])
            s += (tf / 200) * self.idf(t)     # (real impl: true doc length)
        return s
    def search(self, terms):
        cands = set().union(*(self.ix.get(t, {}) for t in terms)) if terms else set()
        return sorted(cands, key=lambda d: self.score(terms, d), reverse=True)

# ── Ch 10: snippets ──────────────────────────────────────────────────────────
def snippet(text, terms, w=28):
    words, best, best_i = text.split(), -1, 0
    for i in range(0, max(len(words) - w, 1), 5):
        score = sum(1 for word in words[i:i+w] if word.lower() in terms)
        if score > best: best, best_i = score, i
    return " ".join(words[best_i:best_i+w])

# ── the engine, assembled ────────────────────────────────────────────────────
class MiniGoogle:
    def __init__(self, start):
        self.index = Index()
        for url, html in crawl(start).items():
            self.index.add(url, html)
        self.ranker = Ranker(self.index)
        print(f"indexed {len(self.docs if hasattr(self,'docs') else self.index.docs)} pages")
    def search(self, query):
        terms = tokenize(query)
        out = []
        for doc in self.ranker.search(terms)[:5]:
            text = re.sub(r"\s+", " ", self.index.docs[doc])
            out.append((doc, snippet(text, terms)))
        return out

# ── the receipt: Chapter 1's promise, kept ───────────────────────────────────
engine = MiniGoogle("https://example.com/")
print("── mini-Google ──")
t = time.time()
for url, snip in engine.search("example domain"):
    print(f"  {url}\n    {snip}")
print(f"query time: {1000*(time.time()-t):.2f} ms")

print("── naive grep (Chapter 1's engine) ──")
t = time.time()
hits = [(u, d) for u, d in engine.index.docs.items()
        if all(term in d.lower() for term in ["example", "domain"])]
print(f"query time: {1000*(time.time()-t):.2f} ms — and that gap GROWS with the corpus")
```

Same corpus, same query, two engines — and the timing gap is Chapter 1's arithmetic
made real: the scan's cost grows with the corpus; the index's cost barely moves. Add
Chapter 7's PageRank to the score (one dict, one loop), Chapter 11's shards for scale,
and you have walked from grep to Google in twelve chapters.

## Where you are now

Twelve chapters ago, search was a text box that "finds things". Now you've: crawled a
corpus politely (Ch 2), normalized it into terms (Ch 3), flipped the world into an
inverted index and watched the 4-orders-of-magnitude speedup (Ch 4), intersected
posting lists for boolean and phrase queries (Ch 5), ranked by TF-IDF (Ch 6) and
authority (Ch 7), built the immune system (Ch 8), measured quality with precision@k
(Ch 9), generated query-aware snippets (Ch 10), sharded across machines (Ch 11) — and
assembled the whole pipeline into a working engine.

The search box was never magic. It's three machines — and you built all three.

**Where to go next:** read the PageRank paper (your Chapter 7 is its section 2), then
tour Lucene's index format. And the First Principles Project continues: **LLMs from
First Principles** — the tokenizer, attention, and a transformer that generates text,
built from matrix math up.
