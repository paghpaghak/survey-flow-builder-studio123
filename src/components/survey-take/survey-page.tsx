import { QuestionInput } from './question-inputs';
import { PlaceholderText } from '@/components/ui/placeholder-text';
import type { Page as PageType, Question, TextSettings } from '@survey-platform/shared-types';
import { QUESTION_TYPES } from '@survey-platform/shared-types';

interface SurveyPageProps {
  page: PageType;
  answers: Record<string, any>;
  allQuestions: Question[];
}

export function SurveyPage({ page, answers, allQuestions }: SurveyPageProps) {
  // Функция для проверки нужно ли скрывать заголовок вопроса
  const shouldHideTitle = (question: Question) => {
    if (question.type === QUESTION_TYPES.Text) {
      const textSettings = question.settings as TextSettings | undefined;
      return textSettings?.showTitleInside === true;
    }
    return false;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{page.title}</h3>
      {page.description && (
        <p className="text-sm text-muted-foreground">
          <PlaceholderText text={page.description} answers={answers} questions={allQuestions} />
        </p>
      )}
      
      <div className="space-y-4">
        {page.questions?.map((question) => (
          <div key={question.id} className="space-y-2">
            {!shouldHideTitle(question) && (
              <label className="text-sm font-medium">
                {question.title}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            {question.description && (
              <p className="text-sm text-muted-foreground">
                <PlaceholderText text={question.description} answers={answers} questions={allQuestions} />
              </p>
            )}
            <QuestionInput
              question={question}
              name={`answers.${question.id}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
} 