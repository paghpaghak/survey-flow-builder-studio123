import { SurveyResponse } from '@/types/survey-response';

export async function getSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
  try {
    const response = await fetch(`/api/surveys/${surveyId}/responses`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Failed to fetch responses. Status:', response.status, 'Response:', text);
      throw new Error('Failed to fetch survey responses');
    }
    
    const data = await response.json();
    console.log('Received responses data:', data);
    return Array.isArray(data) ? data : (data.responses || []);
  } catch (error) {
    console.error('Error fetching survey responses:', error);
    return [];
  }
} 