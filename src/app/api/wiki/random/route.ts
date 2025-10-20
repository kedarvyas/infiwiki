// src/app/api/wiki/random/route.ts
import { NextResponse } from 'next/server';
import { getRandomArticle, getRandomArticleFromCategory } from '../../../../lib/wiki.client'; // relative to this file

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const article = category
      ? await getRandomArticleFromCategory(category)
      : await getRandomArticle();

    return NextResponse.json(article, {
      status: 200,
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, private' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
