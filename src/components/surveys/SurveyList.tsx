import React from 'react';
import type { Survey } from '@survey-platform/shared-types';
import { CreateSurveyDialog } from './CreateSurveyDialog';
import { EditSurveyDialog } from './EditSurveyDialog';
import { useSurveyListLogic } from './hooks/useSurveyListLogic';
import {
  SurveySearchBar,
  SurveyFilters,
  SurveySortMenu,
  SurveyTable,
  SurveyEmptyState
} from './components';

interface SurveyListProps {
  surveys: Survey[];
  reloadSurveys?: () => void;
  onSurveyCreated?: () => void;
}

export function SurveyList({ surveys, reloadSurveys, onSurveyCreated }: SurveyListProps) {
  const {
    // Состояние
    isAdmin,
    showDeleteDialog,
    setShowDeleteDialog,
    editingSurvey,
    setEditingSurvey,
    
    // Данные
    sortedSurveys,
    
    // Фильтрация и поиск
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    statusFilter,
    setStatusFilter,
    
    // Обработчики
    handleSurveyCreated,
    handleSurveyEdited,
    handleDuplicateSurvey,
    getStatusColor,
    deleteSurvey,
  } = useSurveyListLogic({
    surveys,
    reloadSurveys,
    onSurveyCreated,
  });

  const handleSortChange = (newSortBy: 'date' | 'title' | 'status', direction: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortDirection(direction);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <SurveySearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <SurveyFilters
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />

          <SurveySortMenu
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
          />

          <CreateSurveyDialog 
            onSurveyCreated={handleSurveyCreated}
          />
        </div>
      </div>

      {sortedSurveys.length > 0 ? (
        <SurveyTable
          surveys={sortedSurveys}
          isAdmin={isAdmin}
          showDeleteDialog={showDeleteDialog}
          getStatusColor={getStatusColor}
          handleDuplicateSurvey={handleDuplicateSurvey}
          setShowDeleteDialog={setShowDeleteDialog}
          deleteSurvey={deleteSurvey}
          reloadSurveys={reloadSurveys}
          setEditingSurvey={setEditingSurvey}
        />
      ) : (
        <SurveyEmptyState
          searchQuery={searchQuery}
          statusFilter={statusFilter}
        />
      )}

      {editingSurvey && (
        <EditSurveyDialog
          survey={editingSurvey}
          open={!!editingSurvey}
          onOpenChange={(open) => {
            if (!open) handleSurveyEdited();
          }}
        />
      )}
    </div>
  );
}
