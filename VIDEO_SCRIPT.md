# BoardBridge BD demo video script

Target 3:10 to 3:30. Hard max 5:00. Read it at normal talking speed, don't rush.

Before you hit record: close your terminal, close VS Code, close the tab with `.env.local` in it.
Have `https://boardbridge-bd.vercel.app` open in one clean window and `media/13-architecture.png`
open in a second tab so you can flip to it at the end.

Talk like you're showing this to a friend. Stumbling once is fine. Reading it perfectly is worse.

---

## 0:00 the problem

**Say:**
> Last semester I missed a class. What I got was one photo of the whiteboard on WhatsApp.
> Half Bangla, half English, some code in the middle, and the handwriting in the corner was
> basically gone. I spent longer copying that board out than I would have spent sitting in
> the lecture.

**Screen:** the board photo full screen (`media/10-input-board-mixed-bn-en.jpg`). Just let it sit there.

---

## 0:22 what it is

**Say:**
> So I built BoardBridge. You give it the photo, it gives you back notes you can actually
> study from. The model is Gemma 4, gemma-4-31b-it, and it's printed up here in the corner
> so you can see which one is running.
>
> This is for students at any university here. The photo gets shrunk in the browser before
> it uploads, so it's about a hundred kilobytes going out instead of four megabytes. On
> mobile data that matters.

**Screen:** the app home page. Move your cursor to the model badge when you say the model name.

---

## 0:48 upload

**Say:**
> Here's the board. Let me upload it.

**Screen:** click **Hash table (BN+EN)**. Let the spinner run. Don't fill the silence, just wait.

---

## 1:05 what came back

**Say:**
> About thirty seconds. Gemma read it and came back with ten separate pieces, not one blob of
> text. Heading, the formula, the bullet list, the code block. Bangla stayed Bangla. Hash
> function and load factor stayed in English, because if you translate those a CS student
> stops recognising them.

**Screen:** scroll the region list slowly. Pause on the code block (r8).

---

## 1:32 the uncertainty (this is the part judges remember)

**Say:**
> Now the part I actually care about. Look at r9. Those two words are blurred on the real
> board. Gemma didn't pretend to read them. It dropped the confidence to মাঝারি and told me
> exactly which span it wasn't sure about. So I fix it myself.

**Screen:** scroll to r9, point at the red wavy underline, then **type a correction into the
textarea**. Show the "edited by you" chip appearing.

---

## 1:58 the second call

**Say:**
> Then the second call. It only gets my corrected text. The photo is not sent again, so my
> correction wins over whatever the model thought it saw the first time.

**Screen:** click **Generate verified study pack**.

---

## 2:15 the output

**Say:**
> Notes. The code. Flashcards. And every one of these points back to the region it came from.
> r2, r5, r7. Thirteen out of thirteen on this board, and the app checks that itself, on the
> server, instead of taking the model's word for it.

**Screen:** Notes tab, then Code, then Flashcards, then **Evidence**. Slow down on Evidence and
let the source chips and the 100% number be readable.

---

## 2:45 the refusal

**Say:**
> One more. This is a photo you genuinely cannot read. Zero regions. Quality unusable. It
> won't write you notes. That's the whole reason the verify step exists, because a student who
> missed the class is the one person who can't catch a wrong summary.

**Screen:** Start over, click **Unreadable board**. Let the "No regions were extracted" panel land.

---

## 3:05 honest numbers

**Say:**
> I tested three boards. Ten out of ten facts on the first one, eight out of eight on the
> second. It also got a word wrong, হ্যাঁ came out as হাঁ, and it did not flag that one. That's
> written up in the repo with the raw API responses, so you can check the numbers yourself.

**Screen:** `media/14-results.png`.

---

## 3:25 close

**Say:**
> Gemma reads the board. The app checks the output. I fix what's wrong. Then it builds the
> study pack. Thanks for watching.

**Screen:** `media/13-architecture.png`, hold for two seconds, stop recording.

---

## Recording

OBS is installed. Or from a terminal you close before recording:

```
ffmpeg -f x11grab -framerate 30 -video_size 1920x1080 -i :0.0 \
       -f pulse -i default -c:v libx264 -preset veryfast -crf 23 demo.mp4
```

Upload to YouTube as **Unlisted**, copy the link, paste it into `docs/kaggle_writeup.md` where
it says `*(paste your YouTube unlisted link here)*`, then submit on Kaggle.

## Words to keep out of your mouth

Seamless, leverage, robust, cutting-edge, revolutionary, game-changing, empowers, unlocks,
"in today's fast-paced world", "let's dive in". If you catch yourself saying one, just say the
plain version and keep going. Nobody re-records for that.
