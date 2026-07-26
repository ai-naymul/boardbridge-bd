'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { BoardArtifact, StudyPack } from '@/lib/schemas';

type Tab = 'notes' | 'code' | 'cards' | 'evidence';

function SourceChips({ ids, unsupported }: { ids: string[]; unsupported: boolean }) {
  if (unsupported) {
    return (
      <span className="rounded border border-red-400/50 bg-red-400/12 px-1.5 py-0.5 text-[10px] text-red-300">
        ⚠ not traceable to any region
      </span>
    );
  }
  return (
    <span className="flex flex-wrap gap-1">
      {ids.map((id) => (
        <span
          key={id}
          className="mono rounded border border-(--color-teal-glow)/40 bg-(--color-teal-glow)/10 px-1.5 py-0.5 text-[10px] text-(--color-teal-glow)"
        >
          {id}
        </span>
      ))}
    </span>
  );
}

function Flashcard({
  card,
}: {
  card: StudyPack['flashcards'][number];
}) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen((o) => !o)}
      className="panel w-full rounded-xl p-4 text-left transition hover:border-(--color-amber-glow)/50"
    >
      <p className="bn-text text-sm font-semibold">{card.front}</p>
      {open ? (
        <p className="bn-text mt-2 border-t border-(--color-edge) pt-2 text-sm text-(--color-muted)">
          {card.back}
        </p>
      ) : (
        <p className="mt-2 text-xs text-(--color-muted)">tap to reveal answer</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <SourceChips ids={card.sourceRegionIds} unsupported={card.unsupported} />
        {card.supportedByUncertainText && (
          <span className="rounded border border-amber-400/45 bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-300">
            ⚠ depends on uncertain text
          </span>
        )}
      </div>
    </button>
  );
}

export default function StudyPackView({
  pack,
  artifact,
}: {
  pack: StudyPack;
  artifact: BoardArtifact;
}) {
  const [tab, setTab] = useState<Tab>('notes');
  const [copied, setCopied] = useState(false);

  const derived = [...pack.keyTerms, ...pack.codeBlocks, ...pack.flashcards];
  const supported = derived.filter((d) => !d.unsupported).length;
  const supportRate = derived.length ? Math.round((supported / derived.length) * 100) : 100;

  function download(name: string, content: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  const markdown = [
    `# ${artifact.title}`,
    '',
    pack.notesMarkdown,
    '',
    pack.keyTerms.length ? '## Key terms' : '',
    ...pack.keyTerms.map((t) => `- **${t.term}** — ${t.bnGloss} _(${t.sourceRegionIds.join(', ') || 'unverified'})_`),
    '',
    pack.flashcards.length ? '## Flashcards' : '',
    ...pack.flashcards.map((f, i) => `${i + 1}. **Q:** ${f.front}\n   **A:** ${f.back} _(${f.sourceRegionIds.join(', ') || 'unverified'})_`),
  ].join('\n');

  const tabs: [Tab, string, number][] = [
    ['notes', 'Notes', 0],
    ['code', 'Code', pack.codeBlocks.length],
    ['cards', 'Flashcards', pack.flashcards.length],
    ['evidence', 'Evidence', derived.length],
  ];

  return (
    <div className="panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tabs.map(([id, label, count]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              tab === id
                ? 'bg-(--color-amber-glow)/15 text-(--color-amber-glow) ring-1 ring-(--color-amber-glow)/40'
                : 'text-(--color-muted) hover:text-(--color-chalk)'
            }`}
          >
            {label}
            {count > 0 && <span className="ml-1.5 text-[10px] opacity-70">{count}</span>}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(markdown);
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            }}
            className="rounded-lg border border-(--color-edge) px-3 py-1.5 text-xs transition hover:border-(--color-teal-glow) hover:text-(--color-teal-glow)"
          >
            {copied ? '✓ copied' : 'Copy .md'}
          </button>
          <button
            onClick={() => download('boardbridge-notes.md', markdown, 'text/markdown')}
            className="rounded-lg border border-(--color-edge) px-3 py-1.5 text-xs transition hover:border-(--color-teal-glow) hover:text-(--color-teal-glow)"
          >
            ↓ .md
          </button>
          <button
            onClick={() =>
              download(
                'boardbridge-studypack.json',
                JSON.stringify({ artifact, pack }, null, 2),
                'application/json'
              )
            }
            className="rounded-lg border border-(--color-edge) px-3 py-1.5 text-xs transition hover:border-(--color-teal-glow) hover:text-(--color-teal-glow)"
          >
            ↓ .json
          </button>
        </div>
      </div>

      {pack.warnings.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-400/35 bg-amber-400/8 px-3 py-2 text-xs text-amber-200">
          {pack.warnings.map((w, i) => (
            <p key={i} className="bn-text">
              ⚠ {w}
            </p>
          ))}
        </div>
      )}

      {tab === 'notes' && (
        <div className="prose-board bn-text max-w-none text-sm">
          <ReactMarkdown>{pack.notesMarkdown}</ReactMarkdown>
        </div>
      )}

      {tab === 'code' && (
        <div className="space-y-3">
          {pack.codeBlocks.length === 0 && (
            <p className="text-sm text-(--color-muted)">No code was found on this board.</p>
          )}
          {pack.codeBlocks.map((c, i) => (
            <div key={i}>
              <div className="mb-1.5 flex items-center gap-2 text-[11px] text-(--color-muted)">
                <span className="mono">{c.language}</span>
                <SourceChips ids={c.sourceRegionIds} unsupported={c.unsupported} />
              </div>
              <pre className="mono overflow-x-auto rounded-lg border border-(--color-edge) bg-black/45 p-3 text-xs leading-relaxed">
                {c.code}
              </pre>
            </div>
          ))}
        </div>
      )}

      {tab === 'cards' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {pack.flashcards.map((c, i) => (
            <Flashcard key={i} card={c} />
          ))}
        </div>
      )}

      {tab === 'evidence' && (
        <div className="space-y-4 text-sm">
          <div className="rounded-lg border border-(--color-edge) bg-black/25 p-3">
            <p className="text-xs text-(--color-muted)">Source-support rate</p>
            <p className="text-2xl font-semibold text-(--color-teal-glow)">
              {supportRate}%
              <span className="ml-2 text-xs font-normal text-(--color-muted)">
                {supported} of {derived.length} generated items cite a real board region
              </span>
            </p>
          </div>
          {pack.keyTerms.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-(--color-muted)">Key terms</p>
              <div className="space-y-2">
                {pack.keyTerms.map((t, i) => (
                  <div key={i} className="flex flex-wrap items-baseline gap-2">
                    <span className="font-semibold">{t.term}</span>
                    <span className="bn-text text-(--color-muted)">{t.bnGloss}</span>
                    <SourceChips ids={t.sourceRegionIds} unsupported={t.unsupported} />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-(--color-muted)">
              Board regions this pack was built from
            </p>
            <div className="space-y-1.5">
              {artifact.regions.map((r) => (
                <div key={r.id} className="flex gap-2 text-xs">
                  <span className="mono shrink-0 text-(--color-teal-glow)">{r.id}</span>
                  <span className="bn-text text-(--color-muted) line-clamp-2">
                    {r.transcription.slice(0, 160)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
