'use client';

import type { BoardArtifact, Region } from '@/lib/schemas';

const CONFIDENCE_LABEL: Record<Region['confidence'], { bn: string; cls: string }> = {
  high: { bn: 'উচ্চ', cls: 'border-(--color-teal-glow)/45 bg-(--color-teal-glow)/12 text-(--color-teal-glow)' },
  medium: { bn: 'মাঝারি', cls: 'border-(--color-amber-glow)/45 bg-(--color-amber-glow)/12 text-(--color-amber-glow)' },
  low: { bn: 'কম', cls: 'border-red-400/45 bg-red-400/12 text-red-300' },
};

/** Highlight the spans Gemma flagged as uncertain, inside the transcription preview. */
function Marked({ text, spans }: { text: string; spans: string[] }) {
  if (spans.length === 0) return <>{text}</>;
  const escaped = spans
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'g'));
  const set = new Set(spans);
  return (
    <>
      {parts.map((p, i) =>
        set.has(p) ? (
          <mark
            key={i}
            className="rounded bg-red-400/25 px-1 text-red-200 underline decoration-red-400/70 decoration-wavy underline-offset-4"
          >
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

export default function RegionEditor({
  artifact,
  onChange,
}: {
  artifact: BoardArtifact;
  onChange: (a: BoardArtifact) => void;
}) {
  function update(id: string, patch: Partial<Region>) {
    onChange({
      ...artifact,
      regions: artifact.regions.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  }

  function remove(id: string) {
    onChange({ ...artifact, regions: artifact.regions.filter((r) => r.id !== id) });
  }

  if (artifact.regions.length === 0) {
    return (
      <div className="panel rounded-xl p-6 text-center">
        <p className="font-semibold text-amber-300">No regions were extracted.</p>
        <p className="bn-text mt-2 text-sm text-(--color-muted)">
          Gemma reported image quality <strong>{artifact.imageQuality}</strong> and returned no
          content rather than guessing at what the board might have said.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {artifact.regions.map((r) => {
        const conf = CONFIDENCE_LABEL[r.confidence];
        return (
          <div
            key={r.id}
            className={`panel rounded-xl p-3.5 transition ${r.unreadable ? 'opacity-45' : ''}`}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="mono rounded bg-white/8 px-1.5 py-0.5 text-(--color-muted)">
                {r.id}
              </span>
              <span className="rounded border border-(--color-edge) px-1.5 py-0.5 text-(--color-muted)">
                {r.type}
              </span>
              <span className={`rounded border px-1.5 py-0.5 ${conf.cls}`}>
                confidence {conf.bn}
              </span>
              {r.languageTags.map((t) => (
                <span key={t} className="rounded bg-white/5 px-1.5 py-0.5 text-(--color-muted)">
                  {t}
                </span>
              ))}
              {r.edited && (
                <span className="rounded border border-(--color-teal-glow)/50 bg-(--color-teal-glow)/12 px-1.5 py-0.5 text-(--color-teal-glow)">
                  ✎ edited by you
                </span>
              )}
              <span className="ml-auto flex gap-1">
                <button
                  onClick={() => update(r.id, { unreadable: !r.unreadable })}
                  className="rounded border border-(--color-edge) px-2 py-0.5 text-(--color-muted) transition hover:border-amber-400/60 hover:text-amber-300"
                >
                  {r.unreadable ? 'restore' : 'mark unreadable'}
                </button>
                <button
                  onClick={() => remove(r.id)}
                  className="rounded border border-(--color-edge) px-2 py-0.5 text-(--color-muted) transition hover:border-red-400/60 hover:text-red-300"
                >
                  delete
                </button>
              </span>
            </div>

            {r.uncertainSpans.length > 0 && (
              <p className="bn-text mb-2 text-xs text-red-300/90">
                Gemma was unsure about:{' '}
                <span className="mono">{r.uncertainSpans.join(', ')}</span> — check these against
                the photo.
              </p>
            )}

            <div className="bn-text mb-2 rounded-lg bg-black/25 px-3 py-2 text-sm">
              <Marked text={r.transcription} spans={r.uncertainSpans} />
            </div>

            <textarea
              value={r.transcription}
              onChange={(e) => update(r.id, { transcription: e.target.value, edited: true })}
              rows={Math.min(8, Math.max(2, r.transcription.split('\n').length + 1))}
              spellCheck={false}
              className={`bn-text w-full rounded-lg border border-(--color-edge) bg-black/35 px-3 py-2 text-sm outline-none transition focus:border-(--color-teal-glow) ${
                r.type === 'code' || r.type === 'pseudocode' ? 'mono' : ''
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}
