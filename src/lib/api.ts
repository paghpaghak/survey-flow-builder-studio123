import { Survey } from '@/types/survey';

const API_BASE_URL = '/api';

// Функция для преобразования данных опроса
export const transformSurveyData = (data: any): Survey => {
  if (!data) {
    throw new Error('No survey data provided');
  }

  console.log('Transforming survey data:', data);
  
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
      const pageQuestions = questions.filter(q => q.pageId === (page.id || page._id));
      
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

  console.log('Transformed survey:', transformedSurvey);
  return transformedSurvey;
};

export async function fetchSurveys(): Promise<Survey[]> {
  console.log('Fetching surveys from:', `${API_BASE_URL}/surveys`);
  const response = await fetch(`${API_BASE_URL}/surveys`);
  console.log('Response status:', response.status);
  if (!response.ok) {
    console.error('Failed to fetch surveys:', response.statusText);
    throw new Error('Failed to fetch surveys');
  }
  const data = await response.json();
  const transformedData = data.map(transformSurveyData);
  console.log('Transformed surveys:', transformedData);
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
  console.log('Fetching survey by ID:', `${API_BASE_URL}/surveys?id=${id}`);
  const response = await fetch(`${API_BASE_URL}/surveys?id=${id}`);
  console.log('Response status:', response.status);
  if (!response.ok) {
    console.error('Failed to fetch survey:', response.statusText);
    throw new Error('Failed to fetch survey');
  }
  const data = await response.json();
  // Проверяем, получили ли мы массив и ищем нужный элемент по id
  const surveyData = Array.isArray(data)
    ? data.find(s => s._id === id || s.id === id)
    : data;
  console.log('Raw survey data:', surveyData);
  
  if (!surveyData) {
    throw new Error('Survey not found');
  }

  const transformedData = transformSurveyData(surveyData);
  console.log('Transformed survey data:', transformedData);
  return transformedData;
}

/**
 * <summary>
 * Создаёт новый опрос на сервере.
 * </summary>
 * <param name="survey">Данные нового опроса</param>
 * <returns>Созданный опрос</returns>
 */
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
  const data = await response.json();
  return transformSurveyData(data);
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