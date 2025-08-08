import type { CreateSurveyResponseDto, SurveyResponse } from '@survey-platform/shared-types';
import { apiJson } from '@/lib/api';

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

export async function submitSurveyResponse(
  data: CreateSurveyResponseDto
): Promise<SurveyResponse> {
  return apiJson<SurveyResponse>(`/api/surveys/${data.surveyId}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}