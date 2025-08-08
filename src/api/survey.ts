import type { Survey } from '@survey-platform/shared-types';
import { apiJson } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

export const apiUpdateSurvey = async (survey: Survey): Promise<Survey> => {
  try {
    console.log('Отправка на сервер:', JSON.stringify(survey, null, 2));
    const result = await apiJson<Survey>(`${API_URL}/surveys/${survey.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(survey),
    });
    console.log('Ответ сервера:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Ошибка при обновлении опроса:', error);
    throw error;
  }
};

export async function getSurveys(): Promise<Survey[]> {
  try {
    return await apiJson<Survey[]>(`${API_URL}/surveys`);
  } catch (error) {
    console.error('Ошибка при загрузке опросов:', error);
    throw error;
  }
}