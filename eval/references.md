# Evaluation references — BoardBridge BD

**Provenance.** All three boards were authored by the submitter for this hackathon using
`eval/make_boards.py` (committed). They are rendered mixed-script boards with photo-style
degradation (rotation, uneven lighting, blur, JPEG artefacts), **not photographs of real
classrooms and not scraped from anywhere**. No third-party or personal data is involved.
This is a real limitation and is stated in the writeup: synthetic boards are cleaner than a
genuine marker-on-whiteboard photo, so these numbers are an upper bound on handwriting
performance.

**Method.** The key facts below were written before reading any model output. Scoring is by
human reading of `eval/raw/*.json` against this list — no keyword matching, no string
overlap scoring. `n = 3`.

---

## 1. `mixed_notes.jpg` — Hash tables, Bangla + English code-switched

Key facts a correct extraction must preserve (10):
1. Title "Hash Table — হ্যাশ টেবিল"
2. কী (key) কে hash function দিয়ে index এ map করা হয়
3. `h(k) = k mod m`
4. m = table size, prime নেওয়া ভালো
5. Collision হলে দুইটা উপায়
6. ১) Chaining — প্রতি bucket এ linked list
7. ২) Open addressing — linear / quadratic probing
8. Average case O(1), Worst case O(n)
9. load factor α = n/m, α > 0.75 হলে resize করতে হবে
10. পরীক্ষায় asks: chaining vs probing তুলনা

Expected code block (5 lines, verbatim):
```
def insert(key, val):
    i = hash(key) % m
    while table[i] is not None:
        i = (i + 1) % m
    table[i] = (key, val)
```

Deliberately degraded spans (heavily blurred, bottom-right): `amortized`, `rehash cost`.
Correct behaviour is either to omit them or to transcribe them with `confidence: "low"` and
list them in `uncertainSpans`. Confidently transcribing them as clean text is a **failure**.

Language expectation: `bn` and `en` both detected; English technical terms
(hash function, load factor, Chaining, Open addressing, probing) must stay in English.

---

## 2. `flow_pseudocode.jpg` — BFS flowchart + pseudocode

Key facts (8):
1. Title mentions BFS and ছক / flowchart
2. Flow nodes: Start / শুরু → queue ← [source] → queue খালি? → u ← dequeue() → visit করা হয়নি এমন neighbour enqueue
3. Decision branch labelled হ্যাঁ → End
4. A loop edge back to the queue step
5. `BFS(G, s):` header
6. `dist[s] = 0` initialisation and `INF` for other vertices
7. `dist[v] = dist[u] + 1` relaxation
8. সময় জটিলতা: O(V + E), adjacency list ব্যবহার করলে

Expected pseudocode tokens: `for each v in V`, `dist[v] = INF`, `Q.pop(0)`, `for v in adj[u]`,
`Q.append(v)`.

Diagram expectation: flowchart nodes and at least one edge should appear as regions typed
`flowchart_node` / `flowchart_edge`, or be preserved as ordered text if the model does not
use those types.

---

## 3. `blurred_negative.jpg` — negative control

There is **no legible content**. The board is blurred beyond reading.

**Pass condition:** `imageQuality: "unusable"`, `regions: []`, and a warning explaining why.
**Fail condition:** any transcribed "content", any non-empty region list, any confident notes.

This is the most important case in the set. A system that invents plausible lecture notes
from an unreadable photo is worse than useless to a student who missed the class.

---

## Metrics and their denominators

| Metric | Definition | Denominator |
|---|---|---|
| Key-fact recall | reference facts present in the extracted artifact | 10 (board 1), 8 (board 2) |
| Uncertainty detection | degraded spans flagged in `uncertainSpans` or omitted rather than confidently transcribed | 2 (board 1 only) |
| Source-support rate | derived study-pack items with ≥1 valid `sourceRegionId` after server-side cross-check | total derived items per board |
| Negative-control behaviour | binary pass/fail on the condition above | 1 |
| Latency | wall-clock per stage from the route response | per run |

Raw outputs for every case are in `eval/raw/`. Re-run with `python3 scripts/e2e.py <base-url>`.
