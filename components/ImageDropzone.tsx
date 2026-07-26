'use client';

import { useRef, useState } from 'react';

const MAX_EDGE = 1600;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export interface PreparedImage {
  base64: string;
  mimeType: string;
  previewUrl: string;
  originalBytes: number;
  sentBytes: number;
}

/**
 * Downscale in the browser before upload. A 4 MB phone photo becomes ~200-400 KB, which
 * matters on the mobile data most Bangladeshi students are using.
 */
async function prepare(file: File): Promise<PreparedImage> {
  const previewUrl = URL.createObjectURL(file);
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  const base64 = dataUrl.split(',')[1];
  return {
    base64,
    mimeType: 'image/jpeg',
    previewUrl,
    originalBytes: file.size,
    sentBytes: Math.floor((base64.length * 3) / 4),
  };
}

export default function ImageDropzone({
  onReady,
  busy,
}: {
  onReady: (img: PreparedImage) => void;
  busy: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handle(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!ALLOWED.includes(file.type)) {
      setError(`"${file.type || 'unknown file'}" is not a supported image. Use JPEG, PNG or WebP.`);
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('That image is over 20 MB. Please pick a smaller photo.');
      return;
    }
    try {
      onReady(await prepare(file));
    } catch {
      setError('Could not read that image. It may be corrupted.');
    }
  }

  async function loadSample(name: string) {
    setError(null);
    try {
      const res = await fetch(`/samples/${name}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      // A sample still goes through the identical prepare -> /api/extract path.
      // Nothing about choosing a sample bypasses real Gemma inference.
      await handle(new File([blob], name, { type: 'image/jpeg' }));
    } catch {
      setError('Could not load the sample board.');
    }
  }

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handle(e.dataTransfer.files?.[0]);
        }}
        onClick={() => !busy && inputRef.current?.click()}
        className={`panel cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition sm:p-14 ${
          dragging ? 'border-[--color-teal-glow] bg-white/5' : 'border-[--color-edge]'
        } ${busy ? 'pointer-events-none opacity-50' : 'hover:border-[--color-amber-glow]'}`}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[--color-amber-glow]/12 text-2xl">
          🖼️
        </div>
        <p className="text-base font-semibold">Upload a whiteboard photo</p>
        <p className="bn-text mt-1 text-sm text-[--color-muted]">
          ছবি তুলুন বা টেনে আনুন — JPEG / PNG / WebP
        </p>
        <p className="mt-3 text-xs text-[--color-muted]">
          Resized to {MAX_EDGE}px in your browser before upload, to save mobile data.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="hidden"
          onChange={(e) => handle(e.target.files?.[0])}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[--color-muted]">Or try a sample board:</span>
        {[
          ['mixed_notes.jpg', 'Hash table (BN+EN)'],
          ['flow_pseudocode.jpg', 'BFS flowchart'],
          ['blurred_negative.jpg', 'Unreadable board'],
        ].map(([file, label]) => (
          <button
            key={file}
            disabled={busy}
            onClick={() => loadSample(file)}
            className="rounded-lg border border-[--color-edge] bg-white/5 px-3 py-1.5 transition hover:border-[--color-teal-glow] hover:text-[--color-teal-glow] disabled:opacity-40"
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
