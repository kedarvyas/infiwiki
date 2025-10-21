'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Menu } from 'lucide-react';
import * as React from 'react';

const THEMES = ['light', 'dark', 'sage', 'purple'] as const;

export default function TopMenu() {
  const { theme, setTheme } = useTheme();
  const [aboutOpen, setAboutOpen] = React.useState(false);

  const cycleTheme = () => {
    const currentIndex = THEMES.indexOf(theme as typeof THEMES[number]);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setTheme(THEMES[nextIndex]);
  };

  // Get theme color for the button indicator
  const getThemeColor = () => {
    switch (theme) {
      case 'dark': return 'oklch(0.141 0.005 285.823)';
      case 'sage': return 'oklch(0.35 0.06 145)';
      case 'purple': return 'oklch(0.4 0.12 300)';
      default: return 'oklch(1 0 0)';
    }
  };

  return (
    <>
      <div className="fixed top-4 right-4 md:right-[calc((100vw-48rem)/2+1rem)] z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" aria-label="Menu">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Infiwiki</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem role="menuitem" onClick={() => setAboutOpen(true)}>
              About
            </DropdownMenuItem>
            <DropdownMenuItem role="menuitem" onClick={cycleTheme}>
              <div
                className="mr-2 h-4 w-4 rounded-full border-2 transition-colors"
                style={{
                  backgroundColor: getThemeColor(),
                  borderColor: theme === 'light' ? 'oklch(0.141 0.005 285.823)' : getThemeColor()
                }}
              />
              <span>Theme</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>About</DialogTitle>
            <DialogDescription>
              Infiwiki: an infinite-scroll Wikipedia reader. Text from Wikipedia, licensed under CC BY-SA 4.0. Links go to the original source.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <p className="text-sm mt-2">
            Built with Next.js, shadcn/ui, and React Query.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
