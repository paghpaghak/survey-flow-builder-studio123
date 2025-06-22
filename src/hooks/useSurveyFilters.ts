import { useState, useMemo } from 'react';
import type { Survey, SurveyStatus } from '@survey-platform/shared-types';

type SortByType = 'date' | 'title' | 'status';
type SortDirectionType = 'asc' | 'desc';
type StatusFilterType = 'all' | 'published' | 'draft';

export function useSurveyFilters(initialSurveys: Survey[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortByType>('date');
  const [sortDirection, setSortDirection] = useState<SortDirectionType>('desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');

  const filteredAndSortedSurveys = useMemo(() => {
    const filtered = initialSurveys.filter(survey => {
      const matchesSearch = survey.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || survey.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = b.updatedAt || b.createdAt; // Note: sorting descending by default
        const dateB = a.updatedAt || a.createdAt;
        return sortDirection === 'asc'
          ? new Date(dateB).getTime() - new Date(dateA).getTime()
          : new Date(dateA).getTime() - new Date(dateB).getTime();
      } else if (sortBy === 'title') {
        return sortDirection === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      } else { // sortBy === 'status'
        return sortDirection === 'asc'
          ? (a.status || '').localeCompare(b.status || '')
          : (b.status || '').localeCompare(a.status || '');
      }
    });

    return sorted;
  }, [initialSurveys, searchQuery, statusFilter, sortBy, sortDirection]);

  return {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    statusFilter,
    setStatusFilter,
    filteredAndSortedSurveys,
  };
} 