import React, { useState } from 'react';
import { Question, QuestionType, ParallelBranchSettings, TransitionRule } from '@/types/survey';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IMaskInput } from 'react-imask';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlaceholderText } from '@/components/ui/placeholder-text';

interface PagePreviewProps {
  questions: Question[];
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
  pages: { id: string; description: string }[];
  pageId: string;
  page?: { description: string };
}

export function PagePreview({ questions, answers, onAnswerChange, pages, pageId, page }: PagePreviewProps) {
  // ЛОГИРУЮ входные пропсы
  console.log('[PagePreview] questions:', questions);
  console.log('[PagePreview] answers:', answers);

  // Получаем индекс текущей страницы
  const pageIndex = pages.findIndex(p => p.id === pageId);
  // Собираем вопросы всех предыдущих и текущей страницы
  const prevQuestions = pages.slice(0, pageIndex + 1).flatMap(p => questions.filter(q => q.pageId === p.id));

  // Группируем вопросы по pageId (берём первую страницу)
  const pageQuestions = questions.filter(q => q.pageId === pageId);

  // Проверяем, есть ли кастомные transitionRules (answer != '')
  const hasCustomRules = pageQuestions.some(q =>
    (q.transitionRules || []).some(r => r.answer && r.answer !== '')
  );

  // Если только дефолтные переходы — показываем все вопросы сразу
  if (!hasCustomRules) {
    // --- локальный state для repeatIndex параллельной ветки ---
    const [repeatIndexes, setRepeatIndexes] = React.useState<Record<string, number>>({});
    const handleRepeatIndex = (questionId: string, idx: number) => {
      setRepeatIndexes(prev => ({ ...prev, [questionId]: idx }));
    };
    return (
      <div className="space-y-6">
        {page?.descriptionPosition === 'before' && (
          <div className="mb-4 text-muted-foreground">
            <PlaceholderText text={page.description} answers={answers} questions={questions} />
          </div>
        )}
        {pageQuestions.map((question) => (
          <div key={question.id} className="space-y-2">
            <div className="space-y-1">
              <Label className="text-base">
                {question.title}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {question.description && (
                <p className="text-sm text-gray-500">
                  {console.log('[PagePreview] question', question.id, 'desc:', question.description, 'answers:', answers)}
                  <PlaceholderText text={question.description} answers={answers} questions={questions} />
                </p>
              )}
            </div>
            {question.type === QuestionType.ParallelGroup ? (
              (() => {
                const settings: ParallelBranchSettings = {
                  itemLabel: 'Элемент',
                  displayMode: 'sequential',
                  minItems: 1,
                  ...((question.settings || {}) as Partial<ParallelBranchSettings>),
                };
                const countKey = question.id + '_count';
                const count = Number(answers[countKey]) || 0;
                const hasSubQuestions = Array.isArray(question.parallelQuestions) && question.parallelQuestions.length > 0;
                const repeatIndex = repeatIndexes[question.id] || 0;
                return (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{settings.countLabel || 'Сколько повторений?'}</Label>
                      {settings.countDescription && (
                        <p className="text-sm text-gray-500">{settings.countDescription}</p>
                      )}
                      <Input
                        type="number"
                        value={answers[countKey] || ''}
                        onChange={(e) => onAnswerChange(countKey, e.target.value)}
                        required={!!settings.countRequired}
                        placeholder="Введите число"
                      />
                    </div>
                    {count > 0 && hasSubQuestions ? (
                      <>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {Array.from({ length: count }).map((_, index) => (
                            <button
                              key={index}
                              onClick={() => handleRepeatIndex(question.id, index)}
                              className={`px-4 py-2 rounded-lg min-w-[120px] transition-colors ${
                                repeatIndex === index
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary hover:bg-secondary/80'
                              }`}
                            >
                              {settings.itemLabel} {index + 1}
                            </button>
                          ))}
                        </div>
                        <div className="border rounded-lg p-4 bg-card">
                          <h3 className="font-medium mb-4">
                            {settings.itemLabel} {repeatIndex + 1}
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
                                  {RenderParallelBranchPreview({ q: subQuestion, questions, answers, onAnswerChange })}
                                </div>
                              ))}
                          </div>
                        </div>
                      </>
                    ) : count > 0 && !hasSubQuestions ? (
                      <div className="text-sm text-gray-500 italic">Нет вложенных вопросов для повторения</div>
                    ) : null}
                  </div>
                );
              })()
            ) : (
              RenderParallelBranchPreview({ q: question, questions, answers, onAnswerChange })
            )}
          </div>
        ))}
        {page?.descriptionPosition !== 'before' && (
          <div className="mb-4 text-muted-foreground">
            <PlaceholderText text={page.description} answers={answers} questions={questions} />
          </div>
        )}
      </div>
    );
  }

  // Если есть кастомные transitionRules — пошаговый режим (старое поведение)
  const [currentQuestionId, setCurrentQuestionId] = React.useState<string | null>(() => {
    // Находим стартовый вопрос (без входящих transitionRules)
    const allNextIds = new Set(
      pageQuestions.flatMap(q => q.transitionRules?.map(r => r.nextQuestionId) || [])
    );
    const start = pageQuestions.find(q => !allNextIds.has(q.id));
    return start ? start.id : pageQuestions[0]?.id || null;
  });

  const currentQuestion = pageQuestions.find(q => q.id === currentQuestionId);

  function handleAnswer(questionId: string, value: any) {
    const q = pageQuestions.find(q => q.id === questionId);
    let validValue = value;
    if (q && (q.type === QuestionType.Radio || q.type === QuestionType.Select)) {
      // Если value не найден среди options — не сохраняем
      if (!q.options?.some(opt => opt.id === value)) {
        console.warn('[handleAnswer] Некорректный value для Radio/Select:', value, 'Ожидались:', q.options?.map(o => o.id));
        return;
      }
    }
    onAnswerChange(questionId, validValue);
    // Переход к следующему вопросу по transitionRules
    if (!q || !q.transitionRules || q.transitionRules.length === 0) return;
    let nextId: string | undefined;
    // Для Radio/Select ищем по значению ответа
    if (q.type === QuestionType.Radio || q.type === QuestionType.Select) {
      const rule = q.transitionRules.find(r => r.answer === value);
      nextId = rule?.nextQuestionId;
    } else {
      // Для остальных — берём первое правило (или расширить по необходимости)
      nextId = q.transitionRules[0]?.nextQuestionId;
    }
    if (nextId) setCurrentQuestionId(nextId);
  }

  if (!currentQuestion) return <div>Вопросы не найдены</div>;

  return (
    <div className="space-y-6">
      {page?.descriptionPosition === 'before' && (
        <div className="mb-4 text-muted-foreground">
          <PlaceholderText text={page.description} answers={answers} questions={questions} />
        </div>
      )}
      <div key={currentQuestion.id} className="space-y-2">
        <div className="space-y-1">
          <Label className="text-base">
            {currentQuestion.title}
            {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {currentQuestion.description && (
            <p className="text-sm text-gray-500">
              {console.log('[PagePreview] currentQuestion', currentQuestion.id, 'desc:', currentQuestion.description, 'answers:', answers)}
              <PlaceholderText text={currentQuestion.description} answers={answers} questions={questions} />
            </p>
          )}
        </div>
        {RenderParallelBranchPreview({ q: currentQuestion, questions, answers, onAnswerChange })}
      </div>
      {page?.descriptionPosition !== 'before' && (
        <div className="mb-4 text-muted-foreground">
          <PlaceholderText text={page.description} answers={answers} questions={questions} />
        </div>
      )}
    </div>
  );
}

function RenderParallelBranchPreview({ q, questions, answers, onAnswerChange }) {
  const settings = {
    itemLabel: 'Элемент',
    displayMode: 'sequential',
    minItems: 1,
    ...((q.settings || {})),
  };
  const countKey = q.id + '_count';
  const count = Number(answers[countKey]) || 0;
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{settings.countLabel || 'Сколько повторений?'}</Label>
        {settings.countDescription && (
          <p className="text-sm text-gray-500">{settings.countDescription}</p>
        )}
        <Input
          type="number"
          value={answers[countKey] || ''}
          onChange={(e) => onAnswerChange(countKey, e.target.value)}
          required={!!settings.countRequired}
          placeholder="Введите число"
        />
      </div>
      {count > 0 && (
        <div className="border rounded-lg p-4 bg-card">
          <h3 className="font-medium mb-4">{settings.itemLabel}</h3>
          <div className="space-y-4">
            {(q.parallelQuestions || []).map(subId => {
              const subQ = questions.find(qq => qq.id === subId);
              if (!subQ) return null;
              if (subQ.type === 'parallel_group' || subQ.type === 'ParallelGroup') {
                return <RenderParallelBranchPreview key={subQ.id} q={subQ} questions={questions} answers={answers} onAnswerChange={onAnswerChange} />;
              }
              return (
                <div key={subQ.id} className="space-y-2">
                  <Label>
                    {subQ.title}
                    {subQ.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {renderQuestion(subQ, (id, value) => onAnswerChange(id, value))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function renderQuestion(question: Question, answerHandler: (id: string, value: any) => void) {
  switch (question.type) {
    case QuestionType.ParallelGroup: {
      const settings: ParallelBranchSettings = {
        itemLabel: 'Элемент',
        displayMode: 'sequential',
        minItems: 1,
        ...((question.settings || {}) as Partial<ParallelBranchSettings>),
      };
      const countKey = question.id + '_count';
      const count = Number(answers[countKey]) || 0;
      const hasSubQuestions = Array.isArray(question.parallelQuestions) && question.parallelQuestions.length > 0;

      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{settings.countLabel || 'Сколько повторений?'}</Label>
            {settings.countDescription && (
              <p className="text-sm text-gray-500">{settings.countDescription}</p>
            )}
            <Input
              type="number"
              value={answers[countKey] || ''}
              onChange={(e) => answerHandler(countKey, e.target.value)}
              required={!!settings.countRequired}
              placeholder="Введите число"
            />
          </div>
          {count > 0 && hasSubQuestions ? (
            <>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {Array.from({ length: count }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionId(prev => prev ? `${question.id}.${index}` : null)}
                    className={`px-4 py-2 rounded-lg min-w-[120px] transition-colors ${
                      currentQuestionId === `${question.id}.${index}`
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {settings.itemLabel} {index + 1}
                  </button>
                ))}
              </div>
              <div className="border rounded-lg p-4 bg-card">
                <h3 className="font-medium mb-4">
                  {settings.itemLabel} {currentQuestionId?.split('.').pop()}
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
                        {renderQuestion(subQuestion, answerHandler)}
                      </div>
                    ))}
                </div>
              </div>
            </>
          ) : count > 0 && !hasSubQuestions ? (
            <div className="text-sm text-gray-500 italic">Нет вложенных вопросов для повторения</div>
          ) : null}
        </div>
      );
    }

    case QuestionType.Text:
      return (
        <Input
          value={answers[question.id] || ''}
          onChange={(e) => answerHandler(question.id, e.target.value)}
          placeholder="Введите ваш ответ"
        />
      );

    case QuestionType.Number:
      return (
        <Input
          type="number"
          value={answers[question.id] || ''}
          onChange={(e) => answerHandler(question.id, e.target.value)}
          placeholder="Введите число"
        />
      );

    case QuestionType.Radio:
      return (
        <RadioGroup
          value={answers[question.id] || ''}
          onValueChange={(value) => answerHandler(question.id, value)}
        >
          {question.options?.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <RadioGroupItem value={option.id} id={option.id} />
              <Label htmlFor={option.id}>{option.text}</Label>
            </div>
          ))}
        </RadioGroup>
      );

    case QuestionType.Checkbox:
      return (
        <div className="space-y-2">
          {question.options?.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox
                id={option.id}
                checked={answers[question.id]?.includes(option.id) || false}
                onCheckedChange={(checked) => {
                  const currentAnswers = answers[question.id] || [];
                  answerHandler(
                    question.id,
                    checked
                      ? [...currentAnswers, option.id]
                      : currentAnswers.filter((id: string) => id !== option.id)
                  );
                }}
              />
              <Label htmlFor={option.id}>{option.text}</Label>
            </div>
          ))}
        </div>
      );

    case QuestionType.Select:
      return (
        <Select
          value={answers[question.id] || ''}
          onValueChange={(value) => answerHandler(question.id, value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите вариант" />
          </SelectTrigger>
          <SelectContent>
            {question.options?.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case QuestionType.Date:
      const dateSettings = question.settings as { format?: string };
      return (
        <div className="space-y-2">
          <Calendar
            mode="single"
            selected={answers[question.id]}
            onSelect={(value) => answerHandler(question.id, value)}
            className="rounded-md border"
          />
          {answers[question.id] && (
            <p className="text-sm text-gray-500">
              Выбрано: {format(answers[question.id], dateSettings.format || 'dd.MM.yyyy')}
            </p>
          )}
        </div>
      );

    case QuestionType.Email:
      return (
        <Input
          type="email"
          value={answers[question.id] || ''}
          onChange={(e) => answerHandler(question.id, e.target.value)}
          placeholder="example@domain.com"
        />
      );

    case QuestionType.Phone:
      const phoneSettings = question.settings as { countryCode?: string; mask?: string };
      return (
        <div className="flex gap-2">
          <Input
            className="w-20"
            value={phoneSettings.countryCode || '+7'}
            disabled
          />
          <IMaskInput
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            mask={phoneSettings.mask || '(000) 000-00-00'}
            value={answers[question.id] || ''}
            onAccept={(value) => answerHandler(question.id, value)}
            placeholder="(999) 999-99-99"
          />
        </div>
      );

    default:
      return null;
  }
} 