// src/lib/api.client.ts
export type Article = {
    title: string;
    url: string;          // canonical wikipedia url
    html: string;         // sanitized HTML
    text: string;         // plain text
    description?: string;
};


async function parseOrText(res: Response) {
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
        try { return await res.json() } catch { /* fall through */ }
    }
    return await res.text()
}

async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(path, { cache: 'no-store', ...init })
    const body = await parseOrText(res)
    if (!res.ok) {
        const msg = typeof body === 'string' ? body : JSON.stringify(body)
        throw new Error(`GET ${path} → ${res.status}: ${msg}`)
    }
    // If server returned a wrapped payload, unwrap here (adjust if needed)
    return body as T
}

export async function apiGetRandom(category?: string, signal?: AbortSignal) {
    // Add timestamp to prevent caching
    const timestamp = Date.now()
    const url = category
        ? `/api/wiki/random?category=${encodeURIComponent(category)}&t=${timestamp}`
        : `/api/wiki/random?t=${timestamp}`;
    return getJSON<Article>(url, { signal })
}

export async function apiGetByTitle(title: string, signal?: AbortSignal) {
    const safe = encodeURIComponent(title)
    return getJSON<Article>(`/api/wiki/${safe}`, { signal })
}

export async function apiSearchTitle(phrase: string, signal?: AbortSignal) {
    console.log('apiSearchTitle: Starting search for:', phrase);
    const safe = encodeURIComponent(phrase)
    const url = `/api/wiki/search?q=${safe}`;
    console.log('apiSearchTitle: Making request to:', url);
    const result = await getJSON<{ title: string }>(url, { signal })
    console.log('apiSearchTitle: Got result:', result);
    return result.title
}
