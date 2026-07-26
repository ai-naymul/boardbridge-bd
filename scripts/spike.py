"""G1 feasibility spike: real image -> gemma-4-31b-it -> structured JSON.

Tests the 3-tier structured-output strategy in order and reports which tier works.
Run: python3 scripts/spike.py
"""
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

for line in open(os.path.join(ROOT, ".env.local")):
    if "=" in line and not line.startswith("#"):
        k, v = line.strip().split("=", 1)
        os.environ.setdefault(k, v)

KEY = os.environ["GEMINI_API_KEY"]
MODEL = os.environ.get("GEMMA_MODEL", "gemma-4-31b-it")
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"

SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "detectedLanguages": {"type": "array", "items": {"type": "string"}},
        "imageQuality": {"type": "string", "enum": ["good", "fair", "poor", "unusable"]},
        "regions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "order": {"type": "integer"},
                    "type": {"type": "string"},
                    "transcription": {"type": "string"},
                    "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
                    "uncertainSpans": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["id", "order", "type", "transcription", "confidence"],
            },
        },
    },
    "required": ["title", "detectedLanguages", "imageQuality", "regions"],
}

SYSTEM = (
    "You transcribe photographed classroom whiteboards from Bangladesh. "
    "Transcribe EXACTLY what is written, preserving Bangla, English, code-switching and "
    "Bangla numerals. Do not translate. Do not correct spelling. "
    "If a token is illegible, give your best guess and list it in uncertainSpans and set "
    "that region confidence to 'low'. If the image has no legible board content, return "
    "imageQuality 'unusable' with an empty regions array. Never invent content. "
    "Output JSON only."
)


def call(img_path, tier):
    b64 = base64.b64encode(open(img_path, "rb").read()).decode()
    body = {
        "systemInstruction": {"parts": [{"text": SYSTEM}]},
        "contents": [{"parts": [
            {"inline_data": {"mime_type": "image/jpeg", "data": b64}},
            {"text": "Transcribe this whiteboard into the BoardArtifact JSON schema."},
        ]}],
        "generationConfig": {"temperature": 0},
    }
    if tier == "A":
        body["generationConfig"]["responseMimeType"] = "application/json"
        body["generationConfig"]["responseJsonSchema"] = SCHEMA
    elif tier == "B":
        body["generationConfig"]["responseMimeType"] = "application/json"
    # tier C: prompt-only

    req = urllib.request.Request(
        URL, data=json.dumps(body).encode(),
        headers={"x-goog-api-key": KEY, "Content-Type": "application/json"})
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            payload = json.load(r)
    except urllib.error.HTTPError as e:
        return None, round(time.time() - t0, 1), f"HTTP {e.code}: {e.read().decode()[:400]}"
    dt = round(time.time() - t0, 1)
    parts = payload["candidates"][0]["content"]["parts"]
    text = "".join(p["text"] for p in parts if "text" in p and not p.get("thought"))
    return text, dt, None


def strip_fence(t):
    t = t.strip()
    if t.startswith("```"):
        t = t.split("\n", 1)[1] if "\n" in t else t
        t = t.rsplit("```", 1)[0]
    return t.strip()


def first_json_object(text):
    """Decode the FIRST complete JSON value and ignore anything after it.

    Gemma sometimes appends trailing prose or emits a single-element array, so a bare
    json.loads() fails on otherwise-good output. This is a structural decode, not a
    regex scrape: raw_decode stops at the end of the first valid value.
    """
    s = strip_fence(text)
    start = min((i for i in (s.find("{"), s.find("[")) if i != -1), default=-1)
    if start == -1:
        raise ValueError("no JSON value in response")
    obj, _ = json.JSONDecoder().raw_decode(s[start:])
    if isinstance(obj, list):
        obj = next((x for x in obj if isinstance(x, dict)), None)
        if obj is None:
            raise ValueError("array contained no object")
    return obj


if __name__ == "__main__":
    img = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "eval/images/mixed_notes.jpg")
    for tier in ("A", "B", "C"):
        text, dt, err = call(img, tier)
        if err:
            print(f"TIER {tier}: FAILED ({dt}s) {err}\n")
            continue
        try:
            obj = first_json_object(text)
        except Exception as ex:
            print(f"TIER {tier}: returned non-JSON ({dt}s): {ex}\n{text[:300]}\n")
            continue
        print(f"TIER {tier}: OK  {dt}s  quality={obj.get('imageQuality')} "
              f"regions={len(obj.get('regions', []))} langs={obj.get('detectedLanguages')}")
        out = os.path.join(ROOT, "eval/raw/spike_run.json")
        os.makedirs(os.path.dirname(out), exist_ok=True)
        json.dump({"tier": tier, "model": MODEL, "latencySec": dt, "artifact": obj},
                  open(out, "w"), ensure_ascii=False, indent=2)
        print(json.dumps(obj, ensure_ascii=False, indent=2)[:2500])
        break
