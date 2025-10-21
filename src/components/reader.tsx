// src/components/reader.tsx
'use client'
import * as React from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { apiGetRandom, apiGetByTitle, type Article } from '@/lib/api.client'
import ArticleView from './article-view'
import TopMenu from './top-menu'
import SelectionNavigator from './selection-navigator'
import FooterAttribution from './footer-attribution'
import CategorySelector from './category-selector'

export default function Reader() {
  const qc = useQueryClient()
  const seenUrlsRef = React.useRef(new Set<string>())
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)

  // Initialize seenUrlsRef from cache on mount
  React.useEffect(() => {
    const cachedData = qc.getQueryData(['infiniteArticles', selectedCategory]) as { pages: Array<{ url: string }> } | undefined
    if (cachedData?.pages) {
      cachedData.pages.forEach(article => {
        if (article?.url) {
          seenUrlsRef.current.add(article.url)
        }
      })
    }
  }, [qc, selectedCategory])

  const {
    data,
    fetchNextPage,
    isFetchingNextPage,
    status,
    error, // <— capture
  } = useInfiniteQuery({
    queryKey: ['infiniteArticles', selectedCategory],
    queryFn: async ({ signal }) => {
      // Keep fetching until we get a unique article
      let article = await apiGetRandom(selectedCategory || undefined, signal)
      let attempts = 0
      while (seenUrlsRef.current.has(article.url) && attempts < 5) {
        article = await apiGetRandom(selectedCategory || undefined, signal)
        attempts++
      }
      seenUrlsRef.current.add(article.url)
      return article
    },
    getNextPageParam: (_last, pages) => pages.length,
    initialPageParam: 0,
    retry: false, // <— important while debugging
  })

  // Load additional articles on initial load
  React.useEffect(() => {
    if (status === 'success' && data?.pages.length === 1) {
      // Load 2 more articles initially for a total of 3
      Promise.all([
        fetchNextPage(),
        new Promise(resolve => setTimeout(resolve, 150)).then(() => fetchNextPage())
      ])
    }
  }, [status, data?.pages.length, fetchNextPage])

  const sentinelRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!sentinelRef.current) return
    const el = sentinelRef.current
    let pending = false
    const io = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (entry.isIntersecting && !pending && !isFetchingNextPage) {
          pending = true
          // Fetch 2 articles at once for smoother experience
          Promise.all([
            fetchNextPage(),
            new Promise(resolve => setTimeout(resolve, 100)).then(() => fetchNextPage())
          ]).finally(() => { pending = false })
        }
      },
      { rootMargin: '2000px 0px' } // Increased from 1200px for earlier preloading
    )
    io.observe(el)
    return () => io.disconnect()
  }, [fetchNextPage, isFetchingNextPage])

  const pages = data?.pages ?? []

  const [searchQuery, setSearchQuery] = React.useState('')
  const [isSearching, setIsSearching] = React.useState(false)

  // Handle category change - reset everything
  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category)
    seenUrlsRef.current.clear()
    qc.resetQueries({ queryKey: ['infiniteArticles'] })
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim() || isSearching) return

    setIsSearching(true)
    const query = searchQuery
    try {
      console.log('Search: Starting search for:', query);
      // Use the correct function name from API client
      const { apiSearchTitle } = await import('@/lib/api.client')
      const bestTitle = await apiSearchTitle(query)
      console.log('Search: Found title:', bestTitle);

      // Clear search
      setSearchQuery('')

      // Create unique placeholder URL to track this specific search
      const placeholderUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(bestTitle)}#loading-${Date.now()}`

      // Show loading placeholder immediately
      const loadingArticle = {
        title: bestTitle,
        url: placeholderUrl,
        html: '<div class="p-8 text-center text-muted-foreground">Loading article...</div>',
        text: 'Loading...',
        description: 'Loading...'
      }

      // Add loading placeholder to top
      qc.setQueryData(['infiniteArticles', selectedCategory], (old: unknown) => {
        const oldData = old as { pageParams: number[]; pages: typeof loadingArticle[] } | undefined;
        if (!oldData) return { pageParams: [0], pages: [loadingArticle] }
        return {
          ...oldData,
          pageParams: [0, ...oldData.pageParams.map((p: number) => p + 1)],
          pages: [loadingArticle, ...oldData.pages],
        }
      })

      // Scroll to top after state update
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
      }, 0)

      // Fetch full article in background and replace placeholder
      const article = await apiGetByTitle(bestTitle)

      // Replace the specific loading placeholder with actual article
      qc.setQueryData(['infiniteArticles', selectedCategory], (old: unknown) => {
        const oldData = old as { pageParams: number[]; pages: typeof article[] } | undefined;
        if (!oldData) return { pageParams: [0], pages: [article] }

        // Find and replace the specific placeholder by URL
        const pages = oldData.pages.map(page =>
          page.url === placeholderUrl ? article : page
        )

        return {
          ...oldData,
          pages,
        }
      })

      seenUrlsRef.current.add(article.url)
    } catch (error) {
      console.error('Search error:', error)
      // Remove loading placeholder on error - just filter out loading placeholders
      qc.setQueryData(['infiniteArticles', selectedCategory], (old: unknown) => {
        const oldData = old as { pageParams: number[]; pages: Article[] } | undefined;
        if (!oldData || oldData.pages.length === 0) return old

        // Remove any loading placeholders (containing #loading-)
        const pages = oldData.pages.filter(page => !page.url.includes('#loading-'))

        return {
          ...oldData,
          pageParams: oldData.pageParams.slice(0, pages.length),
          pages,
        }
      })
    } finally {
      setIsSearching(false)
    }
  }

  const prependByTitle = async (title: string) => {
    console.log('Reader: prependByTitle called with:', title);
    try {
      console.log('Reader: Calling apiGetByTitle...');
      const article = await apiGetByTitle(title)
      console.log('Reader: Got article:', article?.title);

      // Check if article already exists
      if (seenUrlsRef.current.has(article.url)) {
        console.log('Reader: Article already exists, skipping');
        return
      }

      seenUrlsRef.current.add(article.url)
      qc.setQueryData(['infiniteArticles', selectedCategory], (old: unknown) => {
        const oldData = old as { pageParams: number[]; pages: typeof article[] } | undefined;
        if (!oldData) return { pageParams: [0], pages: [article] }
        return {
          ...oldData,
          pageParams: [0, ...oldData.pageParams.map((p: number) => p + 1)],
          pages: [article, ...oldData.pages], // Add to BEGINNING of array
        }
      })
      console.log('Reader: Article prepended successfully');
    } catch (error) {
      console.error('Reader: Error in prependByTitle:', error);
    }
  }

  const appendByTitle = async (title: string) => {
    console.log('Reader: appendByTitle called with:', title);
    try {
      console.log('Reader: Calling apiGetByTitle...');
      const article = await apiGetByTitle(title)
      console.log('Reader: Got article:', article?.title);

      // Check if article already exists
      if (seenUrlsRef.current.has(article.url)) {
        console.log('Reader: Article already exists, skipping');
        return
      }

      seenUrlsRef.current.add(article.url)
      qc.setQueryData(['infiniteArticles', selectedCategory], (old: unknown) => {
        const oldData = old as { pageParams: number[]; pages: typeof article[] } | undefined;
        if (!oldData) return { pageParams: [0, 1], pages: [article] }
        return {
          ...oldData,
          pageParams: [...oldData.pageParams, oldData.pageParams.length],
          pages: [...oldData.pages, article],
        }
      })
      console.log('Reader: Article appended successfully');
    } catch (error) {
      console.error('Reader: Error in appendByTitle:', error);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <TopMenu />
      {/* Category Selector - aligned with menu */}
      <div className="fixed top-4 right-16 md:right-[calc((100vw-48rem)/2+4rem)] z-50">
        <CategorySelector
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
      </div>
      <div className="max-w-3xl mx-auto px-4">
        {/* Search Box */}
        <div className="pt-6">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isSearching ? "Searching..." : "Search"}
              disabled={isSearching}
              className="w-full max-w-xs px-0 py-2 text-sm bg-transparent border-none outline-none text-foreground placeholder-muted-foreground focus:outline-none disabled:opacity-50"
              style={{fontFamily: "'Courier New', 'Monaco', 'Space Mono', 'Consolas', 'Lucida Console', monospace"}}
            />
          </form>
        </div>
        <header className="pt-10 pb-8 text-center overflow-x-auto">
          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-light text-foreground tracking-wide whitespace-nowrap"
            style={{fontFamily: "'Courier New', 'Monaco', 'Space Mono', 'Consolas', 'Lucida Console', monospace"}}
          >
            I N F I W I K I
          </h1>
        </header>
      </div>
      <div className="space-y-16">
        {status === 'pending' && <div className="p-6 text-center">Loading…</div>}
        {status === 'error' && (
          <div className="p-6 text-center text-red-600">
            Failed to load{error instanceof Error ? `: ${error.message}` : '.'}
          </div>
        )}
        {pages.map((article, idx) => (
          <ArticleView key={(article?.url ?? 'u') + idx} article={article} />
        ))}
        <div ref={sentinelRef} aria-label="sentinel" className="h-10" />
        {isFetchingNextPage && (
          <div className="p-8 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        )}
      </div>
      <SelectionNavigator onResolve={prependByTitle} />
      <FooterAttribution />
    </div>
  )
}
