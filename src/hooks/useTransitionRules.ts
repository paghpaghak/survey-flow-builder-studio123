import { useState, useCallback } from 'react';
import { TransitionRule, UseTransitionRulesResult } from '@/types/question.types';
import { generateRuleId } from '@/utils/questionUtils';

/**
 * <summary>
 * Кастомный хук для управления правилами перехода между вопросами.
 * Обеспечивает добавление, удаление, обновление и валидацию правил.
 * </summary>
 * <param name="initialRules">Начальный список правил перехода</param>
 * <returns>API для управления правилами перехода</returns>
 */
export function useTransitionRules(initialRules: TransitionRule[] = []): UseTransitionRulesResult {
  const [rules, setRules] = useState<TransitionRule[]>(initialRules);

  /**
   * Добавляет новое пустое правило перехода
   */
  const addRule = useCallback(() => {
    const newRule: TransitionRule = {
      id: generateRuleId(),
      answer: '',
      nextQuestionId: ''
    };
    setRules(prev => [...prev, newRule]);
  }, []);

  /**
   * Удаляет правило по ID
   */
  const removeRule = useCallback((ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
  }, []);

  /**
   * Обновляет конкретное поле правила
   */
  const updateRule = useCallback((ruleId: string, field: keyof TransitionRule, value: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, [field]: value } : rule
    ));
  }, []);

  /**
   * Возвращает только валидные правила (с заполненными полями)
   */
  const getValidRules = useCallback(() => {
    return rules.filter(rule => 
      rule.answer.trim() !== '' && rule.nextQuestionId.trim() !== ''
    );
  }, [rules]);

  /**
   * Обновляет ответ для правила
   */
  const updateRuleAnswer = useCallback((ruleId: string, answer: string) => {
    updateRule(ruleId, 'answer', answer);
  }, [updateRule]);

  /**
   * Обновляет следующий вопрос для правила
   */
  const updateRuleNextQuestion = useCallback((ruleId: string, nextQuestionId: string) => {
    updateRule(ruleId, 'nextQuestionId', nextQuestionId);
  }, [updateRule]);

  /**
   * Проверяет, есть ли правило для конкретного ответа
   */
  const hasRuleForAnswer = useCallback((answer: string) => {
    return rules.some(rule => rule.answer === answer);
  }, [rules]);

  /**
   * Получает правило для конкретного ответа
   */
  const getRuleForAnswer = useCallback((answer: string) => {
    return rules.find(rule => rule.answer === answer);
  }, [rules]);

  /**
   * Очищает все правила
   */
  const clearAllRules = useCallback(() => {
    setRules([]);
  }, []);

  /**
   * Заменяет все правила новым списком
   */
  const setAllRules = useCallback((newRules: TransitionRule[]) => {
    setRules(newRules);
  }, []);

  /**
   * Получает количество валидных правил
   */
  const getValidRulesCount = useCallback(() => {
    return getValidRules().length;
  }, [getValidRules]);

  return {
    rules,
    addRule,
    removeRule,
    updateRule,
    getValidRules,
    updateRuleAnswer,
    updateRuleNextQuestion,
    hasRuleForAnswer,
    getRuleForAnswer,
    clearAllRules,
    setAllRules,
    getValidRulesCount
  };
}