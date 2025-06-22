import { render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import SurveyEditor from '../../src/pages/SurveyEditor';

describe('SurveyEditor', () => {
  it('рендерится без ошибок', () => {
    render(
      <MemoryRouter>
        <SurveyEditor />
      </MemoryRouter>
    );
  });
}); 