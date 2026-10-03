"""Validate every wired capstone chapter (slugs ending -cheat-sheet / -labs).

Checks per file:
  1. chapter .md file exists for the slug
  2. frontmatter title/description/part match chapters.ts (blurb==description), written:true
  3. part exists in PARTS
  4. no TODO/placeholder, no <h1>, ends with a `Next: ` line, has >=3 code fences and >=3 table rows
Reports word counts; exits nonzero on any failure.
"""
import os, re, sys

ROOT = "/home/wanony/projects/first-principles"
PATS = {
    "slug": r"slug: '(.*?)',\n",
    "order": r"order: (\d+),\n",
    "title": r"title: '(.*?)',\n",
    "part": r"part: '(.*?)',\n",
    "blurb": r"blurb:\s*\n\s*'(.*?)',\n",
}

def parse(src):
    out = []
    for block in src.split("\n  {")[1:]:
        rec = {}
        for k, p in PATS.items():
            m = re.search(p, block, re.S)
            if m:
                rec[k] = m.group(1)
        if len(rec) == len(PATS):
            rec["order"] = int(rec["order"])
            out.append(rec)
    return out

fails, rows = [], []
for course in sorted(os.listdir(ROOT)):
    ct = os.path.join(ROOT, course, "src/lib/chapters.ts")
    if not os.path.isfile(ct):
        continue
    src = open(ct, encoding="utf-8").read()
    parts = re.findall(r"'((?:Part [IVX]+|Part [IVX]+ — [^']*))'", src.split("export const CHAPTERS")[0])
    for c in parse(src):
        if not (c["slug"].endswith(("-cheat-sheet", "-labs"))):
            continue
        md_path = os.path.join(ROOT, course, "src/pages/chapters", c["slug"] + ".md")
        label = f"{course}/{c['slug']}"
        if not os.path.isfile(md_path):
            fails.append(label + ": MISSING FILE"); continue
        md = open(md_path, encoding="utf-8").read()
        m = re.search(r"^---\n(.*?)\n---\n", md, re.S)
        if not m:
            fails.append(label + ": no frontmatter"); continue
        fm = {}
        for line in m.group(1).splitlines():
            k, _, v = line.partition(": ")
            fm[k.strip()] = v.strip().strip("'")
        for key, want in (("title", c["title"]), ("description", c["blurb"]), ("part", c["part"])):
            if fm.get(key) != want:
                fails.append(f"{label}: frontmatter {key} mismatch")
        if fm.get("written") != "true":
            fails.append(label + ": written != true")
        if c["part"] not in src.split("export const CHAPTERS")[0]:
            fails.append(label + ": part not in PARTS")
        body = md[m.end():]
        words = len(body.split())
        fences = body.count("```")
        tables = sum(1 for ln in body.splitlines() if ln.startswith("|"))
        final_par, cur = [], []
        for ln in body.rstrip().splitlines():
            s = ln.strip()
            if s.startswith("```") or not s:
                if cur:
                    final_par, cur = cur, []
                continue
            cur.append(s)
        if cur:
            final_par = cur
        issues = []
        if not " ".join(final_par).startswith("Next: "):
            issues.append("no-Next-ending")
        if "TODO" in body or "PLACEHOLDER" in body:
            issues.append("placeholder")
        in_fence, has_h1 = False, False
        for line in body.splitlines():
            if line.strip().startswith("```"):
                in_fence = not in_fence
                continue
            if not in_fence and re.match(r"^# ", line):
                has_h1 = True
        if has_h1:
            issues.append("has-h1")
        if fences < 6:
            issues.append(f"only-{fences // 2}-codeblocks")
        if tables < 3:
            issues.append(f"only-{tables}-tablerows")
        rows.append((label, words, fences // 2, tables, issues))
        if issues:
            fails.append(f"{label}: {', '.join(issues)}")

for label, words, cb, tb, issues in rows:
    flag = "OK " if not issues else "!! "
    print(f"{flag} {label:52} {words:5}w  {cb:2}cb {tb:3}tr  {'; '.join(issues)}")
print(f"\nchecked={len(rows)} files, failures={len(fails)}")
for f in fails:
    print("FAIL:", f)
sys.exit(1 if fails else 0)
