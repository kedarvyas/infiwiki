'use client';

import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';

export const CATEGORIES = [
  { id: null, name: 'All Topics', value: null },
  { id: 'science', name: 'Science', value: 'Science' },
  { id: 'sports', name: 'Sports', value: 'Sports' },
] as const;

interface CategorySelectorProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export default function CategorySelector({ selectedCategory, onCategoryChange }: CategorySelectorProps) {
  const currentCategory = CATEGORIES.find(c => c.value === selectedCategory) || CATEGORIES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          {currentCategory.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {CATEGORIES.map(category => (
          <DropdownMenuItem
            key={category.id || 'all'}
            onClick={() => onCategoryChange(category.value)}
          >
            {category.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
