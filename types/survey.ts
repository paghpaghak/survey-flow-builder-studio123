export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required?: boolean;
  settings?: Record<string, any>;
  parallelQuestions?: string[];
}

export enum QuestionType {
  Text = 'text',
  Number = 'number',
  Radio = 'radio',
  Checkbox = 'checkbox',
  Select = 'select',
  Date = 'date',
  Time = 'time',
  DateTime = 'datetime',
  Phone = 'phone',
  Email = 'email',
  ParallelGroup = 'parallel_group'
}

export interface Survey {
  _id?: string;
  title: string;
  description?: string;
  questions: Question[];
  createdAt?: Date;
  updatedAt?: Date;
} 