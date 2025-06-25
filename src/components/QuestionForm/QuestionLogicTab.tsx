import type { Question, QuestionOption } from '@survey-platform/shared-types';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash, Eye, EyeOff } from 'lucide-react';
import { useQuestionVisibilityRules } from '@/hooks/useVisibilityRules';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

interface QuestionLogicTabProps {
  transitionRules: ReturnType<typeof import('@/hooks/useTransitionRules').useTransitionRules>;
  options: QuestionOption[];
  availableQuestions: Question[];
  currentQuestionId: string;
  readOnly?: boolean;
  // Объект управления правилами видимости
  visibilityRules: ReturnType<typeof useQuestionVisibilityRules>;
}

/**
 * <summary>
 * Компонент вкладки логики для настройки переходов между вопросами и условий видимости.
 * Включает две основные секции: правила переходов и условия видимости.
 * </summary>
 */
export function QuestionLogicTab({
  transitionRules,
  options,
  availableQuestions,
  currentQuestionId,
  readOnly = false,
  visibilityRules,
}: QuestionLogicTabProps) {
  // Состояние для управления раскрытием секций
  const [isTransitionOpen, setIsTransitionOpen] = useState(true);
  const [isVisibilityOpen, setIsVisibilityOpen] = useState(false);

  // Фильтруем доступные вопросы для переходов и условий
  const availableTargetQuestions = availableQuestions.filter(q => q.id !== currentQuestionId);
  
  // Для условий видимости могут использоваться вопросы с других страниц
  const availableSourceQuestions = availableQuestions.filter(q => q.id !== currentQuestionId);

  // Константы для типов условий
  const conditionTypes = [
    { value: 'answered', label: 'Ответ дан' },
    { value: 'not_answered', label: 'Ответ не дан' },
    { value: 'answer_equals', label: 'Ответ равен' },
    { value: 'answer_not_equals', label: 'Ответ не равен' },
    { value: 'answer_contains', label: 'Ответ содержит' },
    { value: 'answer_greater_than', label: 'Ответ больше' },
    { value: 'answer_less_than', label: 'Ответ меньше' },
    { value: 'answer_includes', label: 'Ответ включает' },
  ];

  return (
    <TabsContent value="logic" className="flex flex-col h-full">
      <div className="flex-1 flex flex-col min-h-0 space-y-6">
        
        {/* =================== СЕКЦИЯ ПЕРЕХОДОВ МЕЖДУ ВОПРОСАМИ =================== */}
        <Collapsible open={isTransitionOpen} onOpenChange={setIsTransitionOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="font-medium">Переходы между вопросами</span>
              <span className="text-sm text-gray-500">
                {transitionRules.rules.length > 0 ? `${transitionRules.rules.length} правил` : 'Нет правил'}
              </span>
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="text-sm text-gray-500">
              Настройте переходы к другим вопросам в зависимости от выбранного ответа
            </div>
            
            {/* Список правил переходов */}
            <div className="space-y-2">
              {transitionRules.rules.length === 0 ? (
                <div className="text-center py-6 text-gray-500 border border-dashed rounded-lg">
                  <p className="mb-2">Правила перехода не настроены</p>
                  <p className="text-sm">Вопросы будут следовать в порядке по умолчанию</p>
                </div>
              ) : (
                transitionRules.rules.map((rule, index) => (
                  <div key={rule.id} className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
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
                    
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => transitionRules.removeRule(rule.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
            
            {/* Кнопка добавления правила перехода */}
            {!readOnly && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={transitionRules.addRule}
                  disabled={options.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить правило перехода
                </Button>
                {options.length === 0 && (
                  <p className="text-sm text-gray-500 text-center">
                    Добавьте варианты ответов, чтобы создать правила перехода
                  </p>
                )}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* =================== СЕКЦИЯ УСЛОВИЙ ВИДИМОСТИ =================== */}
        <Collapsible open={isVisibilityOpen} onOpenChange={setIsVisibilityOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="font-medium">Условия видимости</span>
              </div>
              <span className="text-sm text-gray-500">
                {visibilityRules.rules.length > 0 ? `${visibilityRules.rules.length} правил` : 'Всегда видимый'}
              </span>
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="text-sm text-gray-500">
              Настройте условия, при которых вопрос будет отображаться пользователю
            </div>
            
            {/* Список правил видимости */}
            <div className="space-y-4">
              {visibilityRules.rules.length === 0 ? (
                <div className="text-center py-6 text-gray-500 border border-dashed rounded-lg">
                  <Eye className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="mb-2">Вопрос всегда видимый</p>
                  <p className="text-sm">Добавьте правило для условного отображения</p>
                </div>
              ) : (
                visibilityRules.rules.map((rule, ruleIndex) => (
                  <div key={rule.id} className="border rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {rule.action === 'show' ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium">
                          Правило {ruleIndex + 1}: {rule.action === 'show' ? 'Показать' : 'Скрыть'} вопрос
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Select 
                          value={rule.action}
                          onValueChange={(value: 'show' | 'hide') => 
                            visibilityRules.updateRule(rule.id, { action: value })
                          }
                          disabled={readOnly}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="show">Показать</SelectItem>
                            <SelectItem value="hide">Скрыть</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => visibilityRules.removeRule(rule.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Группы условий */}
                    <div className="space-y-3">
                      {rule.groups.map((group, groupIndex) => (
                        <div key={group.id} className="border border-gray-200 rounded p-3 bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Группа {groupIndex + 1}</span>
                            <div className="flex items-center gap-2">
                              <Select 
                                value={group.logic}
                                onValueChange={(value: 'AND' | 'OR') => 
                                  visibilityRules.updateGroup(rule.id, group.id, { logic: value })
                                }
                                disabled={readOnly}
                              >
                                <SelectTrigger className="w-16">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="AND">И</SelectItem>
                                  <SelectItem value="OR">ИЛИ</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              {!readOnly && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => visibilityRules.removeGroup(rule.id, group.id)}
                                  className="text-red-500 hover:text-red-700 h-6 w-6"
                                >
                                  <Trash className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {/* Условия в группе */}
                          <div className="space-y-2">
                            {group.conditions.map((condition, conditionIndex) => (
                              <div key={conditionIndex} className="flex items-center gap-2 text-sm">
                                <Select 
                                  value={condition.questionId}
                                  onValueChange={(value) => 
                                    visibilityRules.updateCondition(rule.id, group.id, conditionIndex, { questionId: value })
                                  }
                                  disabled={readOnly}
                                >
                                  <SelectTrigger className="min-w-[120px]">
                                    <SelectValue placeholder="Вопрос" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableSourceQuestions.map(q => (
                                      <SelectItem key={q.id} value={q.id}>
                                        {q.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                
                                <Select 
                                  value={condition.type}
                                  onValueChange={(value) => 
                                    visibilityRules.updateCondition(rule.id, group.id, conditionIndex, { type: value as any })
                                  }
                                  disabled={readOnly}
                                >
                                  <SelectTrigger className="min-w-[120px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {conditionTypes.map(type => (
                                      <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                
                                {/* Поле значения для условий, которые его требуют */}
                                {['answer_equals', 'answer_not_equals', 'answer_contains', 'answer_greater_than', 'answer_less_than', 'answer_includes'].includes(condition.type) && (
                                  <input 
                                    type="text"
                                    value={(condition as any).value || ''}
                                    onChange={(e) => 
                                      visibilityRules.updateCondition(rule.id, group.id, conditionIndex, { value: e.target.value })
                                    }
                                    placeholder="Значение"
                                    disabled={readOnly}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm min-w-[80px]"
                                  />
                                )}
                                
                                {!readOnly && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => visibilityRules.removeCondition(rule.id, group.id, conditionIndex)}
                                    className="text-red-500 hover:text-red-700 h-6 w-6"
                                  >
                                    <Trash className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            
                            {!readOnly && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => visibilityRules.addCondition(rule.id, group.id)}
                                className="w-full"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Добавить условие
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* Логика между группами */}
                      {rule.groups.length > 1 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Логика между группами:</span>
                          <Select 
                            value={rule.groupsLogic}
                            onValueChange={(value: 'AND' | 'OR') => 
                              visibilityRules.updateRule(rule.id, { groupsLogic: value })
                            }
                            disabled={readOnly}
                          >
                            <SelectTrigger className="w-16">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AND">И</SelectItem>
                              <SelectItem value="OR">ИЛИ</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {!readOnly && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => visibilityRules.addGroup(rule.id)}
                          className="w-full"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Добавить группу условий
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Кнопка добавления правила видимости */}
            {!readOnly && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => visibilityRules.addRule()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить правило видимости
              </Button>
            )}
          </CollapsibleContent>
        </Collapsible>
        
      </div>
    </TabsContent>
  );
}