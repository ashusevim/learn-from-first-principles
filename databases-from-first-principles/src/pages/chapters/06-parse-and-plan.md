---
layout: ../../layouts/Chapter.astro
title: 'SQL Without the Magic: Parse & Plan'
description: 'SELECT/WHERE/ORDER BY as scan → filter → sort operators. Build: a toy planner over your storage engine.'
part: 'Part II — The Query Side'
written: true
---

You type `SELECT name FROM users WHERE age > 30`; the database does not "run your query".
It **parses your words into a tree, then builds its own plan** — choosing scan methods,
join orders, and filter positions — that merely *produces your answer*. The optimizer is
the database's opinionated rewrite engine, and `EXPLAIN` is how you read its mind. Build
a toy one and SQL stops being a request and becomes a program the DB authored for you.

## The lie you were told

> "The database executes your SQL as written."

Your SQL is a *specification* of the result, not the procedure. Between your text and your
rows sit two translations:

```text
SQL text ──parse──► AST ──plan──► operator tree ──execute──► rows
          (grammar)        (the DB's chosen procedure — this is where the IQ lives)
```

The plan is a tree of **operators** — scan, filter, project, join, sort — where data flows
upward like pipes. Your `WHERE` may run before the scan finishes (predicate pushdown),
your join order may be flipped, your `ORDER BY` may vanish (the index already sorted it).
None of that breaks the spec; all of it changes the cost.

## The operators (you know them all already)

| SQL clause | Operator | Cost |
|---|---|---|
| `FROM t` | SeqScan or IndexScan (Ch 3 decides) | O(pages) or O(log n + matches) |
| `WHERE cond` | Filter | O(rows scanned) — cheapest if applied first |
| `SELECT cols` | Project | ~free; do it early to shrink rows |
| `ORDER BY` | Sort O(n log n) — unless an index already ordered it | the usual hidden tax |
| `JOIN` | its own chapter (Ch 7) | the planner's hardest choice |

## Prove it to yourself

**1. Read the optimizer's mind:**

```sh
sqlite3 test.db "explain query plan select name from t where a = 5 order by b;"
# SEARCH t USING INDEX idx_a (a=?)     ← it turned your WHERE into a tree walk (Ch 3)
# USE TEMP B-TREE FOR ORDER BY        ← it must sort: no index on b
```

**2. Watch the plan change under the data:**

```sh
sqlite3 test.db "explain query plan select * from t where a < 1000000;"
# SCAN t — almost every row matches; walking the index for 90% of rows would be SLOWER.
# The planner is not "using the index because indexes are fast". It's doing arithmetic.
```

That's the deepest lesson of this chapter: **"the index wasn't used" is not a bug** —
it's the planner declining a bad trade. (And the usual cause of "it used the index
yesterday but not today": the data distribution changed.)

**3. See it pay to reorder your own SQL:**

```sh
sqlite3 test.db "explain query plan select * from t, t2 where t.a = t2.a and t.a < 10;"
# the filter t.a < 10 runs FIRST (pushed into the scan) — the join sees ~10 rows, not 200k
```

## The build: a toy planner over your engine

A 35-line planner that parses `SELECT name FROM people WHERE age > N` and executes it as
a pipeline of generators — each operator pulling from the one below:

```python
# plan.py — SQL text → parse → plan → execute. The whole query side, miniaturized.
import re

def parse(sql):                                   # grammar school: 1 statement shape
    m = re.match(r"SELECT (.+) FROM (\w+) WHERE (\w+) ([<>=]+) (.+)", sql)
    return {"select": m[1].split(", "), "table": m[2],
            "col": m[3], "op": m[4], "val": m[5].strip("'\" ")}

def seq_scan(table):                              # operator 1: yield rows lazily
    for line in open(f"{table}.csv"):
        yield line.strip().split(",")

def filter(rows, col, op, val):                   # operator 2: predicate
    ops = {">": lambda a, b: a > b, "=": lambda a, b: a == b, "<": lambda a, b: a < b}
    for row in rows:
        if ops[op](row[0], val):                  # (toy schema: filter col = col 0)
            yield row

def project(rows, cols, header):                  # operator 3: shrink rows early
    idx = [header.index(c) for c in cols]
    for row in rows:
        yield [row[i] for i in idx]

def execute(sql):                                 # the PLAN: build the tree, bottom-up
    q = parse(sql)
    header = open(f"{q['table']}.csv").readline().strip().split(",")
    plan = project(filter(seq_scan(q["table"]), q["col"], q["op"], q["val"]),
                   q["select"], header)
    for row in plan: print(row)

execute("SELECT name, age FROM people WHERE name > 'b'")
# reads people.csv → filters → projects — exactly the operator tree, no magic
```

Run it against a CSV and you've executed a query the way SQLite does — parse, build
operators, pull rows up the tree. A real planner adds a **cost model** and *searches*
tree shapes (join orders!); you'll price one choice in Chapter 7.

## What you now know

- SQL is a **spec**; the plan is the DB's own program — read it with `EXPLAIN`.
- Operators (scan/filter/project/join/sort) are composable stages; cost decides the shape.
- **Predicate pushdown** and index-choice are planner arithmetic, not magic — and
  "ignored index" usually means "the planner did the math you didn't".
- `EXPLAIN` is not trivia: it's the debugger for the query side of everything you build.

Next: the operator you haven't built — the planner's most expensive decision. Joins,
and why nested loops are the innocent-looking O(n·m) bomb.
