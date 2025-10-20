import { NextResponse } from 'next/server';
import { getRandomArticle } from '../../lib/wiki.client';

export const runtime = 'nodejs';

export async function GET(_req: Request) {
  try {
    const article = await getRandomArticle();
    return NextResponse.json(article, {
      status: 200,
      headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate=3600' },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
