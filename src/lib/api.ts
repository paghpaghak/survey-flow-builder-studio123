import type { Survey } from '@survey-platform/shared-types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
/**
 * Обертка над `fetch`, добавляющая общую обработку ошибок и передачу cookie.
 */
function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  try {
    const method = (init.method || 'GET').toUpperCase();
    const headers = new Headers(init.headers || {});

    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      const csrf = readCookie('csrf-token');
      if (csrf) headers.set('X-CSRF-Token', csrf);
    }

    const response = await fetch(input, {
      credentials: 'include',
      ...init,
      headers,
    });

    if (!response.ok) {
      let message = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        message = errorData?.error || errorData?.message || message;
      } catch {
        // ignore json parse errors
      }
      throw new Error(message);
    }

    return response;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Network error');
  }
}

/**
 * Выполняет запрос и возвращает JSON-ответ.
 */
export async function apiJson<T>(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<T> {
  const response = await apiFetch(input, init);
  const data = await response.json().catch(() => null);
  return (data?.data ?? data) as T;
}
// Функция для преобразования данных опроса
export const transformSurveyData = (data: any): Survey => {
  if (!data) {
    throw new Error('No survey data provided');
  }

  // Преобразуем версии опроса
  const versions = Array.isArray(data.versions) ? data.versions.map((version: any) => {
    // Преобразуем вопросы
    const questions = Array.isArray(version.questions) ? version.questions.map((q: any) => ({
      ...q,
      id: q.id || q._id,
      pageId: q.pageId || ''
    })) : [];

    // Преобразуем страницы и связываем их с вопросами
    const pages = Array.isArray(version.pages) ? version.pages.map((page: any) => {
      // Находим вопросы для этой страницы
      const pageQuestions = questions.filter((q: { pageId: any; }) => q.pageId === (page.id || page._id));
      
      return {
        id: page.id || page._id,
        title: page.title || '',
        description: page.description || '',
        questions: pageQuestions
      };
    }) : [];

    return {
      id: version.id || version._id || data._id,
      version: version.version || 1,
      status: version.status || data.status,
      title: version.title || data.title || '',
      description: version.description || '',
      pages: pages,
      questions: questions,
      createdAt: version.createdAt || data.createdAt || new Date().toISOString(),
      updatedAt: version.updatedAt || data.updatedAt || new Date().toISOString(),
      publishedAt: version.publishedAt
    };
  }) : [
    // Если версий нет, создаем одну версию из данных опроса
    {
      id: data._id,
      version: data.currentVersion || 1,
      status: data.status,
      title: data.title || '',
      description: data.description || '',
      pages: [],
      questions: [],
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      publishedAt: undefined
    }
  ];

  // Возвращаем преобразованный опрос
  const transformedSurvey = {
    id: data._id,
    title: data.title || '',
    description: data.description || '',
    status: data.status,
    currentVersion: data.currentVersion || 1,
    publishedVersion: data.publishedVersion || data.currentVersion || 1,
    versions: versions,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };

  return transformedSurvey;
};

export async function fetchSurveys(): Promise<Survey[]> {
  const data = await apiJson<any[]>(`${API_URL}/surveys`);
  const transformedData = (Array.isArray(data) ? data : []).map(transformSurveyData);
  return transformedData;
}

/**
 * <summary>
 * Получает опрос по ID с сервера.
 * </summary>
 * <param name="id">ID опроса</param>
 * <returns>Данные опроса</returns>
 */
export async function fetchSurveyById(id: string): Promise<Survey> {
  const data = await apiJson<any>(`${API_URL}/surveys?id=${id}`);
  const surveyData = Array.isArray(data) ? data.find(s => s._id === id || s.id === id) : data;
  if (!surveyData) throw new Error('Survey not found');
  return transformSurveyData(surveyData);
}

/**
 * <summary>
 * Создаёт новый опрос на сервере.
 * </summary>
 * <param name="survey">Данные нового опроса</param>
 * <returns>Созданный опрос</returns>
 */
export async function createSurvey(survey: Omit<Survey, 'id'>): Promise<Survey> {
  const data = await apiJson<any>(`${API_URL}/surveys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(survey),
  });
  return transformSurveyData(data);
}

export async function deleteSurvey(id: string): Promise<void> {
  await apiFetch(`${API_URL}/surveys/${id}`, { method: 'DELETE' });
}

export async function updateSurvey(survey: Survey): Promise<Survey> {
  return apiJson<Survey>(`${API_URL}/surveys/${survey.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(survey),
  });
}