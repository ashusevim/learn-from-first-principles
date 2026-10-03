"""Regenerate the per-course writer briefs from the already-wired chapters.ts files.

The wiring step (adding 'Part N — Practice & Reference' to PARTS and the two new
CHAPTERS entries) has already been applied, so every fact a brief needs - slugs,
order, title, description, part - can be read straight out of chapters.ts.
"""
import os, re

ROOT = "/home/wanony/projects/first-principles"
OUT = os.path.join(ROOT, ".authoring/briefs")
os.makedirs(OUT, exist_ok=True)

FIELD_PATTERNS = {
    "slug": r"slug: '(.*?)',\n",
    "order": r"order: (\d+),\n",
    "title": r"title: '(.*?)',\n",
    "part": r"part: '(.*?)',\n",
    "blurb": r"blurb:\s*\n\s*'(.*?)',\n",
}

def parse_chapters(src):
    chapters = []
    for block in src.split("\n  {")[1:]:
        rec = {}
        for key, pat in FIELD_PATTERNS.items():
            m = re.search(pat, block, re.S)
            if m:
                rec[key] = m.group(1)
        if len(rec) == len(FIELD_PATTERNS):
            rec["order"] = int(rec["order"])
            chapters.append(rec)
    return chapters

BRIEF = """# Task: write the two capstone chapters for `{course}`

Read `{spec}` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `{cdir}/src/lib/chapters.ts` and two existing chapters
(`{cdir}/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `{cdir}/src/pages/chapters/{cheat_slug}.md`

Frontmatter — reproduce byte-for-byte:

```
{cheat_fm}
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `{cdir}/src/pages/chapters/{labs_slug}.md`

Frontmatter — reproduce byte-for-byte:

```
{labs_fm}
```

Body: the labs structure from the spec (§ "Chapter 2") — 3 warm-ups, 4-5 builds,
3 stretch goals, and 12 labs in total, each with **Goal** / **Do this** /
**You'll know it works when** / **Where it comes from**. Build every lab on artefacts
this course has already built.

## The course's chapter index — reference only these

| # | slug | title | part |
|---|------|-------|------|
{index}

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
"""

def frontmatter(chap):
    return (
        "---\n"
        "layout: ../../layouts/Chapter.astro\n"
        f"title: '{chap['title']}'\n"
        f"description: '{chap['blurb']}'\n"
        f"part: '{chap['part']}'\n"
        "written: true\n"
        "---"
    )

written = []
for course in sorted(os.listdir(ROOT)):
    ct = os.path.join(ROOT, course, "src/lib/chapters.ts")
    if not os.path.isfile(ct):
        continue
    chapters = parse_chapters(open(ct, encoding="utf-8").read())
    cheat = next((c for c in chapters if c["slug"].endswith("-cheat-sheet")), None)
    labs = next((c for c in chapters if c["slug"].endswith("-labs")), None)
    if not cheat or not labs:
        print("SKIP (not wired):", course)
        continue
    cdir = os.path.join(ROOT, course)
    index = "\n".join(
        f"| {c['order']} | `{c['slug']}` | {c['title']} | {c['part']} |"
        + (" **NEW**" if c["slug"] in (cheat["slug"], labs["slug"]) else "")
        for c in sorted(chapters, key=lambda c: c["order"])
    )
    text = BRIEF.format(
        course=course, spec=os.path.join(ROOT, ".authoring/SPEC.md"), cdir=cdir,
        cheat_slug=cheat["slug"], labs_slug=labs["slug"],
        cheat_fm=frontmatter(cheat), labs_fm=frontmatter(labs), index=index,
    )
    open(os.path.join(OUT, course + ".md"), "w", encoding="utf-8").write(text)
    written.append((course, cheat, labs))

print(f"Wrote {len(written)} briefs to {OUT}\n")
for course, cheat, labs in written:
    print(f"{course:42} {cheat['part']:32} {cheat['slug']} / {labs['slug']}")
