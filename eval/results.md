# Evaluation results — BoardBridge BD

**n = 3 boards.** Model `gemma-4-31b-it` via the Gemini API, `temperature=0`,
`thinkingLevel=minimal`, `responseJsonSchema` structured output. Scored by human reading of
`eval/raw/*.json` against the references written beforehand in `eval/references.md`.
Reproduce with `python3 scripts/e2e.py <base-url>`.

This is a small evaluation. It is reported as a small evaluation. No formal user testing was
conducted, and no accuracy claim beyond these three cases is made.

## Headline table

| Board | Image quality | Regions | Key-fact recall | Uncertainty detection | Source-support rate | Extract | Study pack |
|---|---|---|---|---|---|---|---|
| `mixed_notes.jpg` (Bangla+English hash tables) | good | 10 | **10 / 10** | **2 / 2 spans flagged** | **100 %** (13/13) | 28.3 s | 30.8 s |
| `flow_pseudocode.jpg` (BFS flowchart + pseudocode) | good | 12 | **8 / 8** | n/a (no degraded spans) | **100 %** (9/9) | 32.5 s | 28.2 s |
| `blurred_negative.jpg` (unreadable control) | **unusable** | **0** | n/a | n/a — correct refusal | n/a | 3.2 s | not run |

## What each row means

**Board 1 — mixed Bangla-English.** All ten reference facts survived, including the Bangla
numerals `১)` and `২)`, the formula `h(k) = k mod m`, and the five-line Python block character
for character. English technical vocabulary stayed English (`hash function`, `load factor`,
`Chaining`, `Open addressing`, `probing`) rather than being translated into Bangla — the
behaviour the prompt asks for and the behaviour a Bangladeshi CS student actually wants.

**The uncertainty case is the important one.** The bottom-right of that board carries two
heavily blurred words. Gemma returned them as a single region `r9` with
`confidence: "medium"` and `uncertainSpans: ["amortized rehash cost"]` instead of asserting
them cleanly. The UI renders that span with a red wavy underline and the student can fix or
delete it before the study pack is built.

**Board 2 — structure recovery.** Gemma typed the five process boxes as `flowchart_node` and
the two connectors as `flowchart_edge`, so the graph structure survives as data, not just as
prose. The pseudocode block came back with the loop body intact.

**Board 3 — the refusal.** The unreadable board returned `imageQuality: "unusable"` with an
empty region list in 3.2 s, and the app stopped there rather than generating a study pack. No
fabricated lecture notes. This is the case that matters most: a student who missed class
cannot tell the difference between a correct summary and a confident invention.

**Source-support rate is computed, not judged.** Every key term, code block and flashcard is
checked server-side against the real region ids in the artifact (`crossCheckSourceRegions` in
`lib/validate.ts`). Across both readable boards, 22 of 22 generated items cited a region that
actually exists. Items that fail this check are not dropped silently — they are flagged
`unsupported` and rendered with a warning badge.

## Errors we found and are not hiding

- On board 2, `র7` was transcribed as `হাঁ → End` where the board reads `হ্যাঁ → End`. A
  dropped Bangla conjunct — small, but exactly the class of error the human verification step
  exists to catch, and Gemma did **not** flag it as uncertain. Uncertainty detection is
  therefore useful but not complete.
- Latency is 28–33 s for extraction on a dense board and a further 28–31 s for the study pack.
  That is slow for a phone on mobile data. It is honest to call this a prototype latency.
- The three boards are author-generated renders with photo-style degradation, not photographs
  of real marker handwriting. Real handwriting will be harder. These numbers are an upper
  bound, not a handwriting-OCR claim.
- `n = 3` cannot support any statistical claim. It is a sanity check with published raw
  outputs, not a benchmark.
