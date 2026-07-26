# SUBMIT NOW — click-by-click

**Deadline: 2026-07-26 10:00 UTC = 16:00 Asia/Dhaka.**

Everything except the video and the final Submit click is done and live.

---

## Step 1 — record the video (target 3:30, hard max 5:00)

Open https://boardbridge-bd.vercel.app in a clean window. Screen-record with voice.
**Clear your terminal first** — no keys or env files on screen.

| Time | Say this | Show this |
|---|---|---|
| 0:00–0:25 | "You miss a lecture in Dhaka. What arrives on WhatsApp is one photo of the whiteboard — Bangla explanation, English technical terms, code, all mixed. Rewriting it takes longer than learning it. And a normal AI summariser will confidently invent whatever it couldn't read — which is worst for exactly the student who wasn't there." | the hash-table board image |
| 0:25–0:40 | "BoardBridge BD. The model is Gemma 4 — `gemma-4-31b-it` — and it's shown right here in the header." | point at the model badge |
| 0:40–1:10 | "I upload the board. Gemma reads the actual image and returns structure, not a wall of text." | click **Hash table (BN+EN)**, let it run |
| 1:10–1:55 | "Ten regions. Headings, a formula, a bullet list, the code block. Bangla stayed Bangla, `hash function` and `load factor` stayed English — the prompt forbids translating. Confidence is shown in Bangla: উচ্চ, মাঝারি, কম." | scroll the region list |
| 1:55–2:25 | "Look at region r9. These two words are blurred on the board. Gemma did **not** assert them — it marked the region medium confidence and listed the exact uncertain span, underlined in red. I can fix it right here." | scroll to r9, **edit the text**, show the ✎ edited chip |
| 2:25–2:55 | "Now the second Gemma call. It gets my corrected transcript — the image is not resent — so my correction wins." | click **Generate verified study pack** |
| 2:55–3:20 | "Structured notes, the code, flashcards. And every single item cites the board region it came from — 100% source support, checked server-side, not by the model." | Notes → Code → Flashcards → **Evidence** tab |
| 3:20–3:45 | "The case that matters most: an unreadable board. Zero regions, quality 'unusable'. It refuses to invent notes. n=3, and one real transcription error is published in the repo — হ্যাঁ came back as হাঁ, unflagged. That's exactly why the human verification step isn't optional." | Start over → **Unreadable board** |
| 3:45–4:00 | "Gemma extracts. The app validates. The student verifies. Then the study pack is generated. That's the architecture, not a slogan." | architecture diagram (`media/13-architecture.png`) |

Upload to YouTube as **Unlisted**. Copy the link.

## Step 2 — paste the video link into the writeup

Open `docs/kaggle_writeup.md`, replace the line
`| **Video** | *(paste your YouTube unlisted link here)* |`
with your link.

## Step 3 — create and SUBMIT the Kaggle writeup

1. Go to **https://www.kaggle.com/competitions/build-with-gemma-bangladesh/writeups**
2. Click **New Writeup** (top right).
3. Paste the whole of `docs/kaggle_writeup.md` (1,386 words — under the 2,000 limit).
4. Attach **all 14 images from `media/`** — that clears the "minimum 10 graphics" requirement.
5. Confirm these four links are in the writeup:
   - App https://boardbridge-bd.vercel.app
   - Repo https://github.com/ai-naymul/boardbridge-bd
   - Notebook https://github.com/ai-naymul/boardbridge-bd/blob/main/notebook/boardbridge_gemma.ipynb
   - Video (yours)
6. **Save.**
7. **Click Submit — top right corner.** A saved draft is not judged.
8. **Reload the page and confirm it says submitted, not draft.**

---

## Already verified and live

| Component | Status |
|---|---|
| Deployed app | ✅ https://boardbridge-bd.vercel.app — full run verified in production |
| Public repo | ✅ https://github.com/ai-naymul/boardbridge-bd (PUBLIC) |
| Notebook | ✅ `notebook/boardbridge_gemma.ipynb`, valid, no key in any cell |
| Media gallery | ✅ 14 graphics in `media/` |
| Writeup text | ✅ `docs/kaggle_writeup.md`, 1,386 words |
| Evaluation | ✅ `eval/results.md` + raw API responses in `eval/raw/` |
| Secret scan | ✅ clean — no key in git history, code, screenshots or notebook |
| Video | ⬜ **you record + upload** |
| Kaggle Submit click | ⬜ **you click** |

## Open question (does not block submitting)

The **$1,000 Online Track is restricted to "undergraduate students across Bangladesh."**
The separate "Online – Best teams" DataCamp award has no such clause. Submit either way —
this affects prize eligibility only, not judging.
