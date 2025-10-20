'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { apiSearchTitle } from '@/lib/api.client';

type Props = {
  onResolve: (title: string) => void; // parent decides how to handle (append/replace)
};

export default function SelectionNavigator({ onResolve }: Props) {
  const [visible, setVisible] = React.useState(false);
  const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);
  const [phrase, setPhrase] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const handler = () => {
      const sel = window.getSelection?.();
      const text = sel?.toString().trim() ?? '';
      if (!text) {
        setVisible(false);
        return;
      }
      setPhrase(text);
      // Try to anchor near the end of the selection
      let x = window.innerWidth - 96;
      let y = window.innerHeight - 96;
      try {
        const r = sel!.rangeCount ? sel!.getRangeAt(0).getBoundingClientRect() : null;
        if (r && r.x && r.y) {
          x = Math.min(window.innerWidth - 96, Math.max(8, r.right));
          y = Math.min(window.innerHeight - 48, Math.max(8, r.bottom + 6));
        }
      } catch {}
      setPos({ x, y });
      setVisible(true);
    };
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, []);

  const open = async () => {
    if (!phrase) return;
    console.log('SelectionNavigator: Starting search for:', phrase);
    setLoading(true);
    try {
      console.log('SelectionNavigator: Calling apiSearchTitle...');
      const title = await apiSearchTitle(phrase);
      console.log('SelectionNavigator: Got title:', title);
      onResolve(title);
      console.log('SelectionNavigator: Called onResolve with:', title);
    } catch (error) {
      console.error('SelectionNavigator: Error in open():', error);
    } finally {
      setLoading(false);
      setVisible(false);
    }
  };

  if (!visible || !pos) return null;
  return (
    <div
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 60 }}
      className="translate-x-[-90%]"
    >
      <Button size="sm" onClick={open} aria-label="Open">
        {loading ? '…' : 'Open ↗'}
      </Button>
    </div>
  );
}
