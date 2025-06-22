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
