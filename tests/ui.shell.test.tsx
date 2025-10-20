import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ThemeProvider from '../src/components/theme-provider';
import HomeContent from '../src/components/home-content';

const mockArticle = {
  title: 'Test Title',
  url: 'https://en.wikipedia.org/wiki/Test_Title',
  html: '<p>Hello <strong>world</strong>.</p>',
  text: 'Hello world.',
  description: 'A test page',
};

function AppTestWrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient();
  return (
    <ThemeProvider>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('App shell', () => {
  it('fetches and displays a random article', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify(mockArticle), { status: 200 }));
    render(<HomeContent />, { wrapper: AppTestWrapper });
    // title shows
    expect(await screen.findByText('Test Title')).toBeInTheDocument();
    // html content shows (text extracted from innerHTML)
    expect(screen.getByText('Hello world.', { exact: false })).toBeInTheDocument();
  });

  it('opens About dialog from the menu', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify(mockArticle), { status: 200 }));
    render(<HomeContent />, { wrapper: AppTestWrapper });

    // open menu
    const menuButton = await screen.findByRole('button', { name: /menu/i });
    menuButton.click();

    // open About
    const aboutItem = await screen.findByRole('menuitem', { name: /about/i });
    aboutItem.click();

    // dialog should appear
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/text from wikipedia/i)).toBeInTheDocument();
  });

  it('toggles dark mode from the menu', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify(mockArticle), { status: 200 }));
    render(<HomeContent />, { wrapper: AppTestWrapper });

    // open menu
    const menuButton = await screen.findByRole('button', { name: /menu/i });
    menuButton.click();

    const toggle = await screen.findByRole('switch', { name: /dark mode/i });
    // ensure starts off
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // toggle on
    (toggle as HTMLButtonElement).click();

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });
});
