// src/app/api/wiki/[title]/route.ts
import { NextResponse } from 'next/server';
import { getArticleByTitle } from '../../../../lib/wiki.client';

export const runtime = 'nodejs';

export async function GET(_req: Request, ctx: { params: Promise<{ title: string }> }) {
  try {
    const params = await ctx.params;
    const title = params?.title ?? '';
    const article = await getArticleByTitle(decodeURIComponent(title));
    return NextResponse.json(article, {
      status: 200,
      headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate=3600' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
