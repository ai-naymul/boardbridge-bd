'use client';

import { useEffect, useState } from 'react';
import ImageDropzone, { type PreparedImage } from '@/components/ImageDropzone';
import RegionEditor from '@/components/RegionEditor';
import StudyPackView from '@/components/StudyPackView';
import type { BoardArtifact, StudyPack } from '@/lib/schemas';

type Stage = 'upload' | 'extracting' | 'verify' | 'generating' | 'done';

export default function Home() {
  const [model, setModel] = useState<string>('…');
  const [stage, setStage] = useState<Stage>('upload');
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [artifact, setArtifact] = useState<BoardArtifact | null>(null);
  const [pack, setPack] = useState<StudyPack | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timing, setTiming] = useState<{ extract?: number; pack?: number }>({});

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((d) => setModel(d.model))
      .catch(() => setModel('unavailable'));
  }, []);

  async function extract(img: PreparedImage) {
    setImage(img);
    setError(null);
    setPack(null);
    setStage('extracting');
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mimeType: img.mimeType, base64: img.base64 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Extraction failed.');
      setArtifact(json.artifact);
      setTiming((t) => ({ ...t, extract: json.meta.latencyMs }));
      setStage('verify');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Extraction failed.');
      setStage('upload');
    }
  }

  async function generate() {
    if (!artifact) return;
    setError(null);
    setStage('generating');
    try {
      const res = await fetch('/api/studypack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artifact }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Study pack generation failed.');
      setPack(json.pack);
      setTiming((t) => ({ ...t, pack: json.meta.latencyMs }));
      setStage('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed.');
      setStage('verify');
    }
  }

  function reset() {
    setStage('upload');
    setImage(null);
    setArtifact(null);
    setPack(null);
    setError(null);
    setTiming({});
  }

  const busy = stage === 'extracting' || stage === 'generating';
  const edits = artifact?.regions.filter((r) => r.edited || r.unreadable).length ?? 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6">
      <header className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Board<span className="text-(--color-amber-glow)">Bridge</span>{' '}
              <span className="text-(--color-muted)">BD</span>
            </h1>
            <p className="bn-text mt-1 max-w-2xl text-sm text-(--color-muted)">
              এক ছবি থেকে যাচাই করা স্টাডি প্যাক — one whiteboard photo becomes verified notes,
              code and flashcards, with every item traceable back to the board.
            </p>
          </div>
          <div className="rounded-xl border border-(--color-edge) bg-black/35 px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-wider text-(--color-muted)">
              vision model
            </p>
            <p className="mono text-sm text-(--color-teal-glow)">{model}</p>
          </div>
        </div>

        <ol className="mt-5 flex flex-wrap gap-1.5 text-[11px]">
          {[
            ['1', 'Gemma extracts', stage !== 'upload'],
            ['2', 'App validates', Boolean(artifact)],
            ['3', 'You verify', edits > 0],
            ['4', 'Study pack generated', Boolean(pack)],
          ].map(([n, label, active]) => (
            <li
              key={n as string}
              className={`rounded-full border px-2.5 py-1 transition ${
                active
                  ? 'border-(--color-teal-glow)/50 bg-(--color-teal-glow)/10 text-(--color-teal-glow)'
                  : 'border-(--color-edge) text-(--color-muted)'
              }`}
            >
              {n as string}. {label as string}
            </li>
          ))}
        </ol>
      </header>

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/40 bg-red-500/10 p-4">
          <p className="text-sm font-semibold text-red-300">Something went wrong</p>
          <p className="bn-text mt-1 text-sm text-red-200/90">{error}</p>
          <button
            onClick={() => (artifact ? generate() : image ? extract(image) : setError(null))}
            className="mt-3 rounded-lg border border-red-400/50 px-3 py-1.5 text-xs text-red-200 transition hover:bg-red-500/15"
          >
            Retry
          </button>
        </div>
      )}

      {stage === 'upload' && !artifact && <ImageDropzone onReady={extract} busy={busy} />}

      {stage === 'extracting' && (
        <div className="panel rounded-2xl p-10 text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-(--color-edge) border-t-(--color-amber-glow)" />
          <p className="font-medium">Gemma is reading the board…</p>
          <p className="bn-text mt-1 text-sm text-(--color-muted)">
            Transcribing Bangla and English exactly as written. This takes 15–25 seconds.
          </p>
        </div>
      )}

      {artifact && stage !== 'extracting' && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image.previewUrl}
                alt="Uploaded whiteboard"
                className="w-full rounded-xl border border-(--color-edge)"
              />
            )}
            <div className="panel rounded-xl p-4 text-xs">
              <p className="mb-2 font-semibold">{artifact.title}</p>
              <dl className="space-y-1 text-(--color-muted)">
                <div className="flex justify-between gap-2">
                  <dt>image quality</dt>
                  <dd
                    className={
                      artifact.imageQuality === 'unusable' || artifact.imageQuality === 'poor'
                        ? 'text-red-300'
                        : 'text-(--color-chalk)'
                    }
                  >
                    {artifact.imageQuality}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>languages</dt>
                  <dd className="text-(--color-chalk)">
                    {artifact.detectedLanguages.join(', ') || '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>regions</dt>
                  <dd className="text-(--color-chalk)">{artifact.regions.length}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>your corrections</dt>
                  <dd className="text-(--color-chalk)">{edits}</dd>
                </div>
                {image && (
                  <div className="flex justify-between gap-2">
                    <dt>upload size</dt>
                    <dd className="text-(--color-chalk)">
                      {(image.originalBytes / 1024 / 1024).toFixed(1)}MB →{' '}
                      {(image.sentBytes / 1024).toFixed(0)}KB
                    </dd>
                  </div>
                )}
                {timing.extract && (
                  <div className="flex justify-between gap-2">
                    <dt>extract latency</dt>
                    <dd className="mono text-(--color-chalk)">{(timing.extract / 1000).toFixed(1)}s</dd>
                  </div>
                )}
                {timing.pack && (
                  <div className="flex justify-between gap-2">
                    <dt>study pack latency</dt>
                    <dd className="mono text-(--color-chalk)">{(timing.pack / 1000).toFixed(1)}s</dd>
                  </div>
                )}
              </dl>
              {artifact.warnings.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-(--color-edge) pt-2 text-amber-200/90">
                  {artifact.warnings.map((w, i) => (
                    <li key={i} className="bn-text">
                      ⚠ {w}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={reset}
              className="w-full rounded-lg border border-(--color-edge) px-3 py-2 text-xs text-(--color-muted) transition hover:text-(--color-chalk)"
            >
              ← Start over with another board
            </button>
          </div>

          <div className="space-y-4">
            {!pack && (
              <div className="panel rounded-xl p-4">
                <p className="text-sm font-semibold">Step 3 — verify what Gemma read</p>
                <p className="bn-text mt-1 text-xs text-(--color-muted)">
                  Red wavy underlines are spans Gemma was unsure about. Fix a word, mark a block
                  unreadable, or delete anything that is not actually on the board. The study pack
                  is built from your corrected text, not from the raw photo.
                </p>
              </div>
            )}

            {!pack && <RegionEditor artifact={artifact} onChange={setArtifact} />}

            {artifact.regions.length > 0 && (
              <button
                onClick={generate}
                disabled={busy}
                className="w-full rounded-xl bg-(--color-amber-glow) px-4 py-3 text-sm font-semibold text-[#1a1206] transition hover:brightness-110 disabled:opacity-50"
              >
                {stage === 'generating'
                  ? 'Gemma is building your study pack…'
                  : pack
                    ? `Regenerate study pack${edits ? ` with your ${edits} correction${edits === 1 ? '' : 's'}` : ''}`
                    : 'Generate verified study pack →'}
              </button>
            )}

            {pack && <StudyPackView pack={pack} artifact={artifact} />}

            {pack && (
              <details className="panel rounded-xl p-4 text-xs">
                <summary className="cursor-pointer font-semibold">
                  Edit the transcript again and regenerate
                </summary>
                <div className="mt-3">
                  <RegionEditor artifact={artifact} onChange={setArtifact} />
                </div>
              </details>
            )}
          </div>
        </div>
      )}

      <footer className="mt-14 border-t border-(--color-edge) pt-5 text-xs text-(--color-muted)">
        <p className="bn-text">
          Your photo is processed in memory and never stored on our servers. Two separate{' '}
          <span className="mono text-(--color-teal-glow)">{model}</span> calls run per board — one
          reads the image, one builds the study pack from the transcript you approved.
        </p>
        <p className="mt-2">
          Built for Build With Gemma @Bangladesh · Multimodal Track · prototype, not a
          substitute for your own notes.
        </p>
      </footer>
    </main>
  );
}
