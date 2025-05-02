import { ObjectId } from 'mongodb';
import { Question, Page, SurveyVersion } from './survey';

export interface UpdateSurveyRequest {
  questions: Question[];
  versions: Array<Omit<SurveyVersion, 'questions' | 'pages'> & {
    questions: Question[];
    pages: Array<Omit<Page, 'questions'> & {
      questions?: Question[];
    }>;
  }>;
  [key: string]: any; // для других полей, которые могут быть в запросе
}

export interface SurveyResponse {
  _id?: ObjectId;
  surveyId: ObjectId;
  answers: Array<{
    questionId: string;
    value: string | string[] | number;
  }>;
  createdAt: Date;
} 