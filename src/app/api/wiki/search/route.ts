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
      headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate=3600' },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
