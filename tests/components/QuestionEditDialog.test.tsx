import { render, screen, fireEvent } from '@testing-library/react';
import QuestionEditDialog from '../../src/components/survey-editor/QuestionEditDialog';
import { useSurveyStore } from '../../src/store/survey-store';
import { QuestionType } from '../../src/types/survey';
import '@testing-library/jest-dom';
import React from 'react';

// Mock the store
jest.mock('@/store/useSurveyStore');

describe('QuestionEditDialog', () => {
  const mockQuestion = {
    id: '1',
    pageId: 'p1',
    type: QuestionType.Select,
    title: 'Test Question',
    options: [
      { id: 'opt1', text: 'Option 1' },
      { id: 'opt2', text: 'Option 2' }
    ],
    defaultOptionId: 'opt1'
  };

  const mockUpdateQuestion = jest.fn();

  beforeEach(() => {
    (useSurveyStore as unknown as jest.Mock).mockReturnValue({
      updateQuestion: mockUpdateQuestion
    });
  });

  it('should render default option selector for dropdown questions', () => {
    render(
      <QuestionEditDialog
     question={mockQuestion}
     availableQuestions={[]}
     onClose={() => {}}
      />
    );

    expect(screen.getByText('Default Option')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should not render default option selector for non-dropdown questions', () => {
    const textQuestion = { ...mockQuestion, type: QuestionType.Text };
    
    render(
      <QuestionEditDialog
     question={mockQuestion}
     availableQuestions={[]}
     onClose={() => {}}
      />
    );

    expect(screen.queryByText('Default Option')).not.toBeInTheDocument();
  });

  it('should update default option when selection changes', () => {
    render(
      <QuestionEditDialog
     question={mockQuestion}
     availableQuestions={[]}
     onClose={() => {}}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'opt2' } });

    expect(mockUpdateQuestion).toHaveBeenCalledWith('1', {
      defaultOptionId: 'opt2'
    });
  });

  it('should show current default option in selector', () => {
    render(
      <QuestionEditDialog
     question={mockQuestion}
     availableQuestions={[]}
     onClose={() => {}}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('opt1');
  });
}); 