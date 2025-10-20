'use client';

import * as React from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiGetRandom } from '@/lib/api.client';
import ArticleView from './article-view';
import TopMenu from './top-menu';

export default function HomeContent() {
  // In tests we provide QueryClient via wrapper; in app we’ll wrap in layout
  const { data, isLoading, error } = useQuery({
    queryKey: ['randomArticle'],
    queryFn: ({ signal }) => apiGetRandom(signal),
  });

  return (
    <div>
      <TopMenu />
      {isLoading && <div className="p-6 text-center">Loading…</div>}
      {error && <div className="p-6 text-center text-red-600">Failed to load.</div>}
      {data && <ArticleView article={data} />}
    </div>
  );
}
