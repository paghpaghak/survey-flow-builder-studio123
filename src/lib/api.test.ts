import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transformSurveyData, fetchSurveys, fetchSurveyById, createSurvey, updateSurvey, deleteSurvey } from './api';

// Мокируем глобальный fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Мокируем console.log и console.error
const mockConsole = {
  log: vi.fn(),
  error: vi.fn()
};
global.console = mockConsole as any;

describe('transformSurveyData', () => {
  it('должен выбрасывать ошибку при отсутствии данных', () => {
    expect(() => transformSurveyData(null)).toThrow('No survey data provided');
    expect(() => transformSurveyData(undefined)).toThrow('No survey data provided');
  });

  it('корректно преобразует базовые данные опроса', () => {
    const inputData = {
      _id: '123',
      title: 'Test Survey',
      description: 'Test Description',
      status: 'draft',
      currentVersion: 1,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    };

    const result = transformSurveyData(inputData);

    expect(result).toEqual({
      id: '123',
      title: 'Test Survey',
      description: 'Test Description',
      status: 'draft',
      currentVersion: 1,
      publishedVersion: 1,
      versions: [{
        id: '123',
        version: 1,
        status: 'draft',
        title: 'Test Survey',
        description: 'Test Description',
        pages: [],
        questions: [],
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        publishedAt: undefined
      }],
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    });
  });

  it('корректно преобразует данные с версиями', () => {
    const inputData = {
      _id: '123',
      title: 'Test Survey',
      status: 'draft',
      versions: [{
        _id: 'v1',
        version: 1,
        title: 'Version 1',
        pages: [{
          _id: 'p1',
          title: 'Page 1'
        }],
        questions: [{
          _id: 'q1',
          pageId: 'p1',
          text: 'Question 1'
        }]
      }]
    };

    const result = transformSurveyData(inputData);

    expect(result.versions[0]).toEqual({
      id: 'v1',
      version: 1,
      status: 'draft',
      title: 'Version 1',
      description: '',
      pages: [{
        id: 'p1',
        title: 'Page 1',
        description: '',
        questions: [{
          _id: 'q1',
          id: 'q1',
          pageId: 'p1',
          text: 'Question 1'
        }]
      }],
      questions: [{
        _id: 'q1',
        id: 'q1',
        pageId: 'p1',
        text: 'Question 1'
      }],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      publishedAt: undefined
    });
  });

  it('корректно обрабатывает отсутствующие поля', () => {
    const inputData = {
      _id: '123'
    };

    const result = transformSurveyData(inputData);

    expect(result).toEqual({
      id: '123',
      title: '',
      description: '',
      status: undefined,
      currentVersion: 1,
      publishedVersion: 1,
      versions: [{
        id: '123',
        version: 1,
        status: undefined,
        title: '',
        description: '',
        pages: [],
        questions: [],
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        publishedAt: undefined
      }],
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    });
  });
});

describe('API Functions', () => {
  beforeEach(() => {
    // Очищаем все моки перед каждым тестом
    vi.clearAllMocks();
  });

  describe('fetchSurveys', () => {
    it('успешно получает список опросов', async () => {
      const mockSurveys = [{
        _id: '1',
        title: 'Survey 1',
        status: 'draft'
      }, {
        _id: '2',
        title: 'Survey 2',
        status: 'published'
      }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSurveys)
      });

      const result = await fetchSurveys();

      expect(mockFetch).toHaveBeenCalledWith('/api/surveys');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    it('выбрасывает ошибку при неудачном запросе', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      });

      await expect(fetchSurveys()).rejects.toThrow('Failed to fetch surveys');
    });
  });

  describe('fetchSurveyById', () => {
    it('успешно получает опрос по ID', async () => {
      const mockSurvey = {
        _id: '123',
        title: 'Test Survey',
        status: 'draft'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSurvey)
      });

      const result = await fetchSurveyById('123');

      expect(mockFetch).toHaveBeenCalledWith('/api/surveys?id=123');
      expect(result.id).toBe('123');
      expect(result.title).toBe('Test Survey');
    });

    it('выбрасывает ошибку при отсутствии опроса', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      });

      await expect(fetchSurveyById('nonexistent')).rejects.toThrow('Survey not found');
    });
  });

  describe('createSurvey', () => {
    it('успешно создает новый опрос', async () => {
      const newSurvey = {
        title: 'New Survey',
        description: 'Description',
        status: 'draft'
      };

      const mockResponse = {
        _id: '123',
        ...newSurvey
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await createSurvey(newSurvey as any);

      expect(mockFetch).toHaveBeenCalledWith('/api/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSurvey),
      });
      expect(result.id).toBe('123');
    });

    it('выбрасывает ошибку при неудачном создании', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false
      });

      await expect(createSurvey({ title: 'Test' } as any)).rejects.toThrow('Failed to create survey');
    });
  });

  describe('updateSurvey', () => {
    it('успешно обновляет опрос', async () => {
      const survey = {
        id: '123',
        title: 'Updated Survey',
        status: 'published'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(survey)
      });

      const result = await updateSurvey(survey as any);

      expect(mockFetch).toHaveBeenCalledWith('/api/surveys/123', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(survey),
      });
      expect(result.id).toBe('123');
    });

    it('выбрасывает ошибку при неудачном обновлении', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false
      });

      await expect(updateSurvey({ id: '123' } as any)).rejects.toThrow('Failed to update survey');
    });
  });

  describe('deleteSurvey', () => {
    it('успешно удаляет опрос', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true
      });

      await deleteSurvey('123');

      expect(mockFetch).toHaveBeenCalledWith('/api/surveys/123', {
        method: 'DELETE',
      });
    });

    it('выбрасывает ошибку при неудачном удалении', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false
      });

      await expect(deleteSurvey('123')).rejects.toThrow('Failed to delete survey');
    });
  });
}); 