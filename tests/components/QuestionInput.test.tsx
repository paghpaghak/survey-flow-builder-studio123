import { render, screen } from '@testing-library/react';
import { QuestionInput } from '../../src/components/survey-take/question-inputs';
import { QuestionType } from '../../src/types/survey';
import { FormProvider, useForm } from 'react-hook-form';
import React from 'react';

function renderWithForm(question: any, name = 'answer') {
  const methods = useForm({ defaultValues: { [name]: question.defaultOptionId } });
  return render(
    <FormProvider {...methods}>
      <QuestionInput question={question} name={name} />
    </FormProvider>
  );
}

describe('QuestionInput', () => {
  const mockQuestion = {
    id: '1',
    pageId: 'page-1',
    type: QuestionType.Select,
    title: 'Test Question',
    options: [
      { id: 'opt1', text: 'Option 1' },
      { id: 'opt2', text: 'Option 2' }
    ],
    defaultOptionId: 'opt1'
  };

  it('should render dropdown with default option selected', () => {
    renderWithForm(mockQuestion);
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('opt1');
  });

  it('should not set default option when value is already set', () => {
    const methods = useForm({ defaultValues: { answer: 'opt2' } });
    render(
      <FormProvider {...methods}>
        <QuestionInput question={mockQuestion} name="answer" />
      </FormProvider>
    );
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('opt2');
  });

  it('should not show default option for non-dropdown questions', () => {
    const textQuestion = { ...mockQuestion, type: QuestionType.Text };
    renderWithForm(textQuestion);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
}); 