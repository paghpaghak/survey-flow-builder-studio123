import type { Question } from '@survey-platform/shared-types';

// Хелпер для генерации id правила
export function generateRuleId() {
  return Math.random().toString(36).slice(2, 10);
}

// Хелпер для генерации дефолтных transitionRules для линейного перехода
export function withDefaultTransitions(questions: Question[]): Question[] {
  const grouped: Record<string, Question[]> = {};
  questions.forEach(q => {
    const key = q.pageId || 'default';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(q);
  });
  let result: Question[] = [];
  Object.values(grouped).forEach(group => {
    group.forEach((q, idx) => {
      if (q.transitionRules && q.transitionRules.length > 0) {
        result.push(q);
        return;
      }
      const next = group[idx + 1];
      if (next) {
        result.push({
          ...q,
          transitionRules: [{
            id: generateRuleId(),
            nextQuestionId: next.id,
            answer: '',
          }],
        });
      } else {
        result.push(q);
      }
    });
  });
  return result;
} 