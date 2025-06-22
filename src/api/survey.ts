import type { Survey } from '@survey-platform/shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const apiUpdateSurvey = async (survey: Survey): Promise<Survey> => {
  try {
    console.log('Отправка на сервер:', JSON.stringify(survey, null, 2));
    
    const response = await fetch(`${API_URL}/surveys/${survey.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(survey),
    });

    if (!response.ok) {
      throw new Error('Ошибка при обновлении опроса');
    }

    const result = await response.json();
    console.log('Ответ сервера:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('Ошибка при обновлении опроса:', error);
    throw error;
  }
};

export async function getSurveys(): Promise<Survey[]> {
  // ... existing code ...
} 