"""End-to-end check + evaluation harness against the running app.

Runs every eval image through /api/extract then /api/studypack, saves the raw JSON to
eval/raw/ so the numbers in eval/results.md can be re-checked by anyone.

Usage: python3 scripts/e2e.py [base_url]
"""
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
IMAGES = ["mixed_notes.jpg", "flow_pseudocode.jpg", "blurred_negative.jpg"]


def post(path, payload, timeout=120):
    req = urllib.request.Request(
        BASE + path, data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"})
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.load(r), r.status, round(time.time() - t0, 1)
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode() or "{}"), e.code, round(time.time() - t0, 1)


def run(name):
    path = os.path.join(ROOT, "eval/images", name)
    b64 = base64.b64encode(open(path, "rb").read()).decode()

    ext, status, dt1 = post("/api/extract", {"mimeType": "image/jpeg", "base64": b64})
    if status != 200:
        print(f"  extract FAILED {status}: {ext.get('error')}")
        return {"image": name, "extractStatus": status, "error": ext.get("error")}

    art = ext["artifact"]
    print(f"  extract  {dt1}s  quality={art['imageQuality']}  regions={len(art['regions'])}"
          f"  langs={art['detectedLanguages']}")

    result = {"image": name, "extractStatus": 200, "extractSec": dt1,
              "meta": ext["meta"], "artifact": art}

    if not art["regions"]:
        print("  studypack SKIPPED — no regions (correct behaviour for an unusable board)")
        result["studypack"] = None
        return result

    pk, status2, dt2 = post("/api/studypack", {"artifact": art})
    if status2 != 200:
        print(f"  studypack FAILED {status2}: {pk.get('error')}")
        result["studypackStatus"] = status2
        result["studypackError"] = pk.get("error")
        return result

    pack = pk["pack"]
    derived = pack["keyTerms"] + pack["codeBlocks"] + pack["flashcards"]
    supported = [d for d in derived if not d["unsupported"]]
    rate = round(100 * len(supported) / len(derived)) if derived else 100
    print(f"  studypack {dt2}s  cards={len(pack['flashcards'])} "
          f"terms={len(pack['keyTerms'])} code={len(pack['codeBlocks'])} "
          f"source-support={rate}% ({len(supported)}/{len(derived)})")
    result.update({"studypackStatus": 200, "studypackSec": dt2, "meta2": pk["meta"],
                   "sourceSupportRate": rate, "derivedCount": len(derived),
                   "supportedCount": len(supported), "pack": pack})
    return result


if __name__ == "__main__":
    os.makedirs(os.path.join(ROOT, "eval/raw"), exist_ok=True)
    all_results = []
    for name in IMAGES:
        print(f"\n=== {name} ===")
        res = run(name)
        all_results.append(res)
        with open(os.path.join(ROOT, "eval/raw", name.replace(".jpg", ".json")), "w") as f:
            json.dump(res, f, ensure_ascii=False, indent=2)

    # different images must produce materially different artifacts
    titles = [r.get("artifact", {}).get("title") for r in all_results]
    counts = [len(r.get("artifact", {}).get("regions", [])) for r in all_results]
    print(f"\nDISTINCTNESS titles={titles} regionCounts={counts}")
    print("SAVED to eval/raw/")
