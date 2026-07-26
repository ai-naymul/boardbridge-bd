import { GoogleGenAI } from '@google/genai';
import type { ZodType } from 'zod';

/**
 * The ONLY module that touches the Gemini API or reads the API key.
 * Keeping it to one file makes the "no secret reaches the client" audit a one-file check.
 */

export const GEMMA_MODEL = process.env.GEMMA_MODEL || 'gemma-4-31b-it';
/**
 * Measured: a dense board takes 18-70s on gemma-4-31b-it depending on how much the model
 * thinks. 'minimal' thinking keeps typical extraction near 20s; the ceiling is generous so a
 * slow-but-succeeding call is not killed just short of the finish line.
 */
const TIMEOUT_MS = 150_000;

function client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GemmaError('missing_key', 'Server is not configured with an API key.');
  return new GoogleGenAI({ apiKey });
}

export class GemmaError extends Error {
  constructor(
    public code:
      | 'missing_key'
      | 'timeout'
      | 'upstream'
      | 'unparseable'
      | 'schema_invalid'
      | 'quota',
    message: string
  ) {
    super(message);
  }
}

/**
 * Decode the FIRST complete JSON value in the response and ignore anything after it.
 *
 * Gemma occasionally appends trailing prose or wraps the object in a single-element array,
 * which makes a bare JSON.parse fail on otherwise-good output. This is a structural decode
 * using a brace/bracket scanner that respects string literals and escapes — deliberately NOT
 * a regex scrape of "something that looks like JSON".
 */
export function firstJsonValue(raw: string): unknown {
  let s = raw.trim();
  if (s.startsWith('```')) {
    const nl = s.indexOf('\n');
    if (nl !== -1) s = s.slice(nl + 1);
    const fence = s.lastIndexOf('```');
    if (fence !== -1) s = s.slice(0, fence);
    s = s.trim();
  }

  const candidates = [s.indexOf('{'), s.indexOf('[')].filter((i) => i !== -1);
  if (candidates.length === 0) throw new GemmaError('unparseable', 'Model returned no JSON.');
  const start = Math.min(...candidates);

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      if (inString) escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0) {
        const slice = s.slice(start, i + 1);
        let parsed: unknown;
        try {
          parsed = JSON.parse(slice);
        } catch {
          throw new GemmaError('unparseable', 'Model returned malformed JSON.');
        }
        if (Array.isArray(parsed)) {
          const obj = parsed.find((x) => x && typeof x === 'object' && !Array.isArray(x));
          if (!obj) throw new GemmaError('unparseable', 'Model returned an array with no object.');
          return obj;
        }
        return parsed;
      }
    }
  }
  throw new GemmaError('unparseable', 'Model returned truncated JSON.');
}

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

interface CallOpts<T> {
  parts: Part[];
  systemInstruction: string;
  jsonSchema: object;
  schema: ZodType<T>;
  label: string;
}

async function generate(
  parts: Part[],
  systemInstruction: string,
  jsonSchema: object | null
): Promise<string> {
  const ai = client();
  const config: Record<string, unknown> = {
    systemInstruction,
    temperature: 0,
    responseMimeType: 'application/json',
    // Transcription is a perception task, not a reasoning task — spending thought tokens on it
    // only adds latency. Measured ~3x faster with no loss in transcription fidelity.
    thinkingConfig: { thinkingLevel: 'minimal' },
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
  };
  // Tier A: full JSON schema. Tier B (jsonSchema === null): mime type only, used by the
  // repair retry so a schema the model struggled with cannot deadlock the repair.
  if (jsonSchema) config.responseJsonSchema = jsonSchema;

  let res;
  try {
    res = await ai.models.generateContent({
      model: GEMMA_MODEL,
      contents: [{ role: 'user', parts }],
      config,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/abort|timeout/i.test(msg)) {
      throw new GemmaError('timeout', 'Gemma took longer than expected. Try a smaller image.');
    }
    if (/quota|rate|429|resource_exhausted/i.test(msg)) {
      throw new GemmaError('quota', 'Gemma API quota reached. Wait a moment and retry.');
    }
    throw new GemmaError('upstream', `Gemma API error: ${msg.slice(0, 200)}`);
  }

  const text = res.text ?? '';
  if (!text.trim()) throw new GemmaError('unparseable', 'Gemma returned an empty response.');
  return text;
}

/**
 * Call Gemma, parse structurally, validate with Zod. On validation failure, exactly ONE
 * repair round-trip that shows the model its own output and the validation error. A second
 * failure surfaces an honest error — we never fabricate a result to fill the gap.
 */
export async function callGemma<T>({
  parts,
  systemInstruction,
  jsonSchema,
  schema,
  label,
}: CallOpts<T>): Promise<{ data: T; latencyMs: number; repaired: boolean }> {
  const t0 = Date.now();

  const raw = await generate(parts, systemInstruction, jsonSchema);
  const first = schema.safeParse(firstJsonValue(raw));
  if (first.success) {
    return { data: first.data, latencyMs: Date.now() - t0, repaired: false };
  }

  console.warn(
    JSON.stringify({ label, model: GEMMA_MODEL, event: 'repair_retry', issues: first.error.issues.length })
  );

  const repairPrompt = [
    'Your previous response did not validate against the required schema.',
    'Validation errors:',
    JSON.stringify(first.error.issues.slice(0, 12), null, 2),
    'Your previous response:',
    raw.slice(0, 6000),
    'Return the SAME content, corrected to satisfy the schema. JSON only, nothing else.',
    'Do not invent new content to fill required fields — use empty strings or empty arrays.',
  ].join('\n\n');

  const repaired = await generate([{ text: repairPrompt }], systemInstruction, null);
  const second = schema.safeParse(firstJsonValue(repaired));
  if (second.success) {
    return { data: second.data, latencyMs: Date.now() - t0, repaired: true };
  }

  throw new GemmaError(
    'schema_invalid',
    'Gemma returned data that did not match the expected structure, twice. Please retry.'
  );
}
