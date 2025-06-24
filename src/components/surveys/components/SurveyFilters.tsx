import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Filter } from 'lucide-react';

interface SurveyFiltersProps {
  statusFilter: 'all' | 'published' | 'draft';
  onStatusFilterChange: (status: 'all' | 'published' | 'draft') => void;
}

export function SurveyFilters({ statusFilter, onStatusFilterChange }: SurveyFiltersProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-1">
          <Filter className="h-4 w-4" /> Фильтры
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="p-2">
          <div className="font-medium mb-2">Статус</div>
          <div className="space-y-2">
            {(['all', 'published', 'draft'] as ('all' | 'published' | 'draft')[]).map(status => (
              <div key={status} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status}`}
                  checked={statusFilter === status}
                  onCheckedChange={() => onStatusFilterChange(status)}
                />
                <Label htmlFor={`status-${status}`} className="capitalize">
                  {status === 'all' ? 'Все опросы' : status === 'published' ? 'Опубликованные' : 'Черновики'}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 