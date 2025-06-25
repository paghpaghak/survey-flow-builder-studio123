import { describe, it, expect } from 'vitest';
import { ConditionalLogicEngine } from '../../src/lib/conditional-logic-engine';
import type { 
  Question, 
  QuestionVisibilityRule, 
  VisibilityGroup,
  VisibilityCondition 
} from '@survey-platform/shared-types';
import { QUESTION_TYPES } from '@survey-platform/shared-types';

describe('ConditionalLogicEngine', () => {
  // Тестовые данные
  const questions: Question[] = [
    {
      id: 'q1',
      pageId: 'page1',
      title: 'Ваш возраст?',
      type: QUESTION_TYPES.Number,
    },
    {
      id: 'q2',
      pageId: 'page1',
      title: 'У вас есть водительские права?',
      type: QUESTION_TYPES.Radio,
      options: [
        { id: 'yes', text: 'Да' },
        { id: 'no', text: 'Нет' }
      ],
    },
    {
      id: 'q3',
      pageId: 'page1',
      title: 'Какой у вас стаж вождения?',
      type: QUESTION_TYPES.Number,
      visibilityRules: [{
        id: 'rule1',
        action: 'show',
        groups: [{
          id: 'group1',
          logic: 'AND',
          conditions: [{
            type: 'answer_equals',
            questionId: 'q2',
            value: 'yes'
          }]
        }],
        groupsLogic: 'AND'
      }]
    }
  ];

  describe('isQuestionVisible', () => {
    it('показывает вопрос без правил видимости', () => {
      const question = questions[0]; // q1 - без правил
      const answers = {};
      
      const result = ConditionalLogicEngine.isQuestionVisible(question, answers, questions);
      
      expect(result).toBe(true);
    });

    it('скрывает вопрос, если условие показа не выполнено', () => {
      const question = questions[2]; // q3 - показать если q2 === 'yes'
      const answers = { q2: 'no' };
      
      const result = ConditionalLogicEngine.isQuestionVisible(question, answers, questions);
      
      expect(result).toBe(false);
    });

    it('показывает вопрос, если условие показа выполнено', () => {
      const question = questions[2]; // q3 - показать если q2 === 'yes'
      const answers = { q2: 'yes' };
      
      const result = ConditionalLogicEngine.isQuestionVisible(question, answers, questions);
      
      expect(result).toBe(true);
    });
  });

  describe('getVisibleQuestions', () => {
    it('возвращает только видимые вопросы', () => {
      const answers = { q1: 25, q2: 'yes' };
      
      const result = ConditionalLogicEngine.getVisibleQuestions(questions, answers, questions);
      
      expect(result).toHaveLength(3);
      expect(result.map(q => q.id)).toEqual(['q1', 'q2', 'q3']);
    });

    it('возвращает все вопросы если нет ограничений', () => {
      const questionsWithoutRules = questions.slice(0, 2);
      const answers = {};
      
      const result = ConditionalLogicEngine.getVisibleQuestions(questionsWithoutRules, answers, questions);
      
      expect(result).toHaveLength(2);
      expect(result.map(q => q.id)).toEqual(['q1', 'q2']);
    });
  });
});