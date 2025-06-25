import { QuestionTypeSelectorProps } from '@survey-platform/shared-types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { QUESTION_TYPE_OPTIONS } from '@survey-platform/shared-types';
import styles from './QuestionTypeSelector.module.css';

/**
 * <summary>
 * Компонент для выбора типа вопроса из выпадающего списка.
 * Поддерживает все доступные типы вопросов с человекочитаемыми названиями.
 * </summary>
 */
export function QuestionTypeSelector({ 
  value, 
  onChange, 
  readOnly = false 
}: QuestionTypeSelectorProps) {
  return (
    <div className={styles.questionTypeSelector}>
      <Label htmlFor="question-type">Тип вопроса</Label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={readOnly}
      >
        <SelectTrigger id="question-type">
          <SelectValue placeholder="Выберите тип вопроса" />
        </SelectTrigger>
        <SelectContent 
          position="popper" 
          side="bottom" 
          align="start" 
          avoidCollisions={false} 
          sideOffset={4} 
          className="max-h-64 overflow-auto z-50"
          style={{ 
            transform: 'translateY(4px)',
            top: 'auto !important',
            bottom: 'auto !important'
          }}
        >
          {QUESTION_TYPE_OPTIONS.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}