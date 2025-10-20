import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ThemeProvider from '../src/components/theme-provider';
import Reader from '../src/components/reader';

const a1 = {
  title: 'First Article',
  url: 'https://en.wikipedia.org/wiki/First_Article',
  html: '<p>First body</p>',
  text: 'First body',
  description: 'A1',
};
const a2 = {
  title: 'Second Article',
  url: 'https://en.wikipedia.org/wiki/Second_Article',
  html: '<p>Second body</p>',
  text: 'Second body',
  description: 'A2',
};

let ioCallback: IntersectionObserverCallback | null = null;

class IOStub {
  constructor(cb: IntersectionObserverCallback) {
    ioCallback = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

function AppWrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient();
  return (
    <ThemeProvider>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  (global as any).IntersectionObserver = IOStub;
});

describe('Reader infinite scroll', () => {
  it('loads the first article and appends another when sentinel intersects', async () => {
    // First /api/wiki/random, then second
    const fetchMock = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify(a1), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(a2), { status: 200 }));

    render(<Reader />, { wrapper: AppWrapper });

    // First article appears
    expect(await screen.findByText('First Article')).toBeInTheDocument();

    // Trigger sentinel intersection
    ioCallback?.([{ isIntersecting: true } as any], {} as any);

    // Second article should appear (append, not replace)
    await waitFor(() => {
      expect(screen.getByText('Second Article')).toBeInTheDocument();
    });

    // Sanity: only two fetches happened
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
