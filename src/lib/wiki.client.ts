// src/lib/wiki.client.ts
import type { Article } from './wiki.types';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const UA =
  'Infiwiki/0.1 (https://github.com/youruser/infiwiki; kedar@example.com)';

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

  // Fetch both in parallel for faster loading
  const [summary, rawHtml] = await Promise.all([
    fetchJSON<Summary>(`https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`),
    fetchText(`https://en.wikipedia.org/api/rest_v1/page/mobile-html/${encoded}`)
  ]);

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
  maxArticles: number = 100,
  maxDepth: number = 2
): Promise<string[]> {
  const articles: Set<string> = new Set();
  const visitedCategories: Set<string> = new Set();

  // Filter to exclude meta/list articles and other redundant pages
  const isValidArticle = (title: string): boolean => {
    const lower = title.toLowerCase();

    // Exclude list pages, index pages, glossaries, outlines, timelines
    if (lower.startsWith('list of ')) return false;
    if (lower.startsWith('lists of ')) return false;
    if (lower.startsWith('index of ')) return false;
    if (lower.startsWith('glossary of ')) return false;
    if (lower.startsWith('outline of ')) return false;
    if (lower.startsWith('timeline of ')) return false;
    if (lower.startsWith('bibliography of ')) return false;
    if (lower.startsWith('history of ')) return false;

    // Exclude year-based and century-based articles
    // e.g., "1784 in sports", "2023 in technology"
    if (/^\d{3,4}\s+in\s+/.test(lower)) return false;
    // e.g., "1990s in...", "2000s in..."
    if (/^\d{3,4}s\s+in\s+/.test(lower)) return false;
    // e.g., "37th century BC", "21st century", "3rd century AD"
    if (/^\d+(st|nd|rd|th)\s+century/.test(lower)) return false;
    // e.g., "AD 100", "100 BC"
    if (/^(ad|bc)\s+\d+/.test(lower)) return false;
    if (/^\d+\s+(ad|bc)/.test(lower)) return false;

    // Exclude "[topic] in [country/region]" pattern
    // e.g., "Telecommunications in Honduras", "Education in France", "Sports in Japan"
    if (/\s+in\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(title)) {
      // Check if it matches the pattern of a topic followed by location
      const parts = title.split(' in ');
      if (parts.length === 2) {
        // Common infrastructure/topic words that indicate these generic pages
        const genericTopics = [
          'telecommunications', 'education', 'transport', 'healthcare', 'economy',
          'politics', 'media', 'religion', 'culture', 'agriculture', 'energy',
          'military', 'communications', 'broadcasting', 'football', 'cricket',
          'basketball', 'rugby', 'athletics', 'science', 'technology'
        ];
        const topic = parts[0].toLowerCase().trim();
        if (genericTopics.some(t => topic.includes(t))) {
          return false;
        }
      }
    }

    // Exclude other meta pages
    if (lower.startsWith('portal:')) return false;
    if (lower.startsWith('category:')) return false;
    if (lower.startsWith('template:')) return false;
    if (lower.startsWith('wikipedia:')) return false;
    if (lower.startsWith('file:')) return false;
    if (lower.includes('(disambiguation)')) return false;
    if (lower.includes('(overview)')) return false;

    // Exclude chronology and year pages
    if (lower.startsWith('chronology of ')) return false;
    if (lower.endsWith(' chronology')) return false;

    return true;
  };

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
      // Prioritize exploring subcategories first for better content diversity
      if (depth < maxDepth) {
        const subcatsUrl =
          'https://en.wikipedia.org/w/api.php' +
          `?action=query&list=categorymembers&cmtitle=Category:${encodeURIComponent(cat)}` +
          '&cmtype=subcat&cmlimit=15&format=json&origin=*';

        const subcatsData = await fetchJSON<CategoryMembersResponse>(subcatsUrl);
        const subcats = subcatsData.query?.categorymembers || [];

        // Process subcategories to get diverse content
        for (const subcat of subcats) {
          if (articles.size >= maxArticles) break;
          const subcatName = subcat.title.replace(/^Category:/, '');
          await fetchFromCategory(subcatName, depth + 1);
        }
      }

      // Get pages (articles) from this category, but filter out meta pages
      const pagesUrl =
        'https://en.wikipedia.org/w/api.php' +
        `?action=query&list=categorymembers&cmtitle=Category:${encodeURIComponent(cat)}` +
        '&cmtype=page&cmnamespace=0&cmlimit=50&format=json&origin=*';

      const pagesData = await fetchJSON<CategoryMembersResponse>(pagesUrl);
      const pages = pagesData.query?.categorymembers || [];

      pages.forEach(page => {
        if (articles.size < maxArticles && isValidArticle(page.title)) {
          articles.add(page.title);
        }
      });
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
  const articles = await getArticlesFromCategory(category, 100, 2);

  if (articles.length === 0) {
    throw new Error(`No articles found in category: ${category}`);
  }

  // Pick a random article
  const randomTitle = articles[Math.floor(Math.random() * articles.length)];
  return buildArticleFromTitle(randomTitle);
}
