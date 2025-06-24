import React from 'react';

interface SurveyEmptyStateProps {
  searchQuery: string;
  statusFilter: 'all' | 'published' | 'draft';
}

export function SurveyEmptyState({ searchQuery, statusFilter }: SurveyEmptyStateProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-8 text-center">
      <p className="text-lg font-medium text-gray-500 mb-4">Опросы не найдены</p>
      {(searchQuery || statusFilter !== 'all') && (
        <p className="text-gray-400 mb-6">
          Попробуйте изменить условия поиска или фильтры
        </p>
      )}
    </div>
  );
} 