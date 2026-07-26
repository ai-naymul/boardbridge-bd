# BoardBridge BD — Execution Plan

> **For agentic workers:** Execute `TASKS.md` top to bottom. Every task has an acceptance test. Do not mark a task done without running its acceptance test. Deadline is hard and external.

**Goal:** Ship a working Gemma-4-vision web app that turns one messy Bangla-English whiteboard photo into a *verified* study pack (structured notes + code + flashcards, every item traceable to a source region), plus all five Kaggle submission components, before the competition deadline.

**Architecture:** Next.js App Router. Two server-side API routes call Gemma 4 through the Gemini API — route 1 does image→structured `BoardArtifact`, route 2 does verified-`BoardArtifact`→`StudyPack`. The human edits the artifact between the two calls. Zod validates both model outputs; a cross-check rejects any derived item citing a nonexistent region. No database, no auth.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS, `@google/genai` (official Google Gen AI JS SDK), Zod, `react-markdown`, Vercel, GitHub.

---

## 0. HARD DEADLINE — VERIFIED

| Item | Value | How verified | Verified at |
|---|---|---|---|
| Competition | Build With Gemma @Bangladesh, `kaggle.com/competitions/build-with-gemma-bangladesh` | Kaggle CLI `competitions list -s bangladesh`, authenticated as `ainaymul` | 2026-07-26 08:01 UTC |
| **Close** | **2026-07-26 10:00:00 UTC = 16:00 Asia/Dhaka** | Kaggle CLI `deadline` column (UTC) + page header "2 hours to go" | 2026-07-26 08:01 UTC |
| Entered already | `userHasEntered: True` | Kaggle CLI | 2026-07-26 08:01 UTC |
| Host | Shahriar Azad Evan (`kaggle.com/msaevan`) | competition page header | 2026-07-26 08:05 UTC |
| Access | "Invitation required" (already joined, so not a blocker) | competition page header | 2026-07-26 08:05 UTC |

**Consequence:** roughly **105 usable minutes** at plan-approval time. This plan is re-scoped from the original brief to fit that. Everything in the original brief that does not fit is explicitly demoted to P1/stretch or dropped in §12, not silently omitted.

---

## 1. Current-state inspection (actual, not assumed)

| Check | Finding |
|---|---|
| `/home/escobar/gemma_hackathon_bd` | Exists, **completely empty** (0 entries including hidden) |
| Git repo | **None.** `git rev-parse` → "not a git repository" |
| Existing planning docs / package manifests / notebooks | None |
| Node / npm / pnpm | v22.22.1 / 10.9.4 / 11.15.0 |
| Bun | not installed |
| Python | 3.12.3; `google-generativeai` 0.8.6 installed, `google-genai` **not** installed, `nbformat` **not** installed |
| Git identity | Naymul Islam / naymul504@gmail.com |
| GitHub CLI | v2.86.0, authenticated as **`ai-naymul`**, scopes `gist, read:org, repo, workflow` |
| Kaggle CLI | v2.0.0 (outdated, works), authenticated as **`ainaymul`** |
| Vercel CLI | 56.4.1, authenticated as **`nymtheescobar-9697`** |
| Screen recording | `ffmpeg` and `obs-studio` present |
| Disk | `/` 35 GB free (73% used) — enough for one Next.js project |
| Project-level `CLAUDE.md` | None in this directory. `~/CLAUDE.md` (BanglaSafe) and `~/.claude/CLAUDE.md` (global) apply |
| Secrets on disk | `~/.kaggle/kaggle.json`, Vercel `auth.json` exist. **Not read, not echoed.** No `GEMINI_API_KEY` / `GOOGLE_API_KEY` in env |

**Implication:** greenfield. Nothing to migrate, nothing at risk of being overwritten. All three auth surfaces we need (GitHub, Kaggle, Vercel) are already live, which removes ~15 minutes of account setup from the critical path.

---

## 2. Verified competition facts

All quotes below are from `https://www.kaggle.com/competitions/build-with-gemma-bangladesh/overview`, retrieved 2026-07-26 ~08:05 UTC via Firecrawl.

### 2.1 Our track — confirmed match

> **2. The Multimodal Track** — *Official Scope:* "Best use of Gemma 4's vision capabilities for vision-to-text use cases."
> *Localized Theme — Whiteboard to Interactive Study Guide:* "A tool where a student snaps a photo of dense, messy, multilingual (Bangla and English) lecture notes, flowcharts, or pseudocode on a whiteboard. The Gemma 4 vision application digitizes the text and automatically transforms the chaotic board into a clean, structured Markdown summary, extracts actionable code snippets, or generates a set of interactive Q&A flashcards."

**Decision: keep the category.** The official scope names *Gemma 4 vision*, and the theme names *Markdown summary, code snippets, flashcards* — which is exactly the P0 deliverable below. No fatal feasibility issue found; no pivot.

### 2.2 The five required components (verbatim structure)

> "All submissions must include the following five components. Incomplete submissions (missing any required component) will not be eligible for judging."
> "**Your final Submission must be made prior to the deadline. Any un-submitted or draft Writeups by the hackathon deadline will not be considered by the Judges.**"
> "To create a new Writeup, click on the 'New Writeup' button [at `/competitions/build-with-gemma-bangladesh/projects`]. After you have saved your Writeup, you should see a 'Submit' button in the top right corner."
> "Note: If you attach a private Kaggle Resource to your public Kaggle Writeup, your private Resource will automatically be made public after the deadline."

1. **Kaggle Writeup** — problem statement (with data/evidence where possible), solution overview, how Gemma is used (variant, fine-tuning approach if any, prompting/architecture decisions, why Gemma fit), technical architecture (diagram or clear description), impact and validation (user testing, sample outputs, accuracy metrics, or feedback), limitations and future work.
2. **Media Gallery** — screenshots of key screens/flows, diagrams (architecture / data pipeline / user flow), sample inputs and outputs (before/after, predictions vs ground truth), optional field-testing photos.
3. **Public Notebook** — "A publicly accessible Kaggle notebook (**or linked GitHub/Colab notebook if Kaggle hosting isn't practical for your stack**)" with reproducible Gemma integration code, clear comments so judges can re-run key steps, and linked/documented/licensed datasets. ← the GitHub fallback is explicitly allowed, which is what we will use (our stack is a TypeScript web app).
4. **Video** — 3–5 minutes, shows the app end-to-end on a real/realistic case, explains problem and who it helps in plain language, shows Gemma's role (not just the UI), uploaded to YouTube unlisted or public and linked.
5. **Public Project Link** — deployed web app **or** public GitHub repo with clear setup/run instructions; "The link must remain active through the judging period." We will provide both.

### 2.3 Goal criteria (all five must be visibly satisfied)

> "1. Uses Gemma … as a core component. 2. Goes beyond a chatbot — core value from automation, data processing, multimodal understanding, or workflow integration, not just conversational Q&A. 3. Is usable and testable — evaluators should be able to interact with a real, functioning prototype. 4. Is grounded in local context — language, data, user behavior, and constraints (connectivity, literacy, device access) specific to Bangladesh should visibly shape your design decisions. 5. Targets a specific, clearly defined single problem from the category section."

### 2.4 Rubric — CONFIRMED AS A TEMPLATE, not final

The page's Evaluation section explains Kaggle's hackathon rubric policy and then says **"An example template is below:"** followed by Application (60 pts: Usefulness 15 / Informativeness 15 / Engagement 10 / Documentation Quality 15 / Novelty 5 / Required Elements Yes-No) and Video (40 pts: Accuracy 10, …).

- **Status: the host did not publish a track-specific rubric beyond this template.** The user's suspicion was correct.
- **Load-bearing constraint we will honor anyway** (cheap to satisfy, expensive to fail): *"Required Elements: … is less than 2000 words and uses a minimum of 10 graphics."* → **writeup < 2000 words, ≥ 10 graphics.** Treated as binding.

### 2.5 Prizes / eligibility — one open question for Naymul

> "**Online Track · $1,000** — This track is for online participants only **for all undergraduate students across Bangladesh**; no one who's registered for the offline round will qualify for this." (1st $450 / 2nd $300 / 3rd $250)
> "**Online - Best teams** — The online teams that will perform best will be awarded a license from Datacamp." (no stated undergraduate restriction)

Naymul is an independent researcher under the BanglaLLM identity, not necessarily a currently-enrolled undergraduate. **This affects prize eligibility only, not submission validity or judging.** Do not let it block the build. Flagged in §13 as a decision for Naymul.

### 2.6 Disqualification conditions (derived, from the page text)

| Condition | Our guard |
|---|---|
| Gemma not a core component | Both model calls are Gemma 4; model ID is printed in the UI, README, notebook and writeup |
| Unmodified chatbot wrapper | No chat interface exists anywhere in the app. The product is a two-stage extract→verify→generate pipeline |
| Any of the five components missing | `docs/COMPLIANCE_AND_SUBMISSION_CHECKLIST.md` gates each one |
| Writeup left in draft | Final task is to click Submit and re-read the page to confirm state ≠ draft |

---

## 3. Verified model / API facts

Source: `https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api` and `https://ai.google.dev/gemma/docs/core`, retrieved 2026-07-26 ~08:07 UTC.

| Fact | Status | Detail |
|---|---|---|
| Gemma models on the Gemini API | **Verified** | `gemma-4-31b-it` and `gemma-4-26b-a4b-it` |
| Image input | **Verified** | "Gemma 4 models can process images, enabling many frontier developer use cases that would have historically required domain specific models." Gemma 4 core doc: "Processes Text, Image with variable aspect ratio and resolution support (all models)." |
| System instructions | **Verified** | documented with example |
| Function calling | **Verified** | documented with example (tool/function declarations) |
| Thinking level | **Verified** | settable `'high'` / `'minimal'` |
| **`responseJsonSchema` structured output on Gemma** | **UNVERIFIED — highest technical risk** | Not listed in the official Gemma-on-Gemini-API page. Third-party reports claim `responseMimeType` + `responseJsonSchema` works on `gemma-4-31b-it` including multimodal input, but that is a blog claim, not primary documentation. **Must be settled empirically in Spike S1.** |
| Rate limits for Gemma tier | **UNVERIFIED** | not stated on that page. Assume low; do not build anything that fans out many concurrent calls |
| Gemma 4 family | **Verified** | E2B, E4B, 12B, 31B, 26B-A4B; all accept image; E2B/E4B/12B also video+audio |

**Primary model decision:** `gemma-4-31b-it`. It is the largest Gemma 4 served on the Gemini API and the doc's own examples use the family. Fallback if quota/latency bites: `gemma-4-26b-a4b-it` (MoE, "high-throughput reasoning").

**Structured-output strategy (decided now, so the spike is a yes/no not a design session):**
1. Attempt A: `responseMimeType: "application/json"` + `responseJsonSchema: <our schema>`.
2. If the API rejects either field for a Gemma model → Attempt B: keep `responseMimeType: "application/json"` only.
3. If that also fails → Attempt C: plain generation with a strict "output only JSON, no prose, no code fence" system instruction.
4. **In all three cases** the response goes through the same funnel: strip an optional ```json fence → `JSON.parse` → `zod.safeParse`. On failure, exactly **one** repair round-trip that sends the raw output plus the Zod error back and asks for corrected JSON only. On second failure, surface an honest error to the user. No regex scraping of arbitrary JSON out of prose.

---

## 4. Product scope

### 4.1 One-sentence pitch
One photo of a messy Bangla-English classroom whiteboard becomes a *verified* study pack — clean notes, extracted code, and flashcards — where every generated item points back to the board region it came from, and anything the model was unsure about is shown as unsure and is editable before the study pack is built.

### 4.2 The differentiator, in one line the judges will hear in the video
**"Gemma extracts. The app validates. The student verifies. Then the study pack is generated."**

That sentence is also the architecture. It is what makes this not-a-chatbot: there are two distinct model calls with a human-editable, machine-validated data contract between them.

### 4.3 Primary user
A Bangladeshi university student (CS/engineering) holding a whiteboard photo containing Bangla explanation, English technical terms, code-switching, arrows/flowcharts, and partially illegible handwriting.

### 4.4 P0 — must ship (this is a complete, competitive submission on its own)

| # | Feature | Why it is P0 |
|---|---|---|
| 1 | Upload / camera-capture a whiteboard image, client-side downscale to ≤1600 px longest edge, MIME + size validation | entry point; downscale is the low-bandwidth story |
| 2 | Real Gemma 4 vision call → `BoardArtifact` (title, detectedLanguages, imageQuality, ordered regions with type/transcription/confidence/uncertainSpans/languageTags, codeBlocks, warnings) | this *is* the multimodal track |
| 3 | Zod validation + one bounded repair retry + honest failure | no-hardcoding rule #8 |
| 4 | Side-by-side verification panel: original image left, editable region list right; edit transcription, mark region unreadable, delete a hallucinated region | the human-in-the-loop differentiator |
| 5 | Visible uncertainty: per-region confidence chip + highlighted `uncertainSpans` | rubric "Novelty" + honest-AI story |
| 6 | Second Gemma call on the **verified artifact JSON** (not the raw image) → `StudyPack` (markdown notes, keyTerms, codeBlocks, flashcards) each carrying `sourceRegionIds` | workflow integration, not Q&A |
| 7 | Server-side referential check: drop/flag any derived item whose `sourceRegionIds` are not in the artifact | no-hardcoding rule #9 |
| 8 | Results tabs: Notes / Code / Flashcards / Evidence | judge-visible |
| 9 | Markdown + JSON export (download + copy) | "usable" criterion |
| 10 | Model ID badge in the header, live from the server | disqualification guard |
| 11 | Mobile-first responsive layout, Bangla-safe typography | "grounded in local context" |
| 12 | Deployed on Vercel, public GitHub repo, README | components 5 |
| 13 | Notebook reproducing the Gemma call | component 3 |
| 14 | ≥10 graphics, video, submitted writeup | components 1, 2, 4 |

### 4.5 P1 — only if the clock allows (see §11 gates)
Interactive quiz tab; Mermaid flowchart render (strict `securityLevel:'strict'`, no HTML labels); Anki CSV export; a third and fourth evaluation image.

### 4.6 Dropped for this sprint (state honestly in Limitations, do not fake)
Bounding-box overlay on the image (Gemma coordinate reliability unverified and unaffordable to verify now); multi-board merge; history/IndexedDB persistence; offline/on-device inference; PDF export; classroom sharing; regional dialect claims; formal user testing.

---

## 5. User flow (P0, exactly what gets built)

```
[1] Upload  ──► client validate (mime allowlist, ≤8 MB) ──► canvas downscale ≤1600px, JPEG q0.85
                                     │
                                     ▼
[2] POST /api/extract  ──► Gemma 4 vision (image + extraction system prompt)
                                     │  JSON → Zod(BoardArtifactSchema) → [1 repair retry] → honest error
                                     ▼
[3] Verify screen: image | editable region list (transcription, confidence chip, uncertain spans,
                                                 "mark unreadable", "delete region")
                                     │  user edits → artifact.regions[i].edited = true
                                     ▼
[4] POST /api/studypack  ──► Gemma 4 text (verified artifact JSON only — image is NOT resent)
                                     │  JSON → Zod(StudyPackSchema) → referential check on sourceRegionIds
                                     ▼
[5] Results tabs: Notes | Code | Flashcards | Evidence      [6] Export .md / .json
```

Regenerating after an edit re-runs step 4 only. That is the "correct one word → regenerate → the notes change" video beat, and it is cheap (no second vision call).

---

## 6. Technical architecture

```
Browser (Next.js client component)
  ├─ ImageDropzone      → validate + downscale (canvas) → base64
  ├─ RegionEditor       → local state, no network
  └─ StudyPackView      → react-markdown (no rawHtml)
        │  fetch()
        ▼
Next.js Route Handlers (Node runtime, server-only)
  ├─ POST /api/extract    ── @google/genai ── Gemini API ── gemma-4-31b-it (image+text)
  ├─ POST /api/studypack  ── @google/genai ── Gemini API ── gemma-4-31b-it (text)
  └─ GET  /api/config     → { model: process.env.GEMMA_MODEL }   ← powers the UI model badge
        │
   process.env.GEMINI_API_KEY   (Vercel env var, server-only, never NEXT_PUBLIC_*)
```

**File structure (locked before task decomposition):**

| Path | Responsibility |
|---|---|
| `app/page.tsx` | single page; orchestrates the 3 stages; holds artifact state |
| `app/api/extract/route.ts` | stage-1 handler: validate input, call Gemma vision, validate output |
| `app/api/studypack/route.ts` | stage-2 handler: call Gemma text, validate output, referential check |
| `app/api/config/route.ts` | returns active model id (no secrets) |
| `lib/schemas.ts` | Zod schemas + inferred TS types for `BoardArtifact` and `StudyPack` — the single source of truth for both routes and the UI |
| `lib/gemma.ts` | the only file that touches `@google/genai`; `callGemma({parts, schema, systemInstruction})` with the 3-tier structured-output strategy + 1 repair retry |
| `lib/prompts.ts` | the two system prompts as exported consts (so the notebook and README can quote them verbatim) |
| `lib/validate.ts` | `crossCheckSourceRegions(pack, artifact)` + image MIME/size guards |
| `components/ImageDropzone.tsx` | upload/capture, downscale, preview |
| `components/RegionEditor.tsx` | per-region edit / confidence chip / unreadable / delete |
| `components/StudyPackView.tsx` | tabbed results + export buttons |
| `notebook/boardbridge_gemma.ipynb` | reproducible Python call to the same model with the same prompt+schema |
| `eval/` | test images, `references.md` (hand-written ground truth), `results.md` (real outputs) |
| `docs/` | this plan, compliance checklist, architecture diagram source |

Rationale for the split: `lib/schemas.ts` is imported by both routes and every component, so the data contract cannot drift; `lib/gemma.ts` is the only place an API key is referenced, so the "no key on the client" audit is a one-file check.

---

## 7. Data contracts (final — implement exactly this)

```ts
// lib/schemas.ts
export const RegionType = z.enum([
  'heading','paragraph','bullet_list','formula','code','pseudocode',
  'flowchart_node','flowchart_edge','table','label','unknown'
]);

export const RegionSchema = z.object({
  id: z.string().min(1),                    // "r1", "r2", ...
  order: z.number().int().nonnegative(),
  type: RegionType,
  transcription: z.string(),                // faithful, verbatim, NOT cleaned up
  confidence: z.enum(['high','medium','low']),
  uncertainSpans: z.array(z.string()).default([]),
  languageTags: z.array(z.enum(['bn','en','mixed','symbol'])).default([]),
  edited: z.boolean().default(false),       // set by the client, never by the model
  unreadable: z.boolean().default(false),
});

export const BoardArtifactSchema = z.object({
  schemaVersion: z.literal('1.0'),
  title: z.string(),
  detectedLanguages: z.array(z.string()),
  imageQuality: z.enum(['good','fair','poor','unusable']),
  regions: z.array(RegionSchema),
  codeBlocks: z.array(z.object({
    id: z.string(), language: z.string(), code: z.string(),
    sourceRegionIds: z.array(z.string()),
  })).default([]),
  warnings: z.array(z.string()).default([]),
});

export const StudyPackSchema = z.object({
  schemaVersion: z.literal('1.0'),
  notesMarkdown: z.string(),
  keyTerms: z.array(z.object({
    term: z.string(), bnGloss: z.string(),
    sourceRegionIds: z.array(z.string()),
  })).default([]),
  codeBlocks: z.array(z.object({
    language: z.string(), code: z.string(),
    sourceRegionIds: z.array(z.string()),
  })).default([]),
  flashcards: z.array(z.object({
    front: z.string(), back: z.string(),
    sourceRegionIds: z.array(z.string()),
    supportedByUncertainText: z.boolean().default(false),
  })).default([]),
  warnings: z.array(z.string()).default([]),
});
```

Notes on deliberate omissions: `approximateBounds` is **absent** from the schema because coordinate reliability is unverified — per the brief, traceability is carried by ordered region IDs + verbatim transcription instead of fake boxes. `explanations`/`diagrams`/`quizQuestions` from the original brief are P1; adding optional fields we do not render would be dead weight.

**Referential integrity rule (server-side, `lib/validate.ts`):** for every derived item, `sourceRegionIds ⊆ {artifact.regions[*].id}`. Unknown IDs are stripped and a warning is appended: `"dropped N unverifiable source references"`. Items left with zero valid IDs are kept but flagged `unsupported: true` and rendered with a visible warning badge — they are never silently presented as sourced.

`unsupported` is **server-added, never model-authored**: every derived-item object in `StudyPackSchema` (`keyTerms[]`, `codeBlocks[]`, `flashcards[]`) carries `unsupported: z.boolean().default(false)`, and `crossCheckSourceRegions` is the only writer of that field. The model is not asked for it and any value it supplies is overwritten.

---

## 8. Prompting strategy

Both prompts live in `lib/prompts.ts` and are quoted verbatim in the notebook and README (judges can audit them).

**Stage 1 — extraction system instruction (behavioral requirements, not the literal text):**
- Role: faithful transcriber of a photographed classroom whiteboard from Bangladesh.
- Transcribe **exactly what is written**, including Bangla, English, code-switching, and Bangla numerals as they appear. **Do not translate, do not correct spelling, do not tidy handwriting.**
- If a token is illegible, transcribe your best guess and list it in `uncertainSpans`; set `confidence:"low"` for that region.
- **If the image contains no legible board content, return `imageQuality:"unusable"`, an empty `regions` array, and a warning. Never invent content.** ← this is the anti-fabrication clause the blurred-image test exercises.
- Preserve reading order in `order`. Assign ids `r1..rN`.
- Output JSON only, conforming to the schema.

**Stage 2 — study pack system instruction:**
- Input is a **verified transcript** (JSON). You may not add facts that are not present in it. No outside knowledge, no worked examples the board did not contain.
- Notes in Markdown; keep English technical terms in English; explain in simple Bangla where the board was in Bangla.
- Every `keyTerm`, `codeBlock`, and `flashcard` must cite the `sourceRegionIds` it came from.
- If an item depends on a region with `confidence:"low"` or a non-empty `uncertainSpans`, set `supportedByUncertainText:true`.
- Skip regions marked `unreadable:true`.
- Output JSON only.

Decoding: `temperature: 0` for both stages (determinism helps the reproducibility claim and the eval). `thinkingLevel` left default; if latency exceeds ~25 s in the spike, set `'minimal'` for stage 2.

---

## 9. UI, localization, security

**Localization (Bangladesh-grounded, must be visible to a judge):**
- Font stack `'Noto Sans Bengali', 'Hind Siliguri', system-ui, sans-serif` loaded via `next/font` with `display: swap`; `lang="bn"` on Bangla text nodes so the browser picks the right shaper.
- `line-height: 1.9` on Bangla-bearing blocks (Bengali conjuncts clip at 1.5), `overflow-wrap: anywhere` so long unspaced Bangla strings do not blow out the mobile layout.
- Mixed BN/EN rendered in one flow with no forced translation. English technical vocabulary is preserved by prompt rule, not stripped.
- Bangla numerals preserved verbatim from the board.
- Mobile-first: single column < 768 px, image and editor stack; camera capture via `<input type="file" accept="image/*" capture="environment">`.
- Low bandwidth: client-side downscale before upload (typically 4 MB phone photo → ~300 KB), and the regenerate path never re-uploads the image.
- Confidence rendered as words + color, not a bare number: `উচ্চ / মাঝারি / কম` chips.
- **Claim discipline:** the app and writeup claim *"handles mixed Bangla-English handwriting"*, tested on n=3. They do **not** claim regional dialect support or general Bangla handwriting OCR accuracy.

**Security / privacy:**
- `GEMINI_API_KEY` server-only. Never `NEXT_PUBLIC_*`. Never sent to the client. `/api/config` returns only the model id.
- `.gitignore` includes `.env*` (except `.env.example` which contains **only** `GEMINI_API_KEY=` with an empty value and no key).
- Input guards: MIME allowlist `image/jpeg|png|webp`, ≤8 MB post-downscale, non-zero bytes, and a decoded-dimension check.
- Output guards: `react-markdown` **without** `rehype-raw` → model-authored HTML/script cannot execute. Code blocks rendered as text in `<pre>`, never `dangerouslySetInnerHTML`. If P1 Mermaid lands: `securityLevel:'strict'`, `htmlLabels:false`, and only from a validated node/edge list, not free-text.
- Route-level: 45 s `AbortController` timeout per model call, request body cap, simple in-memory per-IP token bucket (5 req/min) with an honest note in the README that in-memory limiting is best-effort on serverless.
- No image is written to disk or any store. Processed in memory, discarded after the response. Stated in a visible privacy line in the UI footer and in the README.
- Logging: `{route, status, latencyMs, bytesIn, model}` only. No prompt text, no image bytes, no key.
- `export const maxDuration = 60` and `export const runtime = 'nodejs'` on both model routes.

---

## 10. Evaluation plan (honest, and sized to the clock)

Formal 5–8-image annotated evaluation is **not achievable in 105 minutes**. Reduced, and the reduction is disclosed rather than hidden.

**Set (minimum 3, target 4):**
1. `mixed_notes.jpg` — Bangla explanation + English CS terms, dense.
2. `flow_pseudocode.jpg` — flowchart with arrows + pseudocode block.
3. `blurred_negative.jpg` — deliberately unusable image. **This is the most important case:** correct behavior is `imageQuality:"unusable"`, zero regions, a warning — *not* confident notes.
4. (if time) `equations.jpg` — formulas + Bangla labels.

**Provenance:** images are self-created by the author on a whiteboard/paper for this submission. Stated in `eval/references.md` and the writeup. No scraped or third-party classroom photos.

**Per-image hand reference** in `eval/references.md`: ≤10 key facts, expected code lines/tokens, known-illegible spans. Written by a human before looking at model output.

**Metrics — each with its denominator defined:**
| Metric | Definition | Denominator |
|---|---|---|
| Key-fact recall | facts from the reference present in the verified artifact / total reference facts | per image, human-judged, rubric in `eval/references.md` |
| Unsupported statements | statements in `notesMarkdown` not traceable to any region transcript | per image, human-read |
| Source-support rate | derived items with ≥1 valid `sourceRegionId` / total derived items | **computed programmatically** from the JSON |
| Uncertainty detection | illegible spans in the reference that appear in some region's `uncertainSpans` / total illegible spans in reference | per image |
| Negative-control behavior | pass/fail: does the blurred image yield `unusable` + zero regions? | n=1, binary |
| Latency | wall-clock ms per stage, from the route log | n = number of runs |

**Rules:** raw per-case JSON outputs are committed under `eval/raw/` so a judge can check the numbers. No keyword-counting is used for any semantic judgment; key-fact recall and unsupported-statement counts are human reads against the written reference. **n=3 is stated everywhere the numbers appear.** No user testing was performed → the writeup says exactly that, and does not invent feedback.

---

## 11. Critical path with hard time gates

`T` = plan approval + API key handed over. Budget assumes T ≈ 08:15 UTC, close 10:00 UTC.

| Gate | By | Must be true | If not true |
|---|---|---|---|
| **G1 — Spike** | T+12 min | A real image + `gemma-4-31b-it` returns JSON that Zod-parses into `BoardArtifact` | If image works but JSON schema mode is rejected → fall to strategy B/C (already designed, ~2 min). If the *model* rejects images or the key has no access → **switch model id to `gemma-4-26b-a4b-it` and retest once (3 min). If images still fail, this is the only fatal condition — escalate to Naymul immediately; do not burn the clock.** |
| **G2 — Vertical slice** | T+45 min | localhost: upload → extract → edit a region → studypack → notes+flashcards render | Cut the Flashcards tab, ship Notes+Code only |
| **G3 — Deployed** | T+58 min | Vercel prod URL works in a fresh incognito window | Fall back to Public Project Link = GitHub repo only (explicitly allowed by rules) and keep localhost for the video |
| **G4 — Repo + notebook + eval** | T+72 min | public repo, README, notebook, 3 eval cases with real outputs committed | Drop to 2 eval cases; never drop the negative control |
| **G5 — Media + video** | T+90 min | ≥10 graphics captured; 3–5 min video uploaded, link copied | Record a single unedited take; a rough real demo beats a polished missing one |
| **G6 — SUBMITTED** | **T+100 min (≙ 09:55 UTC / 15:55 BD)** | Kaggle writeup saved **and Submit clicked**, page re-read showing submitted state | Nothing. This gate cannot slip. If T+95 arrives with anything unfinished, publish the writeup with whatever links exist and submit. |

**Ordering rule for the whole sprint:** *submission completeness beats feature completeness.* At every branch, choose the option that keeps all five components alive.

**Hard rule:** do not start any P1 feature before G4 is green.

---

## 12. Risk register

| # | Risk | Likelihood | Impact | Cheapest first test | Fallback |
|---|---|---|---|---|---|
| R1 | **Clock.** <2 h for app + 5 artifacts | Certain | Fatal | n/a | §11 gates; P0 is deliberately small; G6 is immovable |
| R2 | `responseJsonSchema` unsupported on Gemma endpoint | Medium | Medium | Spike S1 attempt A | 3-tier strategy in §3, already coded into `lib/gemma.ts` |
| R3 | API key lacks Gemma access / free-tier quota exhausted mid-demo | Low-Med | High | Spike S1 first call | Swap to `gemma-4-26b-a4b-it`; if quota dies during recording, record from a run that already succeeded and say so honestly; never fake a response |
| R4 | Bangla handwriting extraction quality is poor | Medium | Medium (not fatal) | Spike S1 on the real mixed-BN/EN image | This is *why* the product has a human verification step — poor extraction becomes a demoed feature, not a hidden failure. Report it truthfully in Limitations |
| R5 | Vercel cold start + Gemma latency > function limit | Low | Medium | First deployed request | `maxDuration=60`, Node runtime, `thinkingLevel:'minimal'` on stage 2; last resort ship GitHub-only project link |
| R6 | Video overruns 5 min or upload is slow | Medium | High (component 4) | Record with a visible timer, target 3:30 | Unlisted YouTube upload starts before the writeup is finished, in parallel |
| R7 | Writeup left in draft | Low | **Fatal** | n/a | G6 explicitly re-reads the page after clicking Submit |
| R8 | Secret leaks into repo/screenshot/video | Low | Severe | `git log -p \| grep -i` scan + clear terminal before recording | Key only in `.env.local` (gitignored) and Vercel env; never displayed |
| R9 | Bangla renders as boxes on the judge's machine | Low | Medium | Check deployed page in incognito | Webfont is bundled via `next/font`, not system-dependent |
| R10 | Prize-eligibility (undergraduate clause) | — | None on judging | ask Naymul | Submit regardless; the DataCamp "Online - Best teams" award has no such clause |

---

## 13. Decisions that need Naymul

1. **Undergraduate eligibility for the $1,000 Online Track** (§2.5). Does not block the build — answer any time before submitting.
2. **GitHub repo owner/name.** Default: `ai-naymul/boardbridge-bd`, public. Say no now if you want a different account or name.
3. **Video face/voice.** Default: screen recording with voice-over, no webcam.
4. **Kaggle notebook hosting.** Default: GitHub-hosted `.ipynb` linked from the writeup (rules explicitly allow this when Kaggle hosting is impractical for the stack); upload to Kaggle only if G4 finishes early.

Everything else is decided in this document.

---

## 14. Definition of done

Not complete until every line is true **and verified by running the check**, not by assumption:

- [ ] A brand-new image uploaded through the deployed app triggers a real Gemma call (verified by watching the network tab + server log latency, not by trusting the UI).
- [ ] Three different images produce three materially different `BoardArtifact` JSONs (diffed, committed to `eval/raw/`).
- [ ] The exact model id `gemma-4-31b-it` is visible in: app header, README, notebook, writeup, video.
- [ ] Zod validation demonstrably rejects malformed model output (there is a unit-level check or a captured repair-retry log).
- [ ] The blurred negative-control image produces `imageQuality:"unusable"` + zero fabricated regions.
- [ ] Bangla renders correctly (no tofu boxes, no clipped conjuncts) on the deployed URL in incognito.
- [ ] Editing a region and regenerating changes the study pack output (captured as a before/after screenshot pair).
- [ ] Every derived item in the rendered study pack cites region ids that exist in the artifact; unsupported items are visibly flagged.
- [ ] `git log -p | grep -iE 'AIza|GEMINI_API_KEY=.'` returns nothing; `.env.local` is gitignored; no key in any screenshot or video frame.
- [ ] Deployed app loads and completes one full run in a private/incognito window.
- [ ] The notebook runs from clean setup instructions and reproduces one model call.
- [ ] Repo is public and its README explains setup, architecture, model id, and limitations.
- [ ] Video is < 5:00 and publicly reachable.
- [ ] The Kaggle writeup is < 2000 words, has ≥ 10 graphics, and contains app + repo + notebook + video links.
- [ ] Every link in the writeup has been opened once, from the writeup, after publishing.
- [ ] The Kaggle page shows the writeup as **submitted**, not draft.
- [ ] No metric, test result, deployment claim, or user feedback in any artifact is fabricated; n=3 is stated wherever the eval numbers appear; "no formal user testing was conducted" appears in Limitations.
