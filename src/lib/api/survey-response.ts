import type { CreateSurveyResponseDto, SurveyResponse } from '@survey-platform/shared-types';

export async function submitSurveyResponse(
  data: CreateSurveyResponseDto
): Promise<SurveyResponse> {
  const response = await fetch(`/api/surveys/${data.surveyId}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Ошибка при отправке ответа');
  }

  return response.json();
} 