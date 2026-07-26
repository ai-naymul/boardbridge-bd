# BoardBridge BD — Compliance & Submission Checklist

**Competition:** Build With Gemma @Bangladesh — `https://www.kaggle.com/competitions/build-with-gemma-bangladesh`
**Deadline:** 2026-07-26 **10:00:00 UTC** = **16:00 Asia/Dhaka** (verified via Kaggle CLI)
**Division:** Online. **Track:** Multimodal — Whiteboard to Interactive Study Guide.
**Entry status:** joined (`userHasEntered: True`, as `ainaymul`).

A row is ticked only after the evidence exists and was actually run or opened.

---

## 1. Disqualification conditions

| # | Condition | Guard | Evidence | ✓ |
|---|---|---|---|---|
| DQ1 | Gemma not a core component | Both inference stages call `gemma-4-31b-it` | model badge in deployed header (`media/01-hero.png`); `lib/gemma.ts`; `/api/config` returns `{"model":"gemma-4-31b-it"}`; notebook; README | ✅ |
| DQ2 | Unmodified chatbot wrapper | No chat UI exists. Two-stage extract → verify → generate pipeline | `media/03,04,07`; `media/13-architecture.png` | ✅ |
| DQ3 | Missing required component | §2 below | 4 of 5 live; video pending | ⬜ |
| DQ4 | Writeup left as draft | Must click Submit and re-read the page | **pending — Naymul** | ⬜ |
| DQ5 | Not a real, testable prototype | Public URL, full run verified in production | `scripts/e2e.py` against `https://boardbridge-bd.vercel.app` — all 3 cases passed | ✅ |

---

## 2. The five required components

| # | Component | Artifact | ✓ |
|---|---|---|---|
| **1** | Kaggle Writeup | `docs/kaggle_writeup.md` — 1,386 words (< 2,000). Contains problem, solution, how-Gemma-is-used, architecture, impact+validation, limitations, future work, AI disclosure | ✅ drafted / ⬜ submitted |
| **2** | Media Gallery | `media/` — **14 graphics** (≥10 required): hero, extracting, extraction+verify, notes, code, flashcards, evidence, negative-control refusal, mobile, 3 input boards, architecture, results | ✅ |
| **3** | Public Notebook | `notebook/boardbridge_gemma.ipynb` — valid JSON, GitHub-hosted (explicitly permitted: "or linked GitHub/Colab notebook if Kaggle hosting isn't practical for your stack") | ✅ |
| **4** | Video | 3–5 min, YouTube unlisted. Script with timed beats in `SUBMIT_NOW.md` | ⬜ **Naymul** |
| **5** | Public Project Link | https://boardbridge-bd.vercel.app **and** https://github.com/ai-naymul/boardbridge-bd (PUBLIC, verified via `gh repo view`) | ✅ |

---

## 3. "Your Goal" criteria

| # | Criterion | Proof | ✓ |
|---|---|---|---|
| G-1 | Gemma as a core component | Two `gemma-4-31b-it` calls per board; model id surfaced in 5 places | ✅ |
| G-2 | Beyond a chatbot | Two-stage pipeline with a machine-validated, human-editable contract; zero conversational surface | ✅ |
| G-3 | Usable and testable | Public URL; judges can upload their own board | ✅ |
| G-4 | Grounded in Bangladesh | BN/EN code-switching preserved (never translated); Bangla numerals `১) ২)` intact; Bangla confidence labels উচ্চ/মাঝারি/কম; browser downscale 0.1 MB→97 KB for mobile data; Noto Sans Bengali bundled; mobile-first | ✅ |
| G-5 | One clearly defined problem from a listed category | Multimodal Track / Whiteboard to Interactive Study Guide, named in the writeup title block | ✅ |

---

## 4. Rubric coverage

Page labels the point table "An example template is below" — treated as provisional but honored.

| Criterion | What earns it | ✓ |
|---|---|---|
| Usefulness (0–15) | Verified production run on all 3 cases; honest error + retry states; safe failure on unreadable input | ✅ |
| Informativeness (0–15) | README, notebook, `eval/results.md`, raw API responses committed for re-checking | ✅ |
| Engagement (0–10) | Board→study-pack transformation; edit-a-word-and-regenerate beat | ✅ |
| Documentation Quality (0–15) | Typed Zod schemas, validation layer, server-only secrets, architecture diagram, stated limits | ✅ |
| Novelty (0–5) | Traceability + visible uncertainty + human verification *between* two model stages | ✅ |
| **Required Elements — < 2000 words, ≥ 10 graphics** | 1,386 words; 14 graphics | ✅ |
| Video (0–40, 3–5 min) | Script in `SUBMIT_NOW.md` | ⬜ |

---

## 5. No-fabrication audit

| # | Rule | Verification | ✓ |
|---|---|---|---|
| F1 | Every new image triggers real Gemma inference | Production `scripts/e2e.py` run: measured 28.1 s / 34.2 s / 4.6 s latencies | ✅ |
| F2 | Different images → materially different outputs | Titles `['Hash Table — হ্যাশ টেবিল', 'BFS - Flowchart and Pseudocode', 'Unusable Image']`; region counts `[10, 12, 0]`; raw JSON in `eval/raw/` | ✅ |
| F3 | No canned "successful demo response" in code | No fixtures or mocks exist; `lib/gemma.ts` is the only inference path | ✅ |
| F4 | Sample images still invoke the real pipeline | `loadSample()` fetches the file and calls the identical `prepare()` → `/api/extract` path — no bypass branch | ✅ |
| F5 | No cached output presented as live | No response caching on either model route | ✅ |
| F6 | API failure → honest error + retry | `GemmaError` codes map to 429/504/502; UI shows the message with a Retry button | ✅ |
| F7 | Blank/unreadable image ⇒ no fabricated notes | `blurred_negative.jpg` → `imageQuality:"unusable"`, **0 regions**, warning "completely out of focus and overexposed" (`media/08`) | ✅ |
| F8 | Model output schema-validated | Zod on both stages + one bounded repair retry | ✅ |
| F9 | Derived items cannot cite nonexistent regions | `crossCheckSourceRegions` intersects with real ids; 22/22 valid across both readable boards | ✅ |
| F10 | Model id shown in app, README, notebook, submission | 4 places verified individually | ✅ |
| F11 | No silent fallback to a non-Gemma model | Only `gemma-4-31b-it` referenced in any inference path | ✅ |
| F12 | No secret in client code, git history, screenshots, video, notebook, logs | 6-way audit run: `.next/static/` ✓ clean · committed files ✓ clean · `git log -p` ✓ 0 hits · no `NEXT_PUBLIC` ✓ · `media/ notebook/ eval/ docs/` ✓ clean · **deployed client JS fetched from production ✓ 0 hits** | ✅ |
| F13 | Evaluation results real and reproducible | Raw responses in `eval/raw/`; re-runnable via `python3 scripts/e2e.py <url>` | ✅ |
| F14 | Limitations disclosed honestly | n=3, synthetic boards, no user testing, ~30 s latency, the unflagged `হ্যাঁ`→`হাঁ` error, no bounding boxes, no dialect claim, in-memory rate limiting — all in README, `eval/results.md`, notebook and writeup | ✅ |

---

## 6. Security & privacy gate

| Item | Check | ✓ |
|---|---|---|
| Key server-side only | no `NEXT_PUBLIC_` anywhere; key absent from production client JS | ✅ |
| `.env.local` untracked | `git check-ignore -v .env.local` → matched `.gitignore:5:.env*` | ✅ |
| `.env.example` empty value | `GEMINI_API_KEY=` with no value | ✅ |
| Upload validation | MIME allowlist + ≤8 MB + non-empty, enforced server-side in `lib/validate.ts` | ✅ |
| Markdown sanitization | `react-markdown` without `rehype-raw`; code rendered in `<pre>` | ✅ |
| Diagram safety | Mermaid not shipped (P1 dropped) — no such surface exists | ✅ |
| Timeouts | 150 s AbortController; `maxDuration = 300` on both routes | ✅ |
| Rate limiting | per-IP bucket active; README states it is best-effort on serverless | ✅ |
| No image persistence | in-memory only; stated in UI footer and README | ✅ |
| Logs | `{route, status, latencyMs, model, …}` only — no prompts, no image bytes, no key | ✅ |

---

## 7. Final pre-submission checklist

**App**
- ✅ Production URL loads in a fresh (logged-out) browser context
- ✅ Full run completes there: sample → extract → generate → notes/code/cards/evidence
- ✅ Model badge reads `gemma-4-31b-it`
- ✅ Bangla renders correctly, no tofu, no clipped conjuncts; verified at 390 px (`media/09`)

**Repository**
- ✅ Public
- ✅ README: setup, `.env.local` instructions, architecture, model id, eval summary (n=3), limitations, license
- ✅ Secret scan clean
- ✅ `eval/raw/` committed

**Notebook**
- ✅ In the repo, valid `.ipynb`
- ✅ Reproduces one Gemma call from clean instructions; includes the negative-control assertion
- ✅ No key in any cell or output

**Video** — ⬜ Naymul: record (script in `SUBMIT_NOW.md`), keep under 5:00, upload unlisted

**Gallery**
- ✅ 14 graphics
- ✅ No secret, terminal or personal data in any frame

**Writeup**
- ✅ 1,386 words (< 2,000)
- ✅ All six required sections present
- ✅ App + repo + notebook links present · ⬜ video link to paste
- ✅ n=3 stated; "No formal user testing was conducted" present

**Link test** — ⬜ open all four from the published writeup, logged out

**Privacy / licensing**
- ✅ Eval boards author-created (`eval/make_boards.py`), provenance stated
- ✅ MIT for code
- ✅ No third-party or personal data

**SUBMISSION STATUS**
- ⬜ **Submit clicked**
- ⬜ **Page reloaded and confirmed submitted, not draft** ← the single most important line here

---

## 8. Open items

| # | Item | Status | Blocks? |
|---|---|---|---|
| O1 | Undergraduate-eligibility clause on the $1,000 Online Track | Unresolved — Naymul | **No** — prize eligibility only |
| O2 | `responseJsonSchema` support on Gemma | **RESOLVED: works.** Tier A (`responseMimeType` + `responseJsonSchema`) succeeded on `gemma-4-31b-it` with image input | No |
| O3 | Gemma-tier rate limits | Not published; no limit hit across ~15 production calls | No |
| O4 | Host rubric beyond the template | Not published; template honored as binding | No |
