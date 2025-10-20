'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ThemeProvider from './theme-provider';

export default function Providers({ children }: { children: React.ReactNode }) {
  // Create the QueryClient on the client side only
  const [client] = React.useState(() => new QueryClient());

  return (
    <ThemeProvider>
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
