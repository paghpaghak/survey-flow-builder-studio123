import { z } from 'zod';
import { QUESTION_TYPES } from '@survey-platform/shared-types';

// Auth
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

// Survey
// Настройки для разных типов вопросов
const DateSettingsSchema = z.object({
  format: z.string().optional(),
});

const TextSettingsSchema = z.object({
  inputMask: z.string().optional(),
  showTitleInside: z.boolean().optional(),
});

const SelectSettingsSchema = z.object({
  defaultOptionId: z.string().optional(),
});

const NumberSettingsSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
});

const FileUploadSettingsSchema = z.object({
  allowedTypes: z.array(z.string()),
  maxFileSize: z.number().nonnegative(),
  maxFiles: z.number().int().positive(),
  buttonText: z.string().optional(),
  helpText: z.string().optional(),
});

const ParallelBranchSettingsSchema = z.object({
  sourceQuestionId: z.string(),
  itemLabel: z.string(),
  minItems: z.number().int().nonnegative().optional(),
  maxItems: z.number().int().positive().optional(),
  displayMode: z.enum(['sequential', 'tabs']),
  countLabel: z.string().optional(),
  countDescription: z.string().optional(),
  countRequired: z.boolean().optional(),
});

const settingsByTypeSchema = z.union([
  z.object({ type: z.literal(QUESTION_TYPES.Date), settings: DateSettingsSchema.optional() }),
  z.object({ type: z.literal(QUESTION_TYPES.Text), settings: TextSettingsSchema.optional() }),
  z.object({ type: z.literal(QUESTION_TYPES.Select), settings: SelectSettingsSchema.optional() }),
  z.object({ type: z.literal(QUESTION_TYPES.Number), settings: NumberSettingsSchema.optional() }),
  z.object({ type: z.literal(QUESTION_TYPES.FileUpload), settings: FileUploadSettingsSchema }),
  z.object({ type: z.literal(QUESTION_TYPES.ParallelGroup), settings: ParallelBranchSettingsSchema }),
  z.object({ type: z.literal(QUESTION_TYPES.Radio) }),
  z.object({ type: z.literal(QUESTION_TYPES.Checkbox) }),
  z.object({ type: z.literal(QUESTION_TYPES.Resolution) }),
]);

const QuestionBaseSchema = z.object({
  id: z.string().min(1),
  pageId: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(Object.values(QUESTION_TYPES) as [string, ...string[]]),
  required: z.boolean().optional(),
  description: z.string().optional(),
  options: z.array(z.object({ id: z.string(), text: z.string() })).optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
  transitionRules: z.array(z.any()).optional(),
  parallelQuestions: z.array(z.string()).optional(),
  resolutionRules: z.array(z.any()).optional(),
  defaultResolution: z.string().optional(),
  visibilityRules: z.array(z.any()).optional(),
}).and(settingsByTypeSchema);

const PageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(QuestionBaseSchema),
  descriptionPosition: z.enum(['before', 'after']).optional(),
  visibilityRules: z.array(z.any()).optional(),
});

const SurveyVersionSchema = z.object({
  id: z.string().min(1),
  surveyId: z.string().min(1).optional(),
  version: z.number().int().min(1),
  status: z.enum(['draft', 'published', 'archived']),
  title: z.string().min(1),
  description: z.string().default(''),
  pages: z.array(PageSchema),
  questions: z.array(QuestionBaseSchema),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  publishedAt: z.string().optional(),
  archivedAt: z.string().optional(),
});

export const CreateSurveySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().default(''),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  versions: z.array(SurveyVersionSchema).optional(),
});

export const UpdateSurveySchema = CreateSurveySchema.partial();

// Responses
export const CreateResponseSchema = z.object({
  surveyId: z.string().min(1),
  version: z.number().int().min(1),
  answers: z.array(z.object({
    questionId: z.string().min(1),
    value: z.any(),
    timestamp: z.string().datetime().optional(),
  })).min(1),
  metadata: z.object({
    device: z.string().default('unknown'),
    browser: z.string().default('unknown'),
    duration: z.number().nonnegative().default(0),
  }).optional(),
});

// Files
export const UploadFileSchema = z.object({
  surveyId: z.string().min(1),
  questionId: z.string().min(1),
});


