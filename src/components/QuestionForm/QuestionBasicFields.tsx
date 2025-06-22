import { QuestionBasicFieldsProps } from '@survey-platform/shared-types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { VariableDropdown } from './VariableDropdown';
import { PLACEHOLDERS } from '@/constants/question.constants';

/**
 * <summary>
 * Компонент для редактирования основных полей вопроса (название, описание, обязательность).
 * Включает поддержку вставки переменных в описание и валидацию полей.
 * </summary>
 */
export function QuestionBasicFields({ 
  data, 
  availableQuestions, 
  currentQuestionId,
  onChange, 
  readOnly = false,
  errors = {}
}: QuestionBasicFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Поле заголовка */}
      <div>
        <Label htmlFor="question-title">Заголовок</Label>
        <Input
          id="question-title"
          value={data.title}
          onChange={(e) => onChange('title', e.target.value)}
          disabled={readOnly}
          placeholder={PLACEHOLDERS.QUESTION_TITLE}
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && (
          <p className="text-sm text-red-500 mt-1">{errors.title}</p>
        )}
      </div>

      {/* Поле описания с кнопкой переменных */}
      <div>
        <Label htmlFor="question-description">Описание</Label>
        <div className="flex items-center gap-2 mb-1">
          <VariableDropdown
            availableQuestions={availableQuestions.filter(
              q => q.id !== currentQuestionId
            )}
            onInsert={(placeholder) => onChange('description', data.description + placeholder)}
            disabled={readOnly}
          />
        </div>
        <Input
          id="question-description"
          value={data.description}
          onChange={(e) => onChange('description', e.target.value)}
          disabled={readOnly}
          placeholder={PLACEHOLDERS.QUESTION_DESCRIPTION}
        />
      </div>

      {/* Чекбокс обязательности */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="required"
          checked={data.required}
          onCheckedChange={(checked) => onChange('required', !!checked)}
          disabled={readOnly}
        />
        <Label htmlFor="required">Обязательный вопрос</Label>
      </div>
    </div>
  );
}