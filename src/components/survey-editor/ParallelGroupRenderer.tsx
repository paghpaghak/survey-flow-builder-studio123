import React from 'react';
import { Question, QUESTION_TYPES, ParallelBranchSettings } from '@survey-platform/shared-types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { renderQuestion } from './utils/questionRenderer';

interface ParallelGroupRendererProps {
  question: Question;
  questions: Question[];
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
  repeatIndexes?: Record<string, number>;
  onRepeatIndexChange?: (questionId: string, index: number) => void;
  mode?: 'preview' | 'taking'; // режим работы - предпросмотр или реальное прохождение
}

/**
 * Компонент для рендеринга параллельных групп вопросов
 * Поддерживает режимы вкладок и последовательного отображения
 */
export function ParallelGroupRenderer({ 
  question, 
  questions, 
  answers, 
  onAnswerChange,
  repeatIndexes,
  onRepeatIndexChange,
  mode = 'preview'
}: ParallelGroupRendererProps) {
  const settings: ParallelBranchSettings = {
    sourceQuestionId: '',
    itemLabel: 'Элемент',
    displayMode: 'tabs', // По умолчанию используем вкладки
    minItems: 1,
    maxItems: 5,
    ...((question.settings || {}) as Partial<ParallelBranchSettings>),
  };

  const countKey = question.id + '_count';
  const count = Number(answers[countKey]) || 0;
  const hasSubQuestions = Array.isArray(question.parallelQuestions) && question.parallelQuestions.length > 0;
  
  // Локальный state для текущей активной вкладки
  const [activeTab, setActiveTab] = React.useState(0);
  const repeatIndex = repeatIndexes?.[question.id] ?? activeTab;

  console.log('[ParallelGroupRenderer] Рендер параллельной группы', { 
    questionId: question.id, 
    count, 
    activeTab, 
    repeatIndex, 
    hasSubQuestions,
    settings,
    mode 
  });

  // Сброс активной вкладки при изменении количества
  React.useEffect(() => {
    if (count > 0 && activeTab >= count) {
      setActiveTab(0);
    }
  }, [count, activeTab]);

  if (hasSubQuestions) {
    question.parallelQuestions?.forEach((qId, idx) => {
      const subQ = questions.find(q => q.id === qId);
      if (subQ) {
        console.log('[ParallelGroupRenderer] Ветка', idx, 'Вопрос:', subQ);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Поле для ввода количества повторений */}
      <div className="space-y-2">
        <Label>{settings.countLabel || 'Сколько повторений?'}</Label>
        {settings.countDescription && (
          <p className="text-sm text-gray-500">{settings.countDescription}</p>
        )}
        <Input
          type="number"
          min={settings.minItems || 1}
          max={settings.maxItems || 30}
          value={answers[countKey] || ''}
          onChange={(e) => {
            const newCount = parseInt(e.target.value) || 0;
            onAnswerChange(countKey, e.target.value);
            // Сброс активной вкладки если новое количество меньше текущей
            if (newCount > 0 && activeTab >= newCount) {
              setActiveTab(0);
            }
          }}
          required={!!settings.countRequired}
          placeholder="Введите число"
        />
      </div>

      {/* Отображение вкладок/повторений только если есть вложенные вопросы и количество > 0 */}
      {count > 0 && hasSubQuestions ? (
        settings.displayMode === 'tabs' ? (
          <Tabs value={activeTab.toString()} onValueChange={(value) => setActiveTab(parseInt(value))}>
            <div className="w-full overflow-x-auto">
              <TabsList className="flex w-max min-w-full h-auto p-1" style={{ gridTemplateColumns: 'none' }}>
                {Array.from({ length: count }).map((_, index) => (
                  <TabsTrigger 
                    key={index} 
                    value={index.toString()}
                    className="flex-shrink-0 px-3 py-2 min-w-[100px] text-sm"
                  >
                    {settings.itemLabel} {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {Array.from({ length: count }).map((_, index) => (
              <TabsContent key={index} value={index.toString()}>
                <div className="border rounded-lg p-4 bg-card">
                  <h3 className="font-medium mb-4">
                    {settings.itemLabel} {index + 1}
                  </h3>
                  <div className="space-y-4">
                    {(question.parallelQuestions || [])
                      .map(qId => questions.find(q => q.id === qId))
                      .filter((q): q is Question => q !== undefined)
                      .map(subQuestion => (
                        <div key={subQuestion.id} className="space-y-2">
                          <Label>
                            {subQuestion.title}
                            {subQuestion.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          {subQuestion.description && (
                            <p className="text-sm text-gray-500">{subQuestion.description}</p>
                          )}
                          {renderQuestion(
                            subQuestion, 
                            questions, 
                            answers, 
                            (id, value) => {
                              // Сохраняем ответ с индексом повторения
                              const answerKey = `${id}_${index}`;
                              onAnswerChange(answerKey, value);
                            },
                            index // Передаем индекс для правильного получения ответов
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          // Последовательный режим отображения
          <div className="space-y-4">
            {Array.from({ length: count }).map((_, index) => (
              <div key={index} className="border rounded-lg p-4 bg-card">
                <h3 className="font-medium mb-4">
                  {settings.itemLabel} {index + 1}
                </h3>
                <div className="space-y-4">
                  {(question.parallelQuestions || [])
                    .map(qId => questions.find(q => q.id === qId))
                    .filter((q): q is Question => q !== undefined)
                    .map(subQuestion => (
                      <div key={subQuestion.id} className="space-y-2">
                        <Label>
                          {subQuestion.title}
                          {subQuestion.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {subQuestion.description && (
                          <p className="text-sm text-gray-500">{subQuestion.description}</p>
                        )}
                        {renderQuestion(
                          subQuestion, 
                          questions, 
                          answers, 
                          (id, value) => {
                            // Сохраняем ответ с индексом повторения
                            const answerKey = `${id}_${index}`;
                            onAnswerChange(answerKey, value);
                          },
                          index // Передаем индекс для правильного получения ответов
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : count > 0 && !hasSubQuestions ? (
        <div className="text-sm text-gray-500 italic">Нет вложенных вопросов для повторения</div>
      ) : null}
    </div>
  );
}

