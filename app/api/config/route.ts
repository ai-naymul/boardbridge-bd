import { NextResponse } from 'next/server';
import { GEMMA_MODEL } from '@/lib/gemma';

export const runtime = 'nodejs';

/** Exposes the active model id to the UI. Deliberately returns nothing else. */
export async function GET() {
  return NextResponse.json({ model: GEMMA_MODEL, configured: Boolean(process.env.GEMINI_API_KEY) });
}
