import { QuestionOptionsEditorProps } from '@survey-platform/shared-types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash } from 'lucide-react';
import { createNewOption } from '@/utils/questionUtils';
import { PLACEHOLDERS } from '@survey-platform/shared-types';

/**
 * <summary>
 * Компонент для редактирования вариантов ответов для вопросов типа Radio, Checkbox, Select.
 * Поддерживает добавление, удаление и редактирование вариантов с валидацией.
 * </summary>
 */
export function QuestionOptionsEditor({ 
  options, 
  onChange, 
  readOnly = false,
  errors = {}
}: QuestionOptionsEditorProps) {
  
  /**
   * Обновляет текст конкретного варианта
   */
  const updateOption = (optionId: string, text: string) => {
    const updatedOptions = options.map(opt => 
      opt.id === optionId ? { ...opt, text } : opt
    );
    onChange(updatedOptions);
  };

  /**
   * Добавляет новый вариант после указанного индекса
   */
  const addOption = (afterIndex: number) => {
    const newOption = createNewOption();
    const newOptions = [
      ...options.slice(0, afterIndex + 1),
      newOption,
      ...options.slice(afterIndex + 1)
    ];
    onChange(newOptions);
  };

  /**
   * Удаляет вариант по ID (если больше одного варианта)
   */
  const removeOption = (optionId: string) => {
    if (options.length > 1) {
      const filteredOptions = options.filter(opt => opt.id !== optionId);
      onChange(filteredOptions);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Варианты ответов</Label>
      
      <div className="space-y-2 max-h-60 overflow-y-auto rounded border bg-muted px-2 py-2">
        {options.map((option, idx) => (
          <div key={option.id} className="flex items-center gap-2">
            <Input
              value={option.text}
              onChange={(e) => updateOption(option.id, e.target.value)}
              className={`flex-1 ${errors.options ? 'border-red-500' : ''}`}
              disabled={readOnly}
              placeholder={PLACEHOLDERS.OPTION_TEXT}
            />
            
            {!readOnly && (
              <>
                {/* Кнопка добавления варианта */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => addOption(idx)}
                  title="Добавить вариант после этого"
                  className="text-green-600 hover:text-green-700"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                
                {/* Кнопка удаления варианта */}
                <button
                  onClick={() => removeOption(option.id)}
                  title="Удалить вариант"
                  disabled={options.length === 1}
                  className="text-red-600 hover:text-red-700 disabled:text-gray-400 p-1 transition-colors"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      
      {errors.options && (
        <p className="text-sm text-red-500 mt-1">{errors.options}</p>
      )}
    </div>
  );
}