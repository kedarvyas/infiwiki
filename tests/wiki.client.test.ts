// tests/wiki.client.test.ts
import { describe, it, expect } from 'vitest';

// These functions don't exist yet—we'll implement them after the test is green-lit.
import { getArticleByTitle, getRandomArticle, searchTitle } from '../src/lib/wiki.client';
import type { Article } from '../src/lib/wiki.types';

function assertArticleShape(a: Article) {
  expect(a.title).toBeTruthy();
  expect(a.url).toMatch(/^https:\/\/en\.wikipedia\.org\/wiki\/.+/);
  expect(typeof a.html).toBe('string');
  expect(a.html.length).toBeGreaterThan(0);
  expect(typeof a.text).toBe('string');
  expect(a.text.length).toBeGreaterThan(50);
}

describe('wiki client contract', () => {
  it('returns a normalized Article by title', async () => {
    const a = await getArticleByTitle('Alan Turing');
    expect(a.title).toBe('Alan Turing');
    assertArticleShape(a);
    if (a.description) expect(a.description.length).toBeGreaterThan(0);
  });

  it('returns a normalized Article from random', async () => {
    const a = await getRandomArticle();
    assertArticleShape(a);
  });

  it('searchTitle resolves a phrase to a likely page title', async () => {
    const t = await searchTitle('Turing machine');
    expect(typeof t).toBe('string');
    expect(t.toLowerCase()).toContain('turing');
  });
});
