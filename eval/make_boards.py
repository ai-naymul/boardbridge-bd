"""Generate author-created test whiteboard images for BoardBridge BD evaluation.

These are SYNTHETIC boards authored for this submission — not photographs of real
classrooms, and not scraped from anywhere. Provenance is stated in eval/references.md
and in the Kaggle writeup. Run: python3 eval/make_boards.py
"""
import os
import random

from PIL import Image, ImageDraw, ImageFilter, ImageFont

random.seed(20260726)

OUT = os.path.join(os.path.dirname(__file__), "images")
os.makedirs(OUT, exist_ok=True)

# FreeSerif covers Bengali AND Latin in one face, so code-switched lines render
# in a single draw call the way a real hand-written board mixes the two scripts.
BN = "/usr/share/fonts/truetype/freefont/FreeSerif.ttf"
BN_ALT = "/usr/share/fonts/truetype/freefont/FreeSans.ttf"
EN = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
EN_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default()


def board(w=1500, h=1050):
    """Off-white board with faint marker smudge, so it reads as a photographed board."""
    img = Image.new("RGB", (w, h), (247, 247, 244))
    d = ImageDraw.Draw(img)
    for _ in range(26):
        x, y = random.randint(0, w), random.randint(0, h)
        d.ellipse([x, y, x + random.randint(40, 190), y + random.randint(8, 34)],
                  fill=(238, 238, 233))
    return img


def photo_finish(img, blur=0.7, rot=0.5, dark=0.93):
    """Simulate a phone photo: slight rotation, uneven lighting, mild blur, JPEG-ish."""
    img = img.rotate(rot, expand=False, fillcolor=(247, 247, 244), resample=Image.BICUBIC)
    w, h = img.size
    grad = Image.new("L", (w, h))
    gd = ImageDraw.Draw(grad)
    for i in range(h):
        gd.line([(0, i), (w, i)], fill=int(255 * (dark + (1 - dark) * (i / h))))
    img = Image.composite(img, Image.new("RGB", (w, h), (30, 30, 30)), grad)
    return img.filter(ImageFilter.GaussianBlur(blur))


# ----------------------------------------------------------------- board 1
def mixed_notes():
    img = board()
    d = ImageDraw.Draw(img)
    blue, black, red = (28, 48, 130), (32, 32, 32), (170, 30, 30)

    d.text((60, 45), "Hash Table  —  হ্যাশ টেবিল", font=font(BN, 54), fill=blue)
    d.line([(60, 112), (760, 116)], fill=blue, width=4)

    d.text((60, 145), "কী (key) কে hash function দিয়ে index এ map করা হয়।",
           font=font(BN, 38), fill=black)
    d.text((60, 200), "h(k) = k mod m       ← m = table size (prime নেওয়া ভালো)",
           font=font(BN, 36), fill=black)

    d.text((60, 275), "Collision হলে দুইটা উপায়:", font=font(BN, 40), fill=black)
    d.text((95, 330), "১) Chaining — প্রতি bucket এ linked list",
           font=font(BN, 36), fill=black)
    d.text((95, 380), "২) Open addressing — linear / quadratic probing",
           font=font(BN, 36), fill=black)

    d.text((60, 455), "Average case:  O(1)      Worst case:  O(n)",
           font=font(EN_BOLD, 38), fill=red)
    d.text((60, 510), "load factor  α = n/m  ,  α > 0.75 হলে resize করতে হবে",
           font=font(BN, 36), fill=black)

    d.rounded_rectangle([60, 585, 900, 830], radius=10, outline=(90, 90, 90), width=3)
    d.text((80, 600), "def insert(key, val):", font=font(MONO, 32), fill=black)
    d.text((80, 645), "    i = hash(key) % m", font=font(MONO, 32), fill=black)
    d.text((80, 690), "    while table[i] is not None:", font=font(MONO, 32), fill=black)
    d.text((80, 735), "        i = (i + 1) % m", font=font(MONO, 32), fill=black)
    d.text((80, 780), "    table[i] = (key, val)", font=font(MONO, 32), fill=black)

    # deliberately smudged token -> the model should flag this as uncertain
    d.text((960, 600), "amortized", font=font(EN, 34), fill=(150, 150, 150))
    d.text((960, 650), "rehash cost", font=font(EN, 34), fill=(165, 165, 165))
    d.text((60, 870), "পরীক্ষায় asks: chaining vs probing তুলনা",
           font=font(BN, 36), fill=red)
    img = photo_finish(img)
    # localised smudge over "amortized"
    reg = img.crop((950, 585, 1250, 700)).filter(ImageFilter.GaussianBlur(3.4))
    img.paste(reg, (950, 585))
    img.save(os.path.join(OUT, "mixed_notes.jpg"), quality=82)


# ----------------------------------------------------------------- board 2
def flow_pseudocode():
    img = board()
    d = ImageDraw.Draw(img)
    blue, black = (28, 48, 130), (32, 32, 32)
    d.text((60, 40), "BFS — ছক (flowchart)", font=font(BN, 50), fill=blue)

    nodes = [((90, 130), (410, 200), "Start / শুরু"),
             ((90, 250), (410, 320), "queue ← [source]"),
             ((90, 370), (410, 450), "queue খালি?"),
             ((90, 500), (410, 570), "u ← dequeue()"),
             ((90, 620), (410, 700), "visit করা হয়নি এমন\nneighbour enqueue")]
    for (x1, y1), (x2, y2), label in nodes:
        d.rounded_rectangle([x1, y1, x2, y2], radius=12, outline=black, width=4)
        d.multiline_text((x1 + 18, y1 + 16), label, font=font(BN, 30), fill=black)
    for y in (200, 320, 450, 570):
        d.line([(250, y), (250, y + 50)], fill=black, width=4)
        d.polygon([(250, y + 50), (240, y + 34), (260, y + 34)], fill=black)
    d.line([(410, 405), (520, 405)], fill=black, width=4)
    d.text((430, 365), "হ্যাঁ → End", font=font(BN, 30), fill=black)
    d.line([(410, 660), (470, 660), (470, 285), (410, 285)], fill=black, width=4)
    d.text((480, 460), "loop", font=font(EN, 28), fill=black)

    d.text((700, 130), "PSEUDOCODE", font=font(EN_BOLD, 38), fill=blue)
    code = ["BFS(G, s):", "  for each v in V: dist[v] = INF",
            "  dist[s] = 0", "  Q = [s]", "  while Q not empty:",
            "    u = Q.pop(0)", "    for v in adj[u]:",
            "      if dist[v] == INF:", "        dist[v] = dist[u] + 1",
            "        Q.append(v)"]
    for i, line in enumerate(code):
        d.text((700, 190 + i * 44), line, font=font(MONO, 30), fill=black)
    d.text((700, 660), "সময় জটিলতা: O(V + E)", font=font(BN, 36), fill=(170, 30, 30))
    d.text((700, 715), "adjacency list ব্যবহার করলে", font=font(BN, 32), fill=black)
    photo_finish(img, blur=0.9, rot=-0.7).save(
        os.path.join(OUT, "flow_pseudocode.jpg"), quality=82)


# ----------------------------------------------------------------- board 3 (negative control)
def blurred_negative():
    """Deliberately unusable. Correct behaviour = imageQuality 'unusable', zero regions."""
    img = board(1200, 850)
    d = ImageDraw.Draw(img)
    for i in range(9):
        d.text((70, 70 + i * 80), "অস্পষ্ট লেখা illegible scrawl " * 2,
               font=font(BN, 34), fill=(205, 205, 200))
    img = img.filter(ImageFilter.GaussianBlur(11)).rotate(
        3.5, fillcolor=(240, 240, 236), resample=Image.BICUBIC)
    img.save(os.path.join(OUT, "blurred_negative.jpg"), quality=55)


if __name__ == "__main__":
    mixed_notes()
    flow_pseudocode()
    blurred_negative()
    for f in sorted(os.listdir(OUT)):
        print(f, os.path.getsize(os.path.join(OUT, f)), "bytes")
