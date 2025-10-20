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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
