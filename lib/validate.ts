import type { BoardArtifact, StudyPack } from './schemas';

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;

export function validateImageInput(mimeType: string, base64: string): string | null {
  if (!ALLOWED_MIME.includes(mimeType as (typeof ALLOWED_MIME)[number])) {
    return `Unsupported image type "${mimeType}". Use JPEG, PNG or WebP.`;
  }
  if (!base64 || base64.length < 100) return 'Image data is empty or corrupted.';
  // base64 expands by ~4/3; check the decoded size without materialising a Buffer.
  const approxBytes = Math.floor((base64.length * 3) / 4);
  if (approxBytes > MAX_IMAGE_BYTES) {
    return `Image is ${(approxBytes / 1024 / 1024).toFixed(1)} MB. Maximum is 8 MB.`;
  }
  return null;
}

/**
 * Referential integrity between the two stages.
 *
 * Gemma cannot be trusted to cite only regions that exist, so every derived item's
 * sourceRegionIds are intersected with the artifact's real region ids. Unknown ids are
 * dropped; an item left with zero valid citations is KEPT but flagged `unsupported` so the
 * UI can show it as unverified rather than silently presenting it as sourced.
 */
export function crossCheckSourceRegions(pack: StudyPack, artifact: BoardArtifact): StudyPack {
  const valid = new Set(artifact.regions.map((r) => r.id));
  const uncertain = new Set(
    artifact.regions
      .filter((r) => r.confidence === 'low' || r.uncertainSpans.length > 0)
      .map((r) => r.id)
  );

  let dropped = 0;
  let unsupportedCount = 0;

  const clean = <T extends { sourceRegionIds: string[]; unsupported: boolean }>(item: T): T => {
    const kept = item.sourceRegionIds.filter((id) => valid.has(id));
    dropped += item.sourceRegionIds.length - kept.length;
    const unsupported = kept.length === 0;
    if (unsupported) unsupportedCount++;
    return { ...item, sourceRegionIds: kept, unsupported };
  };

  const warnings = [...pack.warnings];
  const out: StudyPack = {
    ...pack,
    keyTerms: pack.keyTerms.map(clean),
    codeBlocks: pack.codeBlocks.map(clean),
    flashcards: pack.flashcards.map((f) => {
      const c = clean(f);
      return {
        ...c,
        // recompute from the artifact rather than trusting the model's self-report
        supportedByUncertainText:
          f.supportedByUncertainText || c.sourceRegionIds.some((id) => uncertain.has(id)),
      };
    }),
    warnings,
  };

  if (dropped > 0) {
    warnings.push(
      `Dropped ${dropped} source reference${dropped === 1 ? '' : 's'} that pointed to regions which do not exist on this board.`
    );
  }
  if (unsupportedCount > 0) {
    warnings.push(
      `${unsupportedCount} item${unsupportedCount === 1 ? ' is' : 's are'} not traceable to any board region and ${unsupportedCount === 1 ? 'is' : 'are'} marked unverified.`
    );
  }
  out.warnings = warnings;
  return out;
}

/** Strip client-only flags and unreadable regions before sending to stage 2. */
export function forStudyPack(artifact: BoardArtifact) {
  return {
    title: artifact.title,
    detectedLanguages: artifact.detectedLanguages,
    imageQuality: artifact.imageQuality,
    regions: artifact.regions
      .filter((r) => !r.unreadable)
      .map((r) => ({
        id: r.id,
        order: r.order,
        type: r.type,
        transcription: r.transcription,
        confidence: r.confidence,
        uncertainSpans: r.uncertainSpans,
        languageTags: r.languageTags,
      })),
    codeBlocks: artifact.codeBlocks,
  };
}
