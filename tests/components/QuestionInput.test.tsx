import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FormProvider, useForm } from 'react-hook-form';
import React from 'react';
import '@testing-library/jest-dom';

import { QuestionInput } from '../../src/components/survey-take/question-inputs';
import { QUESTION_TYPES, type Question } from '@survey-platform/shared-types';

// Helper to wrap component in react-hook-form's FormProvider
const TestFormProvider = ({ children, defaultValues }: { children: React.ReactNode, defaultValues?: any }) => {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

const renderWithForm = (question: Question, name = 'answer') => {
  // @ts-ignore - In tests, we know when this property exists.
  const defaultValues = { [name]: question.settings?.defaultOptionId || '' };
  return render(
    <TestFormProvider defaultValues={defaultValues}>
      <QuestionInput question={question} name={name} />
    </TestFormProvider>
  );
};

describe('QuestionInput', () => {
  it('should render dropdown with default option selected for "Select" type', () => {
    const mockQuestion: Question = {
      id: 'q1',
      pageId: 'p1',
      type: QUESTION_TYPES.Select,
      title: 'Select an option',
      options: [
        { id: 'opt1', text: 'Option 1' },
        { id: 'opt2', text: 'Option 2' },
      ],
      settings: { defaultOptionId: 'opt2' },
      required: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Question;

    renderWithForm(mockQuestion);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    // The value of the select should be the defaultOptionId from settings
    expect(screen.getByDisplayValue('Option 2')).toBeInTheDocument();
  });

  it('should render a text input for "Text" type', () => {
    const mockQuestion: Question = {
      id: 'q2',
      pageId: 'p1',
      type: QUESTION_TYPES.Text,
      title: 'Enter some text',
      settings: {},
      options: [],
      required: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Question;

    renderWithForm(mockQuestion);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
}); 