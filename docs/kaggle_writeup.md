# BoardBridge BD — one whiteboard photo becomes a *verified* study pack

**Track:** Multimodal — Whiteboard to Interactive Study Guide
**Model:** `gemma-4-31b-it` (Gemma 4 vision, via the Gemini API)

| | |
|---|---|
| **Live app** | https://boardbridge-bd.vercel.app |
| **Repository** | https://github.com/ai-naymul/boardbridge-bd |
| **Notebook** | https://github.com/ai-naymul/boardbridge-bd/blob/main/notebook/boardbridge_gemma.ipynb |
| **Video** | *(paste your YouTube unlisted link here)* |

---

## 1. The problem

A student at a Bangladeshi university misses a lecture. What arrives on WhatsApp is one photo
of the whiteboard, taken at an angle under bad light. The board is Bangla explanation mixed
with English technical terms, code-switched mid-sentence, plus arrows, formulas and
pseudocode — `কী (key) কে hash function দিয়ে index এ map করা হয়।` next to a Python block and
`load factor α = n/m`.

Two things fail here. Generic OCR does badly on mixed-script handwriting and returns a flat
wall of text with no structure. And a generic summariser returns fluent, confident notes that
quietly invent whatever it could not read. That second failure is the dangerous one: the
student who missed the class is exactly the person who cannot tell a correct summary from a
confident invention.

## 2. The solution

**Gemma extracts. The app validates. The student verifies. Then the study pack is generated.**

That is the architecture, not a slogan. There are **two separate Gemma calls** with a
machine-validated, human-editable data contract between them.

1. **Stage 1 — vision.** The photo goes to `gemma-4-31b-it`, which returns a `BoardArtifact`:
   ordered regions, each with a faithful transcription, a type (`heading`, `formula`, `code`,
   `flowchart_node`…), a confidence level, and the **exact spans it was unsure about**.
2. **Validation.** The response is decoded structurally and validated against a Zod schema.
   One bounded repair retry, then an honest error. Never a fabricated fallback.
3. **Human verification.** The student sees the photo beside the transcript. Uncertain spans
   are underlined in red. They fix a Bangla word, mark a block unreadable, or delete a region
   that is not actually on the board.
4. **Stage 2 — generation.** The **corrected transcript** goes to Gemma. *The image is not
   resent* — that is what makes the student's corrections authoritative. Out come structured
   Markdown notes, key terms with Bangla glosses, code blocks and flashcards, each citing the
   `sourceRegionIds` it came from.
5. **Referential check.** Every citation is intersected server-side with the real region ids.
   Unknown ids are dropped; an item with no valid citation is flagged `unsupported` and shown
   with a warning, never presented as sourced.

There is no chat interface anywhere in this application.

## 3. How Gemma is used

**Variant:** `gemma-4-31b-it`, used as-is. No fine-tuning — the whole point is that Gemma 4's
native vision handles Bangla-English code-switched boards without a trained OCR model.

**Why Gemma fit.** The task needs a model that reads Bengali script and Latin script *in the
same visual line* and preserves both without translating. Gemma 4 accepts image input at
variable aspect ratio, is open-weight (so this pipeline can later move on-device for students
with no connectivity), and is served through the Gemini API for a browser prototype.

**Prompting and architecture decisions:**
- **Faithfulness over fluency.** The stage-1 system instruction forbids translating and
  forbids correcting spelling. English technical vocabulary stays English.
- **An explicit refusal clause.** "If the image contains no legible board content, return
  `imageQuality:"unusable"`, an EMPTY regions array… NEVER invent board content."
- **Structured output** via `responseJsonSchema` + `responseMimeType: application/json`,
  `temperature=0`, `thinkingLevel=minimal` (transcription is perception, not reasoning —
  minimal thinking cut latency roughly threefold with no fidelity loss).
- **Grounding in stage 2.** "Use ONLY facts present in the transcript… If you cannot cite a
  region, do not emit the item."
- **Structural JSON decode.** Gemma sometimes appends trailing prose or wraps the object in a
  single-element array, so we decode the first complete JSON value with a brace scanner that
  respects string literals — a structural decode, not a regex scrape.

## 4. Grounded in Bangladesh

- **Code-switching is the default assumption, not an edge case.** Bangla numerals (`১) ২)`)
  are preserved as written; `hash function`, `load factor`, `BFS` stay in English.
- **Low bandwidth.** Images downscale to 1600 px in the browser before upload — a 4 MB phone
  photo becomes a few hundred KB. Regenerating after an edit never re-uploads the image.
- **Mobile first**, camera capture via `capture="environment"`.
- **Bengali typography done properly.** Noto Sans Bengali bundled via `next/font` (not
  system-dependent, so it renders on any judge's machine), `line-height: 1.9` so conjuncts do
  not clip, `overflow-wrap: anywhere` so long unspaced Bangla does not break a 360 px viewport.
- **Confidence shown in Bangla words**, not numbers — উচ্চ / মাঝারি / কম.

## 5. Technical architecture

```
Browser (Next.js client)
  ImageDropzone → validate + downscale ≤1600px → base64
  RegionEditor  → student corrects transcript, marks unreadable, deletes regions
  StudyPackView → react-markdown (no raw HTML) + evidence tab + .md/.json export
        │ fetch()
        ▼
Next.js Route Handlers (Node runtime, server-only)
  POST /api/extract    ─ @google/genai ─ Gemini API ─ gemma-4-31b-it (image + text)
  POST /api/studypack  ─ @google/genai ─ Gemini API ─ gemma-4-31b-it (text only)
  GET  /api/config     → { model }    ← model badge; returns no secrets
        │
  GEMINI_API_KEY — server-side env var only, never NEXT_PUBLIC_*, never sent to the browser
```

Stack: Next.js 16 (App Router) · TypeScript · Tailwind · `@google/genai` · Zod · Vercel.
No database, no auth — an uploaded classroom photo is processed in memory and never stored.
Model output renders without `rehype-raw`, so model-authored HTML cannot execute.

## 6. Impact and validation

**n = 3 boards.** Method in `eval/references.md` (written before any model output was read);
raw API responses committed in `eval/raw/` so every number here can be re-checked.

| Board | Quality | Regions | Key-fact recall | Source-support | Extract |
|---|---|---|---|---|---|
| Bangla+English hash tables | good | 10 | **10/10** | **100 %** (13/13) | 28.3 s |
| BFS flowchart + pseudocode | good | 12 | **8/8** | **100 %** (9/9) | 32.5 s |
| **Unreadable board (control)** | **unusable** | **0** | — | — | 3.2 s |

Three things worth pointing at:

**The uncertainty case.** The hash-table board has two heavily blurred words in the corner.
Gemma returned them with `confidence: "medium"` and `uncertainSpans: ["amortized rehash
cost"]` rather than asserting them cleanly. The UI underlines that span in red and the student
fixes it before the study pack is built.

**The refusal.** The unreadable board returned `imageQuality: "unusable"` with zero regions in
3.2 s, and the app stopped rather than generating notes. No fabricated content.

**Source-support is computed, not judged.** 22 of 22 generated items across both readable
boards cited a region that actually exists, verified programmatically in `lib/validate.ts`.

## 7. Limitations

- **The three boards are author-generated renders** with photo-style degradation, not
  photographs of real marker handwriting. Real handwriting will be harder. These numbers are
  an upper bound, not a handwriting-OCR claim.
- `n = 3` supports no statistical claim. It is a sanity check with published raw outputs.
- **No formal user testing was conducted.** No user feedback is claimed.
- One real transcription error was found and is documented: `হ্যাঁ` came back as `হাঁ`, and
  Gemma did **not** flag it as uncertain. Uncertainty detection helps but is not complete —
  which is exactly why the human verification step is not optional.
- Latency is 28–33 s per stage. Slow on mobile data; this is a prototype.
- No bounding-box overlay — coordinate reliability was not verified, so traceability is
  carried by ordered region ids and verbatim transcripts rather than boxes that might be wrong.
- No regional dialect support is claimed or tested. Rate limiting is in-memory and
  best-effort on serverless.

## 8. Future work

Swap the hosted call for on-device Gemma 4 E2B/E4B so the pipeline runs during load-shedding
with no connectivity — the two-stage contract is unchanged, only the transport moves. Then:
bounding-box overlay once coordinate reliability is measured, Mermaid rendering of the
recovered flowchart graph, Anki export, and a real evaluation on photographed handwriting from
Bangladeshi classrooms with multiple annotators rather than n = 3 synthetic boards.

## AI assistance disclosure

Application code, prompts and documentation were written with AI coding assistance (Claude).
All model outputs reported here are real, unedited API responses. No metric, test result,
deployment claim or user feedback in this submission is fabricated.
