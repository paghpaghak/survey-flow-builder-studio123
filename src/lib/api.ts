import { Survey } from '@/types/survey';

const API_BASE_URL = '/api';

export async function fetchSurveys(): Promise<Survey[]> {
  console.log('Fetching surveys from:', `${API_BASE_URL}/surveys`);
  const response = await fetch(`${API_BASE_URL}/surveys`);
  console.log('Response status:', response.status);
  if (!response.ok) {
    console.error('Failed to fetch surveys:', response.statusText);
    throw new Error('Failed to fetch surveys');
  }
  const data = await response.json();
  console.log('Fetched surveys:', data);
  return data;
}

export async function createSurvey(survey: Omit<Survey, 'id'>): Promise<Survey> {
  const response = await fetch(`${API_BASE_URL}/surveys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(survey),
  });
  if (!response.ok) {
    throw new Error('Failed to create survey');
  }
  return response.json();
}

export async function deleteSurvey(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/surveys/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete survey');
  }
}

export async function updateSurvey(survey: Survey): Promise<Survey> {
  const response = await fetch(`${API_BASE_URL}/surveys/${survey.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(survey),
  });
  if (!response.ok) {
    throw new Error('Failed to update survey');
  }
  return response.json();
} 