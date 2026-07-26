# BoardBridge BD — Execution Tasks

> **Deadline: 2026-07-26 10:00:00 UTC (16:00 Asia/Dhaka).** Verified via Kaggle CLI 2026-07-26 08:01 UTC.
> Run `date -u` before every phase. Mark a task `[x]` **only** after its acceptance test passes.
> Read `docs/EXECUTION_PLAN.md` §7 (schemas), §8 (prompts), §9 (security) before writing code.
> Gates: **G1** T+12 spike · **G2** T+45 slice · **G3** T+58 deploy · **G4** T+72 repo/notebook/eval · **G5** T+90 media/video · **G6** T+100 **SUBMITTED**.

**Global constraints (apply to every task):**
- Model: `gemma-4-31b-it` (fallback `gemma-4-26b-a4b-it`). Never a non-Gemma model for production inference.
- `GEMINI_API_KEY` server-only, from `.env.local`. Never `NEXT_PUBLIC_*`, never logged, never in a screenshot/video/commit.
- No hardcoded/canned model responses anywhere. No keyword-matching for semantic judgments.
- Every model output goes through Zod. One repair retry maximum, then honest error.
- Commit messages lowercase, no AI co-author attribution line.
- `git push` and any Kaggle/YouTube publish are consequential — those tasks are marked **[CONSEQUENTIAL]**.

---

## Phase 0 — Bootstrap (T+0 → T+6)

| ID | P | Task | Deps | Inputs | Outputs / files | Acceptance test | Fallback | Type |
|---|---|---|---|---|---|---|---|---|
| B1 | P0 | Write the key to `.env.local` **before** `git init`, and gitignore it | — | Naymul's key | `.env.local` (untracked) | `grep -c GEMINI_API_KEY .env.local` = 1; key never echoed to terminal | — | local |
| B2 | P0 | `git init -b main`; create `.gitignore` with `node_modules/ .next/ .env* !.env.example eval/raw/tmp` | B1 | — | `.gitignore` | `git status --porcelain \| grep -c '.env.local'` = 0 | — | local |
| B3 | P0 | Scaffold: `pnpm create next-app@latest . --ts --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-pnpm --yes` | B2 | — | Next.js project | `pnpm dev` serves 200 on `/` | if interactive prompts block, pass flags one at a time | local |
| B4 | P0 | `pnpm add @google/genai zod react-markdown` | B3 | — | `package.json` | `pnpm ls @google/genai zod react-markdown` shows all three | — | local |

**Status:** `[ ] B1  [ ] B2  [ ] B3  [ ] B4`

---

## Phase 1 — GATE G1: Feasibility spike (T+6 → T+12) — NOTHING ELSE UNTIL THIS PASSES

| ID | P | Task | Deps | Inputs | Outputs / files | Acceptance test | Fallback | Type |
|---|---|---|---|---|---|---|---|---|
| S0 | P0 | Photograph/produce **one real** mixed Bangla-English whiteboard image (author-created) | — | phone/whiteboard | `eval/images/mixed_notes.jpg` | file exists, opens, contains both Bangla and English text | draw on paper; must be author-created, never scraped | local |
| S1 | P0 | Spike script: send that image to `gemma-4-31b-it` with the §8 extraction prompt, attempt A (`responseMimeType:'application/json'` + `responseJsonSchema`), print raw response + which attempt tier succeeded | B4, S0 | `.env.local`, image | `scripts/spike.ts` | Prints valid JSON parsed into `BoardArtifact` shape; **transcription visibly matches the real board** | attempt B (mimeType only) → attempt C (strict prompt). If model rejects images: retry once with `gemma-4-26b-a4b-it`. If images still rejected → **STOP, escalate to Naymul** | local |
| S2 | P0 | Record which tier worked, observed latency, and the raw output | S1 | spike stdout | `eval/raw/spike_run.json`, note in `docs/EXECUTION_PLAN.md` §3 | file committed; latency number is measured, not estimated | — | local |

**G1 decision:** if S1 passes → proceed. If images are rejected by both Gemma models → the Multimodal track is infeasible with this key; escalate immediately rather than burning clock.

**Status:** `[ ] S0  [ ] S1  [ ] S2` → **G1 ☐ PASS**

---

## Phase 2 — Core app (T+12 → T+45, GATE G2)

| ID | P | Task | Deps | Inputs | Outputs / files | Acceptance test | Fallback | Type |
|---|---|---|---|---|---|---|---|---|
| C1 | P0 | Implement Zod schemas exactly as in EXECUTION_PLAN §7 | B4 | plan §7 | `lib/schemas.ts` | `BoardArtifactSchema.safeParse(eval/raw/spike_run.json)` → `success:true` | if spike JSON fails, adjust the *prompt*, not the schema | local |
| C2 | P0 | Implement `callGemma({parts, schema, systemInstruction})`: 3-tier structured-output strategy, fence-strip → `JSON.parse` → `safeParse`, exactly one repair retry, 45 s AbortController, `{route,status,latencyMs,model}` logging only | C1, S2 | plan §3, §8, §9 | `lib/gemma.ts` | Feed it a deliberately malformed stub response → returns a typed error, never throws raw; repair path logs exactly one retry | — | local |
| C3 | P0 | Extraction + studypack system prompts as exported consts | C1 | plan §8 | `lib/prompts.ts` | both exported, each contains the "never invent content when unreadable" clause and the "do not translate/correct" clause | — | local |
| C4 | P0 | `POST /api/extract`: MIME allowlist + ≤8 MB + non-empty guard → `callGemma` vision → `BoardArtifact` | C2, C3 | base64 image | `app/api/extract/route.ts` | `curl` with the real image returns schema-valid JSON in <45 s; `curl` with a text file returns 400 with an honest message | — | local |
| C5 | P0 | `crossCheckSourceRegions(pack, artifact)` — strip unknown ids, append warning, flag zero-id items `unsupported:true` | C1 | plan §7 | `lib/validate.ts` | unit check: pack citing `r99` against artifact with `r1,r2` → id stripped, warning present, item flagged | — | local |
| C6 | P0 | `POST /api/studypack`: verified artifact JSON in (**image not resent**) → `callGemma` text → `StudyPack` → `crossCheckSourceRegions` | C2, C3, C5 | artifact JSON | `app/api/studypack/route.ts` | posting the spike artifact returns notes + ≥1 flashcard, all cited ids exist | drop flashcards, keep notes+code | local |
| C7 | P0 | `GET /api/config` → `{ model }` from env, no secrets | B4 | — | `app/api/config/route.ts` | response body contains the model id and no other keys | — | local |
| C8 | P0 | `ImageDropzone`: file input + `capture="environment"`, MIME/size validate, canvas downscale to ≤1600 px longest edge JPEG q0.85, preview | B3 | — | `components/ImageDropzone.tsx` | a 4 MB phone photo yields a <600 KB base64 payload (log the byte counts) | skip downscale, cap at 8 MB | local |
| C9 | P0 | `RegionEditor`: per region — order, type badge, editable transcription textarea, confidence chip (`উচ্চ/মাঝারি/কম`), highlighted `uncertainSpans`, "unreadable" toggle, delete. Sets `edited:true` on change | C1 | — | `components/RegionEditor.tsx` | editing text then re-reading component state shows the new text and `edited:true` | — | local |
| C10 | P0 | `StudyPackView`: tabs Notes / Code / Flashcards / Evidence; `react-markdown` **without** `rehype-raw`; `<pre>` for code; Evidence tab lists each derived item with its source region ids and an "unsupported" badge where flagged; Copy + Download `.md` / `.json` | C6 | — | `components/StudyPackView.tsx` | feed a pack containing `<script>alert(1)</script>` in `notesMarkdown` → renders as literal text, no execution (check console) | — | local |
| C11 | P0 | `app/page.tsx`: 3-stage orchestration, model-id badge from `/api/config`, loading + honest error states, "Regenerate study pack" button, footer privacy line ("images are processed in memory and not stored") | C4, C6–C10 | — | `app/page.tsx` | full localhost run: upload → extract → edit a word → regenerate → notes reflect the edit | — | local |
| C12 | P0 | Bangla typography: `next/font` Noto Sans Bengali, `line-height:1.9`, `overflow-wrap:anywhere`, mobile-first single column <768 px | B3 | — | `app/layout.tsx`, `app/globals.css` | Bangla renders with no tofu and no clipped conjuncts at 390 px width (DevTools device mode) | system font stack | local |
| C13 | P0 | Per-IP in-memory token bucket (5 req/min) on both model routes + README note that it is best-effort on serverless | C4, C6 | — | `lib/ratelimit.ts` | 6th request within a minute returns 429 with an honest message | drop; disclose in Limitations | local |

**G2 test:** on localhost, one uninterrupted run — upload real image → regions with visible confidence → edit one Bangla word → regenerate → notes + flashcards change → export `.md` downloads.

**Status:** `[ ] C1 … [ ] C13` → **G2 ☐ PASS**

---

## Phase 3 — Deploy (T+45 → T+58, GATE G3)

| ID | P | Task | Deps | Inputs | Outputs / files | Acceptance test | Fallback | Type |
|---|---|---|---|---|---|---|---|---|
| D1 | P0 | `export const runtime='nodejs'; export const maxDuration=60` on both model routes | C4, C6 | — | route files | `pnpm build` succeeds | — | local |
| D2 | P0 | `gh repo create ai-naymul/boardbridge-bd --public --source=. --remote=origin` then first commit | B2, G2 | — | GitHub repo | `gh repo view --json visibility` → `PUBLIC` | make repo, push later | **[CONSEQUENTIAL]** |
| D3 | P0 | Pre-push secret scan: `git log -p \| grep -inE "AIza[0-9A-Za-z_-]{10,}\|GEMINI_API_KEY=."` | D2 | — | scan output | **empty output** | if a hit: do not push, remove and recreate history | local |
| D4 | P0 | `vercel link --yes`; `vercel env add GEMINI_API_KEY production` (paste, not echo); `vercel env add GEMMA_MODEL production` | D3 | key | Vercel project | `vercel env ls` shows both names (values hidden) | — | **[CONSEQUENTIAL]** |
| D5 | P0 | `vercel --prod` | D4 | — | production URL | URL loads; **one full run completes in a fresh incognito window**; model badge shows `gemma-4-31b-it` | Public Project Link = GitHub repo only (rules allow it); demo from localhost | **[CONSEQUENTIAL]** |

**Status:** `[ ] D1 … [ ] D5` → **G3 ☐ PASS**

---

## Phase 4 — Evidence artifacts (T+58 → T+72, GATE G4)

| ID | P | Task | Deps | Inputs | Outputs / files | Acceptance test | Fallback | Type |
|---|---|---|---|---|---|---|---|---|
| E1 | P0 | Create 2 more author-made images: `flow_pseudocode.jpg`, `blurred_negative.jpg` | — | phone | `eval/images/` | both exist; the negative one is genuinely unreadable | — | local |
| E2 | P0 | Hand-write ground truth **before** looking at model output: ≤10 key facts, expected code tokens, known-illegible spans, provenance statement (author-created) | E1 | images | `eval/references.md` | one section per image, written by a human | — | local |
| E3 | P0 | Run all 3 images through the deployed app; save raw JSON per stage | D5, E2 | images | `eval/raw/*.json` | 3 files, **materially different** contents (diff them) | run against localhost | local |
| E4 | P0 | Score by human reading against `references.md` (no keyword counting); compute source-support rate programmatically; record latency | E3 | raw JSON | `eval/results.md` | table with per-case numbers, every metric's denominator stated, **"n=3"** stated | — | local |
| E5 | P0 | Confirm negative control: blurred image → `imageQuality:"unusable"`, zero fabricated regions | E3 | raw JSON | note in `eval/results.md` | pass/fail recorded truthfully; **if it fabricates, report that as a finding — do not hide it** | — | local |
| E6 | P0 | README: what it is, the problem, architecture diagram, **exact model id**, setup (`.env.local` with `GEMINI_API_KEY=`), run, deployed link, eval summary with n=3, limitations, privacy, license (MIT code) | D5, E4 | — | `README.md`, `.env.example` (empty value) | a fresh reader can run it; `.env.example` contains no key | — | local |
| E7 | P0 | Notebook reproducing one Gemma call: install `google-genai`, load key from env (**instructions only, no key**), the verbatim §8 extraction prompt, the image, the call, Zod-equivalent validation, one real sample output, provenance + limitations | S2, E3 | — | `notebook/boardbridge_gemma.ipynb` | runs top-to-bottom from clean instructions; **no key in any output cell**; model id printed | — | local |
| E8 | P0 | Architecture diagram image | — | plan §6 | `docs/architecture.png` | readable at gallery size | — | local |
| E9 | P0 | Commit + push everything | D3, E1–E8 | — | pushed repo | secret scan re-run clean; `gh repo view` public | — | **[CONSEQUENTIAL]** |

**Status:** `[ ] E1 … [ ] E9` → **G4 ☐ PASS**

---

## Phase 5 — Media + video (T+72 → T+90, GATE G5)

| ID | P | Task | Deps | Inputs | Outputs / files | Acceptance test | Fallback | Type |
|---|---|---|---|---|---|---|---|---|
| M1 | P0 | Capture **≥10 graphics**: (1) hero/empty state, (2) original board photo, (3) extraction result with confidence chips, (4) uncertain-span highlight, (5) region editing in progress, (6) before/after regenerate pair, (7) Notes tab, (8) Code tab, (9) Flashcards tab, (10) Evidence/traceability tab, (11) mobile view, (12) architecture diagram, (13) eval results table, (14) negative-control screenshot | D5 | deployed app | `media/*.png` | count ≥ 10; **no terminal, env file, or key visible in any frame** | localhost screenshots | local |
| M2 | P0 | Record 3–5 min demo (OBS or `ffmpeg -f x11grab`): problem → user → real board → upload → **say the model id out loud** → extraction + uncertainty → correct one word → regenerate → notes/code/flashcards → traceability → architecture → eval incl. the failure case → closing line | M1 | app + slides | `media/demo.mp4` | duration between 3:00 and 5:00; a clean desktop with no secrets visible | one unedited take | local |
| M3 | P0 | Upload to YouTube **unlisted**, copy link | M2 | mp4 | YouTube URL | link opens in incognito | any equivalent platform | **[CONSEQUENTIAL]** |

**Status:** `[ ] M1  [ ] M2  [ ] M3` → **G5 ☐ PASS**

---

## Phase 6 — GATE G6: SUBMIT (T+90 → T+100) — CANNOT SLIP

| ID | P | Task | Deps | Inputs | Outputs / files | Acceptance test | Fallback | Type |
|---|---|---|---|---|---|---|---|---|
| K1 | P0 | Draft writeup body **< 2000 words**: problem (BD-specific), solution, end-to-end workflow, **how Gemma is used** (variant `gemma-4-31b-it`, no fine-tuning, two-stage prompting + schema validation, why Gemma fit), architecture, impact & validation (**n=3**, real numbers, the failure case), limitations, future work, AI-assistance disclosure | E4, E6 | plan + eval | `docs/kaggle_writeup.md` | `wc -w` < 2000; every number traceable to `eval/results.md` | — | local |
| K2 | P0 | New Writeup at `/competitions/build-with-gemma-bangladesh/projects` → paste body → attach **≥10 graphics** → include App / Repo / Notebook / Video links → **Save** | K1, M3, E9, D5 | — | Kaggle writeup | saved; graphics count ≥10; all 4 links present | — | **[CONSEQUENTIAL]** |
| K3 | P0 | **Click Submit (top-right).** Then reload the page and confirm it reads submitted, not draft | K2 | — | submitted writeup | page shows submitted state — **verify by re-reading, not by assuming** | — | **[CONSEQUENTIAL]** |
| K4 | P0 | Open every link from the published writeup, in incognito: app, repo, notebook, video | K3 | — | verification note | all 4 load for a logged-out visitor | fix and re-save immediately | local |
| K5 | P0 | Tick `docs/COMPLIANCE_AND_SUBMISSION_CHECKLIST.md` with real evidence | K4 | — | checklist | no unchecked P0 row | — | local |

**Status:** `[ ] K1  [ ] K2  [ ] K3  [ ] K4  [ ] K5` → **G6 ☐ SUBMITTED**

---

## Phase 7 — P1, only after G4 is green and only if ≥15 min of slack exists

| ID | P | Task | Acceptance test |
|---|---|---|---|
| X1 | P1 | Quiz tab (MCQ from flashcards, answer reveal, cites region ids) | answering one question shows the source region |
| X2 | P1 | Mermaid flowchart from `flowchart_node`/`flowchart_edge` regions, `securityLevel:'strict'`, `htmlLabels:false`, rendered only from a validated node/edge list | a node label containing `<img onerror=...>` does not execute |
| X3 | P1 | Anki CSV export | file imports into Anki |
| X4 | P1 | 4th eval image (`equations.jpg`) | added to `eval/results.md` with n updated to 4 |

**Do not start any P1 task if it puts G5 or G6 at risk.**

---

## Kill-switch rule

At **T+95 min (09:55 UTC / 15:55 BD)**, stop all engineering regardless of state and execute K2→K3 with whatever links exist. A submitted imperfect entry scores; an unsubmitted perfect one is not judged.
