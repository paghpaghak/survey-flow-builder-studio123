import { useState, useCallback } from 'react';
import type {
  QuestionVisibilityRule,
  PageVisibilityRule,
  VisibilityGroup,
  VisibilityCondition,
} from '@survey-platform/shared-types';
import { generateId } from '@/utils/questionUtils';

/**
 * Хук для управления правилами видимости вопросов
 */
export function useQuestionVisibilityRules(initialRules: QuestionVisibilityRule[] = []) {
  const [rules, setRules] = useState<QuestionVisibilityRule[]>(initialRules);

  const addRule = useCallback(() => {
    const newRule: QuestionVisibilityRule = {
      id: generateId(),
      action: 'show',
      groups: [],
      groupsLogic: 'AND',
    };
    setRules(prev => [...prev, newRule]);
  }, []);

  const removeRule = useCallback((ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
  }, []);

  const updateRule = useCallback((ruleId: string, updates: Partial<QuestionVisibilityRule>) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  }, []);

  const addGroup = useCallback((ruleId: string) => {
    const newGroup: VisibilityGroup = {
      id: generateId(),
      logic: 'AND',
      conditions: [],
    };
    
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, groups: [...rule.groups, newGroup] }
        : rule
    ));
  }, []);

  const removeGroup = useCallback((ruleId: string, groupId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, groups: rule.groups.filter(group => group.id !== groupId) }
        : rule
    ));
  }, []);

  const updateGroup = useCallback((ruleId: string, groupId: string, updates: Partial<VisibilityGroup>) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? {
            ...rule,
            groups: rule.groups.map(group => 
              group.id === groupId ? { ...group, ...updates } : group
            )
          }
        : rule
    ));
  }, []);

  const addCondition = useCallback((ruleId: string, groupId: string) => {
    const newCondition: VisibilityCondition = {
      type: 'answered',
      questionId: '',
    };

    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? {
            ...rule,
            groups: rule.groups.map(group => 
              group.id === groupId 
                ? { ...group, conditions: [...group.conditions, newCondition] }
                : group
            )
          }
        : rule
    ));
  }, []);

  const removeCondition = useCallback((ruleId: string, groupId: string, conditionIndex: number) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? {
            ...rule,
            groups: rule.groups.map(group => 
              group.id === groupId 
                ? { 
                    ...group, 
                    conditions: group.conditions.filter((_, index) => index !== conditionIndex) 
                  }
                : group
            )
          }
        : rule
    ));
  }, []);

  const updateCondition = useCallback((
    ruleId: string, 
    groupId: string, 
    conditionIndex: number, 
    updates: Partial<VisibilityCondition>
  ) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? {
            ...rule,
            groups: rule.groups.map(group => 
              group.id === groupId 
                ? {
                    ...group,
                    conditions: group.conditions.map((condition, index) => 
                      index === conditionIndex ? { ...condition, ...updates } : condition
                    )
                  }
                : group
            )
          }
        : rule
    ));
  }, []);

  const getValidRules = useCallback(() => {
    return rules.filter(rule => 
      rule.groups.length > 0 && 
      rule.groups.some(group => 
        group.conditions.length > 0 && 
        group.conditions.every(condition => condition.questionId.trim() !== '')
      )
    );
  }, [rules]);

  const clearAllRules = useCallback(() => {
    setRules([]);
  }, []);

  const setAllRules = useCallback((newRules: QuestionVisibilityRule[]) => {
    setRules(newRules);
  }, []);

  return {
    rules,
    addRule,
    removeRule,
    updateRule,
    addGroup,
    removeGroup,
    updateGroup,
    addCondition,
    removeCondition,
    updateCondition,
    getValidRules,
    clearAllRules,
    setAllRules,
  };
}

/**
 * Хук для управления правилами видимости страниц
 */
export function usePageVisibilityRules(initialRules: PageVisibilityRule[] = []) {
  const [rules, setRules] = useState<PageVisibilityRule[]>(initialRules);

  const addRule = useCallback(() => {
    const newRule: PageVisibilityRule = {
      id: generateId(),
      action: 'show',
      groups: [],
      groupsLogic: 'AND',
    };
    setRules(prev => [...prev, newRule]);
  }, []);

  const removeRule = useCallback((ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
  }, []);

  const updateRule = useCallback((ruleId: string, updates: Partial<PageVisibilityRule>) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  }, []);

  const addGroup = useCallback((ruleId: string) => {
    const newGroup: VisibilityGroup = {
      id: generateId(),
      logic: 'AND',
      conditions: [],
    };
    
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, groups: [...rule.groups, newGroup] }
        : rule
    ));
  }, []);

  const removeGroup = useCallback((ruleId: string, groupId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, groups: rule.groups.filter(group => group.id !== groupId) }
        : rule
    ));
  }, []);

  const updateGroup = useCallback((ruleId: string, groupId: string, updates: Partial<VisibilityGroup>) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? {
            ...rule,
            groups: rule.groups.map(group => 
              group.id === groupId ? { ...group, ...updates } : group
            )
          }
        : rule
    ));
  }, []);

  const addCondition = useCallback((ruleId: string, groupId: string) => {
    const newCondition: VisibilityCondition = {
      type: 'answered',
      questionId: '',
    };

    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? {
            ...rule,
            groups: rule.groups.map(group => 
              group.id === groupId 
                ? { ...group, conditions: [...group.conditions, newCondition] }
                : group
            )
          }
        : rule
    ));
  }, []);

  const removeCondition = useCallback((ruleId: string, groupId: string, conditionIndex: number) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? {
            ...rule,
            groups: rule.groups.map(group => 
              group.id === groupId 
                ? { 
                    ...group, 
                    conditions: group.conditions.filter((_, index) => index !== conditionIndex) 
                  }
                : group
            )
          }
        : rule
    ));
  }, []);

  const updateCondition = useCallback((
    ruleId: string, 
    groupId: string, 
    conditionIndex: number, 
    updates: Partial<VisibilityCondition>
  ) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? {
            ...rule,
            groups: rule.groups.map(group => 
              group.id === groupId 
                ? {
                    ...group,
                    conditions: group.conditions.map((condition, index) => 
                      index === conditionIndex ? { ...condition, ...updates } : condition
                    )
                  }
                : group
            )
          }
        : rule
    ));
  }, []);

  const getValidRules = useCallback(() => {
    return rules.filter(rule => 
      rule.groups.length > 0 && 
      rule.groups.some(group => 
        group.conditions.length > 0 && 
        group.conditions.every(condition => condition.questionId.trim() !== '')
      )
    );
  }, [rules]);

  const clearAllRules = useCallback(() => {
    setRules([]);
  }, []);

  const setAllRules = useCallback((newRules: PageVisibilityRule[]) => {
    setRules(newRules);
  }, []);

  return {
    rules,
    addRule,
    removeRule,
    updateRule,
    addGroup,
    removeGroup,
    updateGroup,
    addCondition,
    removeCondition,
    updateCondition,
    getValidRules,
    clearAllRules,
    setAllRules,
  };
} 