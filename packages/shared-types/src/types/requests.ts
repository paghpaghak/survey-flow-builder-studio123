import type { Question, Page, SurveyVersion } from './survey';

export interface UpdateSurveyRequest {
  questions: Question[];
  versions: Array<Omit<SurveyVersion, 'questions' | 'pages'> & {
    questions: Question[];
    pages: Array<Omit<Page, 'questions'> & {
      questions?: Question[];
    }>;
  }>;
  [key: string]: any; 
}

export interface SurveyResponse {
  _id?: string | { toHexString: () => string }; // Заменяем ObjectId на string или совместимый объект
  surveyId: string | { toHexString: () => string };
  answers: Array<{
    questionId: string;
    value: string | string[] | number;
  }>;
  createdAt: Date;
} 