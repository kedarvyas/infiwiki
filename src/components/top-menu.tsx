'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Moon, Menu } from 'lucide-react';
import * as React from 'react';

export default function TopMenu() {
  const { theme, setTheme } = useTheme();
  const [aboutOpen, setAboutOpen] = React.useState(false);
  const isDark = theme === 'dark';

  const toggleDark = () => setTheme(isDark ? 'light' : 'dark');

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
            <DropdownMenuItem role="menuitem" onClick={toggleDark}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark mode</span>
              <div role="switch" aria-label="Dark mode" aria-checked={isDark} className="sr-only" />
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
