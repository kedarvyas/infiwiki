// src/app/api/wiki/search/route.ts
import { NextResponse } from 'next/server';
import { searchTitle } from '../../../../lib/wiki.client';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') ?? '';
    const title = await searchTitle(q);
    return NextResponse.json({ title }, {
      status: 200,
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
