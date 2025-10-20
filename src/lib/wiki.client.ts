// src/lib/wiki.client.ts
import type { Article } from './wiki.types';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const UA =
  'Infiniwiki/0.1 (https://github.com/youruser/infiniwiki; kedar@example.com)';

function sanitizeHtml(html: string): string {
  const { window } = new JSDOM('');
  const DOMPurify = createDOMPurify(window);

  // Create a temporary DOM to clean up unwanted elements
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Remove citation warning boxes and similar maintenance notices
  const unwantedSelectors = [
    '.ambox',           // Article message boxes (citations needed, etc.)
    '.mbox-small',      // Small message boxes
    '.navbox',          // Navigation boxes
    '.metadata',        // Metadata boxes
    '.noprint',         // Content marked as "don't print"
    '.sistersitebox',   // Sister site boxes
    '.dablink',         // Disambiguation links
    '.hatnote',         // Hat notes
    '[role="note"]',    // Semantic notes
    '.mw-empty-elt',    // Empty MediaWiki elements
    '.mw-editsection',  // Edit section links
    'figure:empty',     // Empty figure elements
    'div:empty',        // Empty div elements that might be image placeholders
    '.thumb:empty',     // Empty thumbnail containers
    '.mw-file-description', // File descriptions
    'table[class*="infobox"]' // Infoboxes (optional - remove if too aggressive)
  ];

  unwantedSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el: Element) => el.remove());
  });

  // Remove elements that only contain whitespace
  const allElements = document.querySelectorAll('*');
  allElements.forEach((el: Element) => {
    if (!el.textContent?.trim() && !el.querySelector('img, video, audio, canvas, svg')) {
      el.remove();
    }
  });

  // Fix internal Wikipedia links to prevent 404s
  const links = document.querySelectorAll('a[href]');
  links.forEach((link: Element) => {
    const anchor = link as HTMLAnchorElement;
    const href = anchor.getAttribute('href') || '';

    // Check for various Wikipedia link formats
    if (href.startsWith('/wiki/') ||
        href.startsWith('./') ||
        (href.startsWith('/') && !href.startsWith('//') && !href.includes('://'))) {
      // Convert to external Wikipedia link that opens in new tab
      let title = href.replace(/^(\/wiki\/|\.\/|\/)/g, '');
      // Handle URL encoding if needed
      title = decodeURIComponent(title);
      anchor.setAttribute('href', `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`);
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
    } else if (href.startsWith('#')) {
      // Remove anchor links entirely (they don't work in our context)
      anchor.removeAttribute('href');
      anchor.style.cursor = 'default';
      anchor.style.textDecoration = 'none';
    } else if (!href.includes('://') && !href.startsWith('mailto:')) {
      // Any other relative links that might cause 404s - convert to Wikipedia
      const title = href.replace(/^\/+/g, ''); // Remove leading slashes
      if (title && title.length > 0) {
        anchor.setAttribute('href', `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`);
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noopener noreferrer');
      } else {
        // If we can't determine the title, remove the link
        anchor.removeAttribute('href');
        anchor.style.cursor = 'default';
        anchor.style.textDecoration = 'none';
      }
    }
  });

  const cleanedHtml = document.body.innerHTML;
  return DOMPurify.sanitize(cleanedHtml, { USE_PROFILES: { html: true } });
}

function htmlToText(html: string): string {
  const dom = new JSDOM(html);
  return dom.window.document.body.textContent?.trim() ?? '';
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return (await res.json()) as T;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html',
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return await res.text();
}

// Normalize a title for REST API usage
function normalizeTitle(raw: string): string {
  return raw.trim().replace(/\s+/g, '_'); // CHANGED: spaces → underscores
}

/**
 * Build a normalized Article from a Wikipedia title.
 * Uses:
 *  - Summary (JSON): https://en.wikipedia.org/api/rest_v1/page/summary/{title}  (CHANGED)
 *  - Mobile HTML:    https://en.wikipedia.org/api/rest_v1/page/mobile-html/{title}
 */
async function buildArticleFromTitle(title: string): Promise<Article> {
  const safe = normalizeTitle(title);
  const encoded = encodeURIComponent(safe);

  type Summary = {
    title: string;
    description?: string;
    content_urls?: {
      desktop?: { page?: string };
      mobile?: { page?: string };
    };
  };

  // CHANGED: use RESTBase summary endpoint (more tolerant)
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
  const summary = await fetchJSON<Summary>(summaryUrl);

  const mobileHtmlUrl = `https://en.wikipedia.org/api/rest_v1/page/mobile-html/${encoded}`;
  const rawHtml = await fetchText(mobileHtmlUrl);

  const html = sanitizeHtml(rawHtml);
  const text = htmlToText(html);

  const url =
    summary.content_urls?.desktop?.page ??
    `https://en.wikipedia.org/wiki/${encodeURIComponent(summary.title || safe)}`;

  return {
    title: summary.title || title,
    url,
    html,
    text,
    description: summary.description,
  };
}

export async function getArticleByTitle(title: string): Promise<Article> {
  if (!title || !title.trim()) {
    throw new Error('Title is required');
  }
  return buildArticleFromTitle(title);
}

export async function getRandomArticle(): Promise<Article> {
  type RandomSummary = { title: string };
  const rand = await fetchJSON<RandomSummary>(
    'https://en.wikipedia.org/api/rest_v1/page/random/summary'
  );
  return buildArticleFromTitle(rand.title);
}

export async function searchTitle(phrase: string): Promise<string> {
  const q = (phrase || '').trim();
  if (!q) throw new Error('Phrase is required');

  type SearchResponse = { query?: { search?: Array<{ title: string }> } };
  const url =
    'https://en.wikipedia.org/w/api.php' +
    `?action=query&list=search&srsearch=${encodeURIComponent(q)}` +
    '&format=json&origin=*' +
    '&srlimit=1';

  const data = await fetchJSON<SearchResponse>(url);
  const best = data.query?.search?.[0]?.title;
  return best || q;
}

/**
 * Get articles from a category (including subcategories recursively)
 * Returns a list of article titles from the category
 */
async function getArticlesFromCategory(
  category: string,
  maxArticles: number = 50,
  maxDepth: number = 1
): Promise<string[]> {
  const articles: Set<string> = new Set();
  const visitedCategories: Set<string> = new Set();

  async function fetchFromCategory(cat: string, depth: number): Promise<void> {
    if (depth > maxDepth || visitedCategories.has(cat) || articles.size >= maxArticles) {
      return;
    }

    visitedCategories.add(cat);

    type CategoryMembersResponse = {
      query?: {
        categorymembers?: Array<{ title: string; ns: number }>;
      };
    };

    try {
      // Get pages (articles) from this category
      const pagesUrl =
        'https://en.wikipedia.org/w/api.php' +
        `?action=query&list=categorymembers&cmtitle=Category:${encodeURIComponent(cat)}` +
        '&cmtype=page&cmnamespace=0&cmlimit=50&format=json&origin=*';

      const pagesData = await fetchJSON<CategoryMembersResponse>(pagesUrl);
      const pages = pagesData.query?.categorymembers || [];

      pages.forEach(page => {
        if (articles.size < maxArticles) {
          articles.add(page.title);
        }
      });

      // If we don't have enough articles yet, get from subcategories
      if (articles.size < maxArticles && depth < maxDepth) {
        const subcatsUrl =
          'https://en.wikipedia.org/w/api.php' +
          `?action=query&list=categorymembers&cmtitle=Category:${encodeURIComponent(cat)}` +
          '&cmtype=subcat&cmlimit=5&format=json&origin=*';

        const subcatsData = await fetchJSON<CategoryMembersResponse>(subcatsUrl);
        const subcats = subcatsData.query?.categorymembers || [];

        // Process subcategories
        for (const subcat of subcats) {
          if (articles.size >= maxArticles) break;
          const subcatName = subcat.title.replace(/^Category:/, '');
          await fetchFromCategory(subcatName, depth + 1);
        }
      }
    } catch (error) {
      console.error(`Error fetching category ${cat}:`, error);
      // Continue even if one category fails
    }
  }

  await fetchFromCategory(category, 0);
  return Array.from(articles);
}

/**
 * Get a random article from a specific category
 */
export async function getRandomArticleFromCategory(category: string): Promise<Article> {
  const articles = await getArticlesFromCategory(category, 50, 1);

  if (articles.length === 0) {
    throw new Error(`No articles found in category: ${category}`);
  }

  // Pick a random article
  const randomTitle = articles[Math.floor(Math.random() * articles.length)];
  return buildArticleFromTitle(randomTitle);
}
