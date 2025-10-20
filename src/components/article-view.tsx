'use client';
import React from 'react';
import type { Article } from '@/lib/wiki.types';

export default function ArticleView({ article }: { article: Article }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  return (
    <article
      className={[
        'max-w-3xl mx-auto px-4 py-8 transition-opacity duration-500',
        mounted ? 'opacity-100' : 'opacity-0'
      ].join(' ')}
    >
      <h1 className="text-2xl md:text-3xl font-semibold mb-2" style={{fontFamily: "'Courier New', 'Monaco', 'Space Mono', 'Consolas', 'Lucida Console', monospace"}}>{article.title}</h1>
      <a
        href={article.url}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-blue-600 dark:text-blue-400 underline mb-4 inline-block"
      >
        View on Wikipedia ↗
      </a>
      <div
        className="prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: article.html }}
      />
    </article>
  );
}
