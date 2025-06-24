import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const SORT_LABELS = {
  date: "Дате",
  title: "Названию", 
  status: "Статусу",
};

interface SurveySortMenuProps {
  sortBy: keyof typeof SORT_LABELS;
  sortDirection: 'asc' | 'desc';
  onSortChange: (sortBy: keyof typeof SORT_LABELS, direction: 'asc' | 'desc') => void;
}

export function SurveySortMenu({ sortBy, sortDirection, onSortChange }: SurveySortMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Сортировка: {SORT_LABELS[sortBy]} {sortDirection === 'asc' ? '↑' : '↓'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onSortChange('date', 'asc')}>
          Дате {sortBy === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange('title', 'asc')}>
          Названию {sortBy === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange('status', 'asc')}>
          Статусу {sortBy === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 