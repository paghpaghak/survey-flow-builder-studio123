import type { Survey, SurveyVersion, Question, Page } from '@survey-platform/shared-types';

/**
 * Creates a deep copy of a survey object with new IDs for the survey, its versions, pages, and questions.
 * This is useful for duplicating a survey structure without its responses.
 * @param originalSurvey The survey to duplicate.
 * @returns A new survey object ready to be saved.
 */
export function duplicateSurvey(originalSurvey: Survey): Omit<Survey, 'responsesCount'> {
  const newSurveyId = crypto.randomUUID();
  
  const newVersions = originalSurvey.versions.map(version => {
    const pageIdMap: Record<string, string> = {};
    const questionIdMap: Record<string, string> = {};

    const newQuestions = version.questions.map(q => {
      const newQId = crypto.randomUUID();
      questionIdMap[q.id] = newQId;
      
      let newParallelQuestions: string[] | undefined = undefined;
      if (q.parallelQuestions) {
        newParallelQuestions = q.parallelQuestions.map(pid => {
          if (!questionIdMap[pid]) {
            questionIdMap[pid] = crypto.randomUUID();
          }
          return questionIdMap[pid];
        });
      }

      return {
        ...q,
        id: newQId,
        parallelQuestions: newParallelQuestions,
      };
    });

    const newPages = version.pages.map(page => {
      const newPageId = crypto.randomUUID();
      pageIdMap[page.id] = newPageId;
      return { ...page, id: newPageId };
    });

    const finalQuestions = newQuestions.map(q => ({
      ...q,
      pageId: pageIdMap[q.pageId] || q.pageId,
    }));

    return {
      ...version,
      id: crypto.randomUUID(),
      version: 1,
      title: `${version.title || originalSurvey.title} (Копия)`,
      pages: newPages,
      questions: finalQuestions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: undefined,
      status: 'draft' as const,
    };
  });

  const newSurvey: Omit<Survey, 'responsesCount'> = {
    ...originalSurvey,
    id: newSurveyId,
    title: `${originalSurvey.title} (Копия)`,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    versions: newVersions,
    currentVersion: 1,
    publishedVersion: undefined,
  };
  
  return newSurvey;
} 