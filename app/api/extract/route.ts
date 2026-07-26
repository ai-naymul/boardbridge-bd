import { NextResponse } from 'next/server';
import { callGemma, GemmaError, GEMMA_MODEL } from '@/lib/gemma';
import { EXTRACTION_SYSTEM } from '@/lib/prompts';
import { BoardArtifactSchema, BOARD_ARTIFACT_JSON_SCHEMA } from '@/lib/schemas';
import { validateImageInput } from '@/lib/validate';
import { rateLimit, clientIp } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: Request) {
  const t0 = Date.now();
  const ip = clientIp(req);

  const limit = rateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${limit.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  let body: { mimeType?: string; base64?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { mimeType = '', base64 = '' } = body;
  const invalid = validateImageInput(mimeType, base64);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  try {
    const { data, latencyMs, repaired } = await callGemma({
      label: 'extract',
      systemInstruction: EXTRACTION_SYSTEM,
      jsonSchema: BOARD_ARTIFACT_JSON_SCHEMA,
      schema: BoardArtifactSchema,
      parts: [
        { inlineData: { mimeType, data: base64 } },
        {
          text:
            'Transcribe this whiteboard photograph into the BoardArtifact JSON structure. ' +
            'Preserve the Bangla and English exactly as written.',
        },
      ],
    });

    // Normalise ids so downstream referential checks have a stable vocabulary even if the
    // model invents its own id style (it returns "region_1" style ids unprompted).
    const idMap = new Map<string, string>();
    const regions = data.regions.map((r, i) => {
      const id = `r${i + 1}`;
      idMap.set(r.id, id);
      return { ...r, id, order: i };
    });
    const codeBlocks = data.codeBlocks.map((c) => ({
      ...c,
      sourceRegionIds: c.sourceRegionIds.map((s) => idMap.get(s) ?? s).filter((s) => idMap.has(s) || /^r\d+$/.test(s)),
    }));

    console.log(
      JSON.stringify({
        route: 'extract',
        status: 200,
        model: GEMMA_MODEL,
        latencyMs,
        totalMs: Date.now() - t0,
        bytesIn: Math.floor((base64.length * 3) / 4),
        regions: regions.length,
        quality: data.imageQuality,
        repaired,
      })
    );

    return NextResponse.json({
      artifact: { ...data, regions, codeBlocks },
      meta: { model: GEMMA_MODEL, latencyMs, repaired },
    });
  } catch (err) {
    const code = err instanceof GemmaError ? err.code : 'upstream';
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    const status = code === 'quota' ? 429 : code === 'timeout' ? 504 : 502;
    console.error(
      JSON.stringify({ route: 'extract', status, model: GEMMA_MODEL, code, totalMs: Date.now() - t0 })
    );
    return NextResponse.json({ error: message, code }, { status });
  }
}
