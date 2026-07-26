# BoardBridge BD

**One photo of a messy Bangla-English classroom whiteboard becomes a *verified* study pack —
clean notes, extracted code and flashcards, where every generated item points back to the
board region it came from, and anything the model was unsure about is shown as unsure and is
editable before the study pack is built.**

Built for **Build With Gemma @Bangladesh** — Multimodal Track (*Whiteboard to Interactive
Study Guide*).

| | |
|---|---|
| **Live app** | https://boardbridge-bd.vercel.app |
| **Model** | `gemma-4-31b-it` (Gemma 4, via the Gemini API) — shown live in the app header |
| **Notebook** | [`notebook/boardbridge_gemma.ipynb`](notebook/boardbridge_gemma.ipynb) |
| **Evaluation** | [`eval/results.md`](eval/results.md) · raw outputs in [`eval/raw/`](eval/raw) |

---

## The problem

A Bangladeshi university student misses a lecture and receives one photo of the whiteboard on
WhatsApp. The board is a mixture of Bangla explanation, English technical terms, code-switched
sentences, arrows, formulas and pseudocode, photographed at an angle under bad light. Generic
OCR does poorly on mixed-script handwriting and returns a flat wall of text. A generic
summariser returns fluent notes that quietly invent whatever it could not read — which is
worse than nothing, because the student who missed the class cannot tell the difference.

## What this does differently

**Gemma extracts. The app validates. The student verifies. Then the study pack is generated.**

That is not a slogan, it is the architecture. There are **two separate Gemma calls** with a
machine-validated, human-editable data contract between them:

1. **Stage 1 (vision)** — the photo goes to `gemma-4-31b-it`, which returns a `BoardArtifact`:
   ordered regions, each with a faithful transcription, a type (`heading`, `formula`, `code`,
   `flowchart_node`, …), a confidence level, and the exact spans it was unsure about.
2. **Validation** — the response is parsed structurally and validated against a Zod schema.
   One bounded repair retry, then an honest error. Never a fabricated fallback.
3. **Human verification** — the student sees the photo beside the transcript. Uncertain spans
   are underlined in red. They can fix a Bangla word, mark a block unreadable, or delete a
   region that is not actually on the board.
4. **Stage 2 (text)** — the **corrected transcript** is sent to Gemma. *The image is not
   resent*, which is what makes the student's corrections authoritative. Out comes structured
   Markdown notes, key terms with Bangla glosses, code blocks and flashcards — each citing the
   `sourceRegionIds` it was derived from.
5. **Referential check** — every citation is intersected server-side with the real region ids.
   Unknown ids are dropped; an item with no valid citation is flagged `unsupported` and
   rendered with a warning, never presented as sourced.

There is no chat interface anywhere in this application.

## Why this is grounded in Bangladesh

- **Code-switching is the default assumption, not an edge case.** The prompt explicitly
  forbids translating: `hash function`, `load factor` and `BFS` stay in English, the Bangla
  explanation stays Bangla, and Bangla numerals (`১) ২)`) are preserved as written.
- **Low bandwidth.** Images are downscaled to 1600 px in the browser before upload — a 4 MB
  phone photo becomes a few hundred KB. Regenerating after an edit never re-uploads the image.
- **Mobile first.** Single column under 768 px, camera capture via `capture="environment"`.
- **Bengali typography done properly.** Noto Sans Bengali bundled via `next/font` (not
  system-dependent), `line-height: 1.9` so conjuncts do not clip, `overflow-wrap: anywhere` so
  long unspaced Bangla strings do not blow out a 360 px viewport.
- **Confidence is shown in Bangla words, not numbers** — উচ্চ / মাঝারি / কম.

## Results

`n = 3` boards. Full method and raw outputs in [`eval/`](eval).

| Board | Quality | Regions | Key-fact recall | Source-support | Extract |
|---|---|---|---|---|---|
| Bangla+English hash tables | good | 10 | 10/10 | 100 % (13/13) | 28.3 s |
| BFS flowchart + pseudocode | good | 12 | 8/8 | 100 % (9/9) | 32.5 s |
| **Unreadable board (control)** | **unusable** | **0** | — | — | 3.2 s |

The third row is the one to look at: given an unreadable photo, the system returns
`imageQuality: "unusable"` with zero regions and refuses to build a study pack, instead of
inventing plausible lecture notes.

## Limitations

- **The three evaluation boards are author-generated renders** with photo-style degradation,
  not photographs of real marker handwriting. Real handwriting will be harder. These numbers
  are an upper bound, not a handwriting-OCR claim.
- `n = 3` supports no statistical claim. It is a sanity check with published raw outputs.
- **No formal user testing was conducted.** No user feedback is claimed anywhere.
- Latency is 28–33 s per stage on a dense board. Slow for mobile data; this is a prototype.
- One real transcription error was found and is documented in `eval/results.md`
  (`হ্যাঁ` → `হাঁ`), and Gemma did **not** flag it as uncertain. Uncertainty detection helps
  but is not complete — which is precisely why the human verification step is not optional.
- No bounding-box overlay. Region coordinate reliability was not verified, so traceability is
  carried by ordered region ids and verbatim transcripts rather than boxes that might be wrong.
- No regional dialect support is claimed or tested.
- Rate limiting is in-memory and therefore per-instance and best-effort on serverless. It
  exists to stop one tab hammering the free tier, not as real abuse protection.

## Run it locally

```bash
git clone https://github.com/ai-naymul/boardbridge-bd
cd boardbridge-bd
pnpm install

cp .env.example .env.local
# put your Gemini API key in .env.local — it is gitignored and server-only:
#   GEMINI_API_KEY=your_key_here
#   GEMMA_MODEL=gemma-4-31b-it

pnpm dev            # http://localhost:3000
```

Reproduce the evaluation against any running instance:

```bash
python3 eval/make_boards.py                 # regenerate the three test boards
python3 scripts/e2e.py http://localhost:3000
```

## Architecture

```
Browser (Next.js client)
  ├─ ImageDropzone   → MIME/size validation → canvas downscale ≤1600px → base64
  ├─ RegionEditor    → student edits transcript, marks unreadable, deletes regions
  └─ StudyPackView   → react-markdown (no raw HTML) + evidence tab + export
        │ fetch()
        ▼
Next.js Route Handlers (Node runtime, server-only)
  ├─ POST /api/extract    ─ @google/genai ─ Gemini API ─ gemma-4-31b-it  (image + text)
  ├─ POST /api/studypack  ─ @google/genai ─ Gemini API ─ gemma-4-31b-it  (text only)
  └─ GET  /api/config     → { model }        ← powers the model badge, returns no secrets
        │
   GEMINI_API_KEY — server-side env var only, never NEXT_PUBLIC_*, never sent to the browser
```

| File | Responsibility |
|---|---|
| `lib/schemas.ts` | Zod schemas + the JSON Schema sent as `responseJsonSchema`. Single source of truth for both stages. |
| `lib/gemma.ts` | The **only** module that reads the API key or calls the Gemini API. Structural JSON decode + one repair retry. |
| `lib/prompts.ts` | Both system instructions, verbatim and auditable. |
| `lib/validate.ts` | Image guards + `crossCheckSourceRegions` referential integrity. |
| `lib/ratelimit.ts` | Best-effort per-IP token bucket. |

## Security and privacy

- Uploaded images are processed in memory and **never stored**. No database, no auth, no
  persistence of classroom photos.
- The API key is server-side only, in `.env.local` (gitignored) and Vercel encrypted env vars.
  `.env.example` ships with an empty value. `/api/config` returns the model id and nothing else.
- Model output is rendered with `react-markdown` **without** `rehype-raw`, so model-authored
  HTML or `<script>` cannot execute. Code renders as text in `<pre>`.
- Server-side validation of MIME type (JPEG/PNG/WebP), size (≤8 MB) and non-empty payload.
- Logs record `{route, status, latencyMs, model}` only — no prompts, no image bytes, no key.

## No hardcoded AI

Every upload triggers a real Gemma call. There are no canned responses, no fixtures, no cached
"demo output" in the codebase — choosing a sample board goes through the identical
`/api/extract` path as your own photo. The three results in `eval/raw/` are real API responses,
committed so anyone can check the numbers in `eval/results.md`. API failures surface as honest
errors with a retry, never as fabricated notes.

## License

Code: MIT. Evaluation boards: authored by the submitter, released with the repository.

## AI assistance disclosure

The application code, prompts and documentation in this repository were written with AI
coding assistance (Claude). All model outputs reported in `eval/` are real, unedited API
responses. No metric, test result or user feedback in this repository is fabricated.
