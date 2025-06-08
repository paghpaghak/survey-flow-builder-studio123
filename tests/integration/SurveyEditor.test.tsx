import { render } from '@testing-library/react';
import React from 'react';
import SurveyEditor from '../../src/pages/SurveyEditor';

describe('SurveyEditor', () => {
  it('рендерится без ошибок', () => {
    render(<SurveyEditor />);
  });

  it('падающий тест для проверки запуска', () => {
    expect(1).toBe(2);
  });
}); 