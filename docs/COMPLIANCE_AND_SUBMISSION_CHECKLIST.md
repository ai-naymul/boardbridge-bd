# BoardBridge BD — Compliance & Submission Checklist

**Competition:** Build With Gemma @Bangladesh — `https://www.kaggle.com/competitions/build-with-gemma-bangladesh`
**Deadline:** 2026-07-26 **10:00:00 UTC** = **16:00 Asia/Dhaka** (verified via Kaggle CLI, 2026-07-26 08:01 UTC)
**Division:** Online track. **Track:** Multimodal — Whiteboard to Interactive Study Guide.
**Entry status:** already joined (`userHasEntered: True`, Kaggle CLI, as `ainaymul`).

Rule: a row is checked **only** after the evidence exists and has been opened/run. Never check a row on intention.

---

## 1. Disqualification conditions

| # | Condition (from the competition page) | Our guard | Evidence artifact | ✓ |
|---|---|---|---|---|
| DQ1 | Gemma is not a core component | Both inference stages call `gemma-4-31b-it`; no other model is used for production inference | model badge in app header; `lib/gemma.ts`; notebook output; README; video voice-over | ☐ |
| DQ2 | "Goes beyond a chatbot" not satisfied | No chat UI exists. Product is upload → structured extraction → human verification → schema-validated generation | screenshots 3–10; architecture diagram; writeup §Solution | ☐ |
| DQ3 | Any of the five required components missing | §2 below gates all five | this checklist | ☐ |
| DQ4 | Writeup left saved-as-draft | Task K3 clicks Submit and **re-reads the page** to confirm | reloaded Kaggle page showing submitted state | ☐ |
| DQ5 | Not a real, testable prototype | Deployed public URL, working in incognito | production URL + incognito run | ☐ |

---

## 2. The five required components

| # | Required component | Required contents (per page) | Our artifact | ✓ |
|---|---|---|---|---|
| **1** | **Kaggle Writeup** | problem statement w/ evidence · solution overview · **how Gemma is used** (variant, fine-tuning approach, prompting/architecture decisions, why Gemma fit) · technical architecture (diagram or clear description) · impact & validation (user testing, sample outputs, accuracy metrics, or feedback) · limitations & future work | `docs/kaggle_writeup.md` → pasted into Kaggle Writeup | ☐ |
| **2** | **Media Gallery** | screenshots of key screens/flows · diagrams · sample inputs and outputs (before/after, predictions vs ground truth) · optional field photos | `media/*.png`, **≥10 items** | ☐ |
| **3** | **Public Notebook** | reproducible Gemma integration code · comments so judges can re-run · datasets linked, documented, licensed. *Page explicitly allows "linked GitHub/Colab notebook if Kaggle hosting isn't practical for your stack"* — our stack is TypeScript, so GitHub-hosted `.ipynb` is the compliant path | `notebook/boardbridge_gemma.ipynb` in the public repo | ☐ |
| **4** | **Video** | 3–5 min · app working end-to-end on a real/realistic case · plain-language problem + who it helps · **Gemma's role, not just the UI** · YouTube unlisted/public, linked | YouTube unlisted link | ☐ |
| **5** | **Public Project Link** | deployed app **or** public GitHub repo with setup/run instructions · must stay active through judging | Vercel production URL **and** `github.com/ai-naymul/boardbridge-bd` (both) | ☐ |

---

## 3. "Your Goal" criteria (all five stated on the page)

| # | Criterion | How we prove it | Demo moment | ✓ |
|---|---|---|---|---|
| G-1 | Uses Gemma as a core component | Two Gemma 4 calls; model id surfaced in UI/README/notebook/writeup/video | video 0:45 | ☐ |
| G-2 | Goes beyond a chatbot — value from automation / data processing / multimodal understanding / workflow integration | Two-stage pipeline with a machine-validated, human-editable contract in between; zero conversational surface | video 1:10–2:40 | ☐ |
| G-3 | Usable and testable prototype | Public deployed URL, judges can run their own board photo | video 0:30 | ☐ |
| G-4 | Grounded in Bangladesh context | Mixed Bangla-English code-switched boards; Bangla typography and confidence labels; client-side downscale for low bandwidth; mobile-first; English technical vocabulary preserved rather than translated | video 0:15 + screenshots 3, 11 | ☐ |
| G-5 | Targets one clearly defined problem from a listed category | Multimodal Track / Whiteboard to Interactive Study Guide, named explicitly in the writeup | writeup §1 | ☐ |

---

## 4. Rubric coverage

**Status of the rubric: the competition page labels the point table "An example template is below."** It is therefore treated as provisional, but every element below is cheap to satisfy and expensive to fail, so all are honored as binding.

| Criterion (template) | Pts | What earns it here | ✓ |
|---|---|---|---|
| Usefulness — meaningful purpose, functions without errors | 0–15 | Real end-to-end run on the deployed URL; honest error states rather than crashes; the negative-control case shows it fails safely | ☐ |
| Informativeness — detailed, accurate documentation | 0–15 | README + notebook + `eval/results.md` with raw per-case JSON committed so every number is checkable | ☐ |
| Engagement — interesting/engaging use case | 0–10 | Before/after board→study-pack transformation; the "correct one word and watch the pack change" beat | ☐ |
| Documentation Quality — well documented, best practices | 0–15 | Typed schemas, validation layer, server-only secrets, architecture diagram, stated limitations | ☐ |
| Novelty — surprising or new use case | 0–5 | Traceability + visible uncertainty + human verification between two model stages, instead of one-shot summarization | ☐ |
| **Required Elements — writeup < 2000 words and ≥ 10 graphics** | Yes/No | `wc -w` check on the writeup; media gallery count | ☐ |
| Video — accuracy, informativeness, instructional value, production, **3–5 min** | 0–40 | Scripted beats in TASKS.md M2; duration checked before upload | ☐ |

---

## 5. No-fabrication audit (project-specific hard rules)

| # | Rule | Verification command / action | ✓ |
|---|---|---|---|
| F1 | Every new image triggers real Gemma inference | Watch DevTools Network + server latency log during the incognito run | ☐ |
| F2 | Different images → materially different outputs | `diff eval/raw/*.json`, 3 distinct artifacts committed | ☐ |
| F3 | No canned "successful demo response" in production code | `grep -rniE "mock|fixture|sampleResponse|hardcoded" app/ lib/ components/` reviewed by hand | ☐ |
| F4 | Sample images still invoke the real pipeline | Sample-image click path goes through `/api/extract` (no bypass branch) | ☐ |
| F5 | No cached output presented as live | No response caching on either model route | ☐ |
| F6 | API failure yields honest error + retry | Temporarily use an invalid key locally → UI shows an error, not fake notes | ☐ |
| F7 | Blank/unreadable image ⇒ no confident fabricated notes | Negative control case, result recorded truthfully in `eval/results.md` even if it fails | ☐ |
| F8 | Model output schema-validated | Zod on both stages; repair-retry path exercised and logged | ☐ |
| F9 | Derived items cannot cite nonexistent regions | `crossCheckSourceRegions` unit check with a bogus `r99` | ☐ |
| F10 | Active Gemma model id shown in app, README, notebook, submission | 4 places checked individually | ☐ |
| F11 | No silent fallback to a non-Gemma model | `grep -rn "gpt\|claude\|gemini-" app/ lib/` returns nothing in inference paths | ☐ |
| F12 | No secret in client code, git history, screenshots, video, notebook, logs | `git log -p \| grep -inE "AIza[0-9A-Za-z_-]{10,}\|GEMINI_API_KEY=."` → **empty**; visual scan of every graphic and the video | ☐ |
| F13 | Evaluation results real and reproducible | Raw JSON committed under `eval/raw/`; method described in `eval/references.md` | ☐ |
| F14 | Demo limitations disclosed honestly | Limitations section names n=3, no formal user testing, no bounding boxes, no dialect support, in-memory rate limiting | ☐ |

---

## 6. Security & privacy gate

| Item | Check | ✓ |
|---|---|---|
| Key server-side only | no `NEXT_PUBLIC_` prefix anywhere; `grep -rn "NEXT_PUBLIC" .` reviewed | ☐ |
| `.env.local` untracked | `git check-ignore -v .env.local` succeeds | ☐ |
| `.env.example` contains an **empty** value | file inspected | ☐ |
| Upload validation | MIME allowlist + ≤8 MB + non-empty enforced server-side, not just client-side | ☐ |
| Markdown sanitization | `react-markdown` without `rehype-raw`; `<script>` payload test renders as text | ☐ |
| Diagram safety | Mermaid only if P1 lands, with `securityLevel:'strict'`, `htmlLabels:false` | ☐ |
| Timeouts | 45 s AbortController per model call; `maxDuration=60` on routes | ☐ |
| Rate limiting | per-IP bucket active; README states it is best-effort on serverless | ☐ |
| No image persistence | in-memory only; stated in UI footer and README | ☐ |
| Logs | `{route,status,latencyMs,model}` only; no prompts, no image bytes, no key | ☐ |

---

## 7. Final pre-submission checklist (execute in this order, T+90 → T+100)

**App**
- ☐ Production URL loads in a **fresh incognito window**
- ☐ One complete run finishes there: upload → extract → edit → regenerate → export
- ☐ Model badge reads `gemma-4-31b-it`
- ☐ Bangla renders correctly (no tofu, no clipped conjuncts) at 390 px width

**Repository**
- ☐ Public (`gh repo view --json visibility`)
- ☐ README: setup, `.env.local` instructions, architecture, model id, eval summary (n=3), limitations, license
- ☐ Secret scan clean
- ☐ `eval/raw/` committed

**Notebook**
- ☐ Present in the repo and reachable by URL
- ☐ Runs from clean instructions, reproduces one Gemma call
- ☐ No key in any cell or output

**Video**
- ☐ Duration between 3:00 and 5:00
- ☐ Shows Gemma's role, not just the UI
- ☐ Shows one honest limitation / failure case
- ☐ Unlisted-or-public URL opens in incognito

**Gallery**
- ☐ ≥10 graphics attached
- ☐ No secret, terminal, or personal data in any frame

**Writeup**
- ☐ < 2000 words (`wc -w`)
- ☐ All six required sections present
- ☐ App + repo + notebook + video links present and correct
- ☐ n=3 stated wherever eval numbers appear; "no formal user testing was conducted" present

**Link test**
- ☐ All four links opened from the published writeup, logged out

**Privacy / licensing**
- ☐ Eval images author-created; provenance stated
- ☐ License stated (MIT for code)
- ☐ No third-party or personal data included

**SUBMISSION STATUS**
- ☐ **Submit clicked**
- ☐ **Page reloaded and confirmed submitted, not draft** ← the single most important line in this document

---

## 8. Open items

| # | Item | Status | Owner | Blocks? |
|---|---|---|---|---|
| O1 | Undergraduate-eligibility clause on the $1,000 Online Track (page: "for all undergraduate students across Bangladesh"). The "Online - Best teams" DataCamp award carries no such clause | **Unresolved** | Naymul | **No** — affects prize eligibility only, not submission validity |
| O2 | `responseJsonSchema` support on the Gemma endpoint | **Unverified** — not in official Gemma-on-Gemini-API docs; settled empirically by spike S1 | Spike | No — 3-tier fallback already designed |
| O3 | Gemma-tier rate limits | **Unverified** — not published on that page | — | No — low call volume by design |
| O4 | Whether the host will publish a rubric beyond the template | **Unresolved** — page shows only "An example template" | — | No — template honored as binding |
