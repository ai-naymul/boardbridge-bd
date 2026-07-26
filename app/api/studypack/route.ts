import { NextResponse } from 'next/server';
import { callGemma, GemmaError, GEMMA_MODEL } from '@/lib/gemma';
import { STUDYPACK_SYSTEM } from '@/lib/prompts';
import { BoardArtifactSchema, StudyPackSchema, STUDY_PACK_JSON_SCHEMA } from '@/lib/schemas';
import { crossCheckSourceRegions, forStudyPack } from '@/lib/validate';
import { rateLimit, clientIp } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: Request) {
  const t0 = Date.now();
  const limit = rateLimit(clientIp(req));
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${limit.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  let raw: unknown;
  try {
    raw = (await req.json())?.artifact;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = BoardArtifactSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Verified board data is malformed.' }, { status: 400 });
  }
  const artifact = parsed.data;

  const usable = artifact.regions.filter((r) => !r.unreadable);
  if (usable.length === 0) {
    return NextResponse.json(
      {
        error:
          'No readable regions remain on this board, so there is nothing to build a study pack from.',
        code: 'no_content',
      },
      { status: 422 }
    );
  }

  try {
    const { data, latencyMs, repaired } = await callGemma({
      label: 'studypack',
      systemInstruction: STUDYPACK_SYSTEM,
      jsonSchema: STUDY_PACK_JSON_SCHEMA,
      schema: StudyPackSchema,
      // The image is deliberately NOT resent. Stage 2 sees only the human-verified transcript,
      // which is what makes the student's corrections authoritative.
      parts: [{ text: JSON.stringify(forStudyPack(artifact), null, 2) }],
    });

    const checked = crossCheckSourceRegions(data, artifact);

    console.log(
      JSON.stringify({
        route: 'studypack',
        status: 200,
        model: GEMMA_MODEL,
        latencyMs,
        totalMs: Date.now() - t0,
        flashcards: checked.flashcards.length,
        unsupported: [...checked.keyTerms, ...checked.codeBlocks, ...checked.flashcards].filter(
          (i) => i.unsupported
        ).length,
        repaired,
      })
    );

    return NextResponse.json({ pack: checked, meta: { model: GEMMA_MODEL, latencyMs, repaired } });
  } catch (err) {
    const code = err instanceof GemmaError ? err.code : 'upstream';
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    const status = code === 'quota' ? 429 : code === 'timeout' ? 504 : 502;
    console.error(
      JSON.stringify({ route: 'studypack', status, model: GEMMA_MODEL, code, totalMs: Date.now() - t0 })
    );
    return NextResponse.json({ error: message, code }, { status });
  }
}
