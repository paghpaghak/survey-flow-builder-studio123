import type {
  VisibilityCondition,
  VisibilityGroup,
  QuestionVisibilityRule,
  PageVisibilityRule,
  Question,
  Page,
  QuestionAnswer,
} from '@survey-platform/shared-types';

/**
 * Централизованный движок для обработки условной логики
 * Определяет видимость вопросов и страниц на основе ответов пользователя
 */
export class ConditionalLogicEngine {
  /**
   * Проверяет, должен ли быть виден вопрос
   */
  static isQuestionVisible(
    question: Question,
    answers: Record<string, QuestionAnswer>,
    allQuestions: Question[]
  ): boolean {
    if (!question.visibilityRules || question.visibilityRules.length === 0) {
      return true; // По умолчанию вопрос видим
    }

    // Если есть правила показа - вопрос скрыт по умолчанию
    const hasShowRules = question.visibilityRules.some(rule => rule.action === 'show');
    
    // Проверяем каждое правило видимости
    for (const rule of question.visibilityRules) {
      const ruleResult = this.evaluateVisibilityRule(rule, answers, allQuestions);
      
      if (rule.action === 'hide' && ruleResult) {
        return false; // Правило скрытия сработало
      }
      
      if (rule.action === 'show' && ruleResult) {
        return true; // Правило показа сработало
      }
    }

    // Если есть правила показа, но ни одно не сработало - скрываем
    // Если есть только правила скрытия и они не сработали - показываем
    return !hasShowRules;
  }

  /**
   * Проверяет, должна ли быть видна страница
   */
  static isPageVisible(
    page: Page,
    answers: Record<string, QuestionAnswer>,
    allQuestions: Question[]
  ): boolean {
    if (!page.visibilityRules || page.visibilityRules.length === 0) {
      return true; // По умолчанию страница видима
    }

    // Проверяем каждое правило видимости страницы
    for (const rule of page.visibilityRules) {
      const ruleResult = this.evaluateVisibilityRule(rule, answers, allQuestions);
      
      if (rule.action === 'hide' && ruleResult) {
        return false; // Правило скрытия сработало
      }
      
      if (rule.action === 'show' && ruleResult) {
        return true; // Правило показа сработало
      }
    }

    return true;
  }

  /**
   * Оценивает правило видимости (для вопроса или страницы)
   */
  private static evaluateVisibilityRule(
    rule: QuestionVisibilityRule | PageVisibilityRule,
    answers: Record<string, QuestionAnswer>,
    allQuestions: Question[]
  ): boolean {
    if (rule.groups.length === 0) {
      return false;
    }

    // Оцениваем каждую группу условий
    const groupResults = rule.groups.map(group => 
      this.evaluateVisibilityGroup(group, answers, allQuestions)
    );

    // Применяем логику между группами
    if (rule.groupsLogic === 'AND') {
      return groupResults.every(result => result);
    } else {
      return groupResults.some(result => result);
    }
  }

  /**
   * Оценивает группу условий
   */
  private static evaluateVisibilityGroup(
    group: VisibilityGroup,
    answers: Record<string, QuestionAnswer>,
    allQuestions: Question[]
  ): boolean {
    if (group.conditions.length === 0) {
      return false;
    }

    // Оцениваем каждое условие в группе
    const conditionResults = group.conditions.map(condition =>
      this.evaluateVisibilityCondition(condition, answers, allQuestions)
    );

    // Применяем логику внутри группы
    if (group.logic === 'AND') {
      return conditionResults.every(result => result);
    } else {
      return conditionResults.some(result => result);
    }
  }

  /**
   * Оценивает отдельное условие видимости
   */
  private static evaluateVisibilityCondition(
    condition: VisibilityCondition,
    answers: Record<string, QuestionAnswer>,
    allQuestions: Question[]
  ): boolean {
    const answer = answers[condition.questionId];
    const question = allQuestions.find(q => q.id === condition.questionId);

    if (!question) {
      console.warn(`Question with ID ${condition.questionId} not found for visibility condition`);
      return false;
    }

    switch (condition.type) {
      case 'answered':
        return answer !== undefined && answer !== null && answer !== '';

      case 'not_answered':
        return answer === undefined || answer === null || answer === '';

      case 'answer_equals':
        return answer === condition.value;

      case 'answer_not_equals':
        return answer !== condition.value;

      case 'answer_contains':
        if (typeof answer === 'string' && typeof condition.value === 'string') {
          return answer.toLowerCase().includes(condition.value.toLowerCase());
        }
        return false;

      case 'answer_greater_than':
        if (typeof answer === 'number' && typeof condition.value === 'number') {
          return answer > condition.value;
        }
        return false;

      case 'answer_less_than':
        if (typeof answer === 'number' && typeof condition.value === 'number') {
          return answer < condition.value;
        }
        return false;

      case 'answer_includes':
        // Для множественного выбора (checkbox, select multiple)
        if (Array.isArray(answer) && typeof condition.value === 'string') {
          return answer.includes(condition.value);
        }
        return false;

      default:
        console.warn(`Unknown visibility condition type: ${(condition as any).type}`);
        return false;
    }
  }

  /**
   * Получает все видимые вопросы для страницы с учетом условной логики
   */
  static getVisibleQuestions(
    pageQuestions: Question[],
    answers: Record<string, QuestionAnswer>,
    allQuestions: Question[]
  ): Question[] {
    return pageQuestions.filter(question =>
      this.isQuestionVisible(question, answers, allQuestions)
    );
  }

  /**
   * Получает все видимые страницы с учетом условной логики
   */
  static getVisiblePages(
    pages: Page[],
    answers: Record<string, QuestionAnswer>,
    allQuestions: Question[]
  ): Page[] {
    return pages.filter(page =>
      this.isPageVisible(page, answers, allQuestions)
    );
  }

  /**
   * Проверяет, есть ли циклические зависимости в правилах видимости
   * (для будущей валидации)
   */
  static hasCyclicDependencies(
    questions: Question[],
    pages: Page[]
  ): boolean {
    // TODO: Реализовать проверку циклических зависимостей
    // Это поможет предотвратить ситуации, когда вопрос A зависит от B, а B зависит от A
    return false;
  }
} 