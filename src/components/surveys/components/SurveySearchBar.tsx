import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SurveySearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function SurveySearchBar({ searchQuery, onSearchChange }: SurveySearchBarProps) {
  return (
    <div className="relative w-full sm:w-auto sm:min-w-[300px] flex-1">
      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
      <Input
        placeholder="Поиск опросов..."
        className="pl-8"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
} 