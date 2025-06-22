import type { Question, QuestionOption } from '@survey-platform/shared-types';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';

interface QuestionLogicTabProps {
  transitionRules: ReturnType<typeof import('@/hooks/useTransitionRules').useTransitionRules>;
  options: QuestionOption[];
  availableQuestions: Question[];
  currentQuestionId: string;
  readOnly?: boolean;
}

/**
 * <summary>
 * Компонент вкладки логики переходов между вопросами.
 * Позволяет настраивать правила перехода на основе ответов пользователя.
 * </summary>
 */
export function QuestionLogicTab({
  transitionRules,
  options,
  availableQuestions,
  currentQuestionId,
  readOnly = false
}: QuestionLogicTabProps) {

  // Фильтруем доступные вопросы для переходов
  const availableTargetQuestions = availableQuestions.filter(q => q.id !== currentQuestionId);

  return (
    <TabsContent value="logic" className="flex flex-col h-full">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Заголовок */}
        <div className="flex-shrink-0 mb-4">
          <Label className="text-base font-medium">Правила перехода</Label>
          <p className="text-sm text-gray-500 mt-1">
            Настройте переходы к другим вопросам в зависимости от выбранного ответа
          </p>
        </div>
        
        {/* Список правил */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-2 space-y-2">
          {transitionRules.rules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">Правила перехода не настроены</p>
              <p className="text-sm">Добавьте правило, чтобы настроить логику переходов</p>
            </div>
          ) : (
            transitionRules.rules.map((rule, index) => (
              <div key={rule.id} className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 flex-1">
                  {/* Номер правила */}
                  <span className="text-sm font-medium text-gray-500 w-6">
                    {index + 1}.
                  </span>
                  
                  {/* Если ответ */}
                  <span className="text-sm text-gray-600">Если:</span>
                  <Select 
                    value={rule.answer}
                    onValueChange={value => transitionRules.updateRuleAnswer(rule.id, value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="min-w-[150px]">
                      <SelectValue placeholder="Выберите ответ" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* То перейти к */}
                  <span className="text-sm text-gray-600">→</span>
                  <Select 
                    value={rule.nextQuestionId}
                    onValueChange={value => transitionRules.updateRuleNextQuestion(rule.id, value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="min-w-[200px]">
                      <SelectValue placeholder="Следующий вопрос" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTargetQuestions.map(q => (
                        <SelectItem key={q.id} value={q.id}>
                          {q.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Кнопка удаления */}
                {!readOnly && (
                  <button
                  onClick={() => transitionRules.removeRule(rule.id)}
                  title="Удалить правило"
                  className="text-red-500 hover:text-red-700 p-1 transition-colors"
                >
                  <Trash className="h-4 w-4" />
                </button>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Кнопка добавления правила */}
        {!readOnly && (
          <div className="flex-shrink-0 mt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={transitionRules.addRule}
              disabled={options.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить правило
            </Button>
            {options.length === 0 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Добавьте варианты ответов, чтобы создать правила перехода
              </p>
            )}
          </div>
        )}
      </div>
    </TabsContent>
  );
}