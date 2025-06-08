import { renderHook, act } from '@testing-library/react';
import { useSurveyStore } from '../../src/store/survey-store';
import React from 'react';

describe('useSurveyStore', () => {
  it('инициализируется с пустым списком опросов', () => {
    const { result } = renderHook(() => useSurveyStore());
    expect(result.current.surveys).toEqual([]);
  });

  it('можно вызвать loadSurveys без ошибок', async () => {
    const { result } = renderHook(() => useSurveyStore());
    await act(async () => {
      await result.current.loadSurveys();
    });
    // Проверяем, что surveys — массив (может быть пустым)
    expect(Array.isArray(result.current.surveys)).toBe(true);
  });

  // Smoke-тест на updateSurveyStatus (без реальных данных)
  it('updateSurveyStatus не выбрасывает ошибку', () => {
    const { result } = renderHook(() => useSurveyStore());
    act(() => {
      result.current.updateSurveyStatus('fake-id', 'draft');
    });
    // Просто smoke: не должно быть ошибок
    expect(true).toBe(true);
  });
}); 