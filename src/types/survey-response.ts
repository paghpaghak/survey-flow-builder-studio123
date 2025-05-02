export interface SurveyAnswer {
  questionId: string;
  value: any;
  timestamp: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  version: number;
  answers: SurveyAnswer[];
  metadata: {
    device: string;
    browser: string;
    duration: number;
    completedAt: string;
  };
}

export interface CreateSurveyResponseDto {
  surveyId: string;
  version: number;
  answers: SurveyAnswer[];
  metadata: {
    device: string;
    browser: string;
    duration: number;
  };
} 