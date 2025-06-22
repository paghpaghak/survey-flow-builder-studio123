import { ChevronsUpDown } from 'lucide-react';
import { VariableDropdownProps } from '@/types/question.types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Question, QUESTION_TYPES } from '@survey-platform/shared-types';
import { createVariablePlaceholder } from '@/utils/questionUtils';

/**
 * <summary>
 * Выпадающий список для вставки переменных (ссылок на другие вопросы) в описания.
 * Фильтрует вопросы, исключая параллельные группы и текущий вопрос.
 * </summary>
 */
export const VariableDropdown = ({
  availableQuestions,
  onVariableSelect,
}: VariableDropdownProps) => {
  if (!availableQuestions || availableQuestions.length === 0) {
    return null;
  }

  // Фильтруем вопросы: исключаем параллельные группы
  const filteredQuestions = availableQuestions.filter(
    q => q.type !== QUESTION_TYPES.ParallelGroup
  );

  /**
   * Обработчик вставки переменной
   */
  const handleInsertVariable = (questionId: string) => {
    const placeholder = createVariablePlaceholder(questionId);
    onVariableSelect(placeholder);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          size="sm" 
          variant="outline" 
          type="button" 
          disabled={filteredQuestions.length === 0}
        >
          Вставить переменную
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-60 overflow-y-auto w-64">
        {filteredQuestions.length === 0 ? (
          <div className="px-2 py-1 text-sm text-gray-500">
            Нет доступных вопросов для вставки
          </div>
        ) : (
          filteredQuestions.map(question => (
            <DropdownMenuItem
              key={question.id}
              onClick={() => handleInsertVariable(question.id)}
              className="cursor-pointer"
            >
              <div className="flex flex-col items-start">
                <span className="font-medium truncate max-w-full">
                  {question.title}
                </span>
                <span className="text-xs text-gray-500">
                  {question.type}
                </span>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}