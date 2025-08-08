import type { SurveyResponse } from '@survey-platform/shared-types';
import { apiJson } from '@/lib/api';

export async function getSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
  try {
    const data = await apiJson<SurveyResponse[]>(`/api/surveys/${surveyId}/responses`);
    return data;
  } catch (error) {
    console.error('Error fetching survey responses:', error);
    return [];
  }
}