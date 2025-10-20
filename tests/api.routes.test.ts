// tests/api.routes.test.ts
import { describe, it, expect } from 'vitest';
import type { Article } from '../src/lib/wiki.types';

// We will import the route handlers AFTER we create them.
// For now, the imports will fail (expected) until you add the files.
import * as ByTitle from '../src/server/handlers/wikiByTitle';
import * as Random from '../src/server/handlers/wikiRandom';
import * as Search from '../src/server/handlers/wikiSearch';


function assertArticleShape(a: Article) {
  expect(a.title).toBeTruthy();
  expect(a.url).toMatch(/^https:\/\/en\.wikipedia\.org\/wiki\/.+/);
  expect(typeof a.html).toBe('string');
  expect(a.html.length).toBeGreaterThan(0);
  expect(typeof a.text).toBe('string');
  expect(a.text.length).toBeGreaterThan(50);
}

describe('API routes', () => {
    it('GET /api/wiki/[title] returns a normalized article', { timeout: 20000 }, async () => {
      const req = new Request('http://localhost/api/wiki/Alan%20Turing');
      // Next.js passes params separately; we emulate that here
      const res = await ByTitle.GET(req as any, { params: { title: 'Alan Turing' } } as any);
      expect(res.status).toBe(200);
      const data = (await res.json()) as Article;
      expect(data.title).toBe('Alan Turing');
      assertArticleShape(data);
    });

    it('GET /api/wiki/random returns a normalized article', { timeout: 20000 }, async () => {
      const req = new Request('http://localhost/api/wiki/random');
      const res = await Random.GET(req as any);
      expect(res.status).toBe(200);
      const data = (await res.json()) as Article;
      assertArticleShape(data);
    });

    it('GET /api/wiki/search?q=... returns a likely title', { timeout: 20000 }, async () => {
      const url = new URL('http://localhost/api/wiki/search');
      url.searchParams.set('q', 'Turing machine');
      const req = new Request(url.toString());
      const res = await Search.GET(req as any);
      expect(res.status).toBe(200);
      const data = (await res.json()) as { title: string };
      expect(typeof data.title).toBe('string');
      expect(data.title.toLowerCase()).toContain('turing');
    });
});
