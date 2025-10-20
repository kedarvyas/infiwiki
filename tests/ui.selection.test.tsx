import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ThemeProvider from '../src/components/theme-provider';
import Reader from '../src/components/reader';

const base = {
  url: 'https://en.wikipedia.org/wiki/First_Article',
  html: '<p>First body</p>',
  text: 'First body',
};

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
  // Stub selection
  (global as any).getSelection = () => ({
    toString: () => 'Alan Turing',
    rangeCount: 0,
  });
});

describe('Selection navigation', () => {
  it('shows an Open chip on selection and appends the resolved page', async () => {
    // First random article
    vi.spyOn(global, 'fetch')
      // /api/wiki/random
      .mockResolvedValueOnce(new Response(JSON.stringify({ title: 'First Article', ...base }), { status: 200 }))
      // /api/wiki/search?q=Alan%20Turing
      .mockResolvedValueOnce(new Response(JSON.stringify({ title: 'Alan Turing' }), { status: 200 }))
      // /api/wiki/Alan%20Turing
      .mockResolvedValueOnce(new Response(JSON.stringify({
        title: 'Alan Turing',
        url: 'https://en.wikipedia.org/wiki/Alan_Turing',
        html: '<p>Bio</p>',
        text: 'Bio',
      }), { status: 200 }));

    render(<Reader />, { wrapper: AppWrapper });

    // First article appears
    expect(await screen.findByText('First Article')).toBeInTheDocument();

    // Simulate user selection (fires selectionchange)
    fireEvent(document, new Event('selectionchange'));

    // Chip appears
    const openBtn = await screen.findByRole('button', { name: /open/i });
    openBtn.click();

    // Alan Turing article appended
    await waitFor(() => {
      expect(screen.getByText('Alan Turing')).toBeInTheDocument();
    });
  });
});
