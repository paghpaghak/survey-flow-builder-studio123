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

// ===== Условная логика переходов между вопросами =====
export const TransitionRuleSchema = z.object({
  id: z.string().min(1),
  answer: z.string().min(1),
  nextQuestionId: z.string().min(1),
  condition: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains']).optional(),
  value: z.union([z.string(), z.number()]).optional(),
});

// ===== Условная логика видимости =====
export const VisibilityConditionSchema = z.union([
  z.object({ type: z.literal('answer_equals'), questionId: z.string(), value: z.union([z.string(), z.number(), z.boolean()]) }),
  z.object({ type: z.literal('answer_not_equals'), questionId: z.string(), value: z.union([z.string(), z.number(), z.boolean()]) }),
  z.object({ type: z.literal('answer_contains'), questionId: z.string(), value: z.string() }),
  z.object({ type: z.literal('answer_greater_than'), questionId: z.string(), value: z.number() }),
  z.object({ type: z.literal('answer_less_than'), questionId: z.string(), value: z.number() }),
  z.object({ type: z.literal('answer_includes'), questionId: z.string(), value: z.string() }),
  z.object({ type: z.literal('answered'), questionId: z.string() }),
  z.object({ type: z.literal('not_answered'), questionId: z.string() }),
]);

export const VisibilityGroupSchema = z.object({
  id: z.string(),
  logic: z.enum(['AND', 'OR']),
  conditions: z.array(VisibilityConditionSchema),
});

export const QuestionVisibilityRuleSchema = z.object({
  id: z.string(),
  action: z.enum(['show', 'hide']),
  groups: z.array(VisibilityGroupSchema),
  groupsLogic: z.enum(['AND', 'OR']),
});

export const PageVisibilityRuleSchema = z.object({
  id: z.string(),
  action: z.enum(['show', 'hide']),
  groups: z.array(VisibilityGroupSchema),
  groupsLogic: z.enum(['AND', 'OR']),
});

// ===== Правила резолюции =====
export const ResolutionRuleSchema = z.object({
  id: z.string(),
  conditions: z.array(
    z.object({
      questionId: z.string(),
      operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'includes']),
      value: z.union([z.string(), z.number(), z.boolean()]),
    })
  ),
  logic: z.enum(['AND', 'OR']),
  resultText: z.string(),
});

const QuestionBaseSchema = z.object({
  id: z.string().min(1),
  pageId: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(Object.values(QUESTION_TYPES) as [string, ...string[]]),
  required: z.boolean().optional(),
  description: z.string().optional(),
  options: z.array(z.object({ id: z.string(), text: z.string() })).optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
  transitionRules: z.array(TransitionRuleSchema).optional(),
  parallelQuestions: z.array(z.string()).optional(),
  resolutionRules: z.array(ResolutionRuleSchema).optional(),
  defaultResolution: z.string().optional(),
  visibilityRules: z.array(QuestionVisibilityRuleSchema).optional(),
}).and(settingsByTypeSchema);

const PageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(QuestionBaseSchema),
  descriptionPosition: z.enum(['before', 'after']).optional(),
  visibilityRules: z.array(PageVisibilityRuleSchema).optional(),
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

// Дополнительная проверка: запрет глубины > 1 и циклов для ParallelGroup
function validateParallelGroups(questions: any[]): void {
  const byId = new Map<string, any>(questions.map(q => [q.id, q]));
  for (const q of questions) {
    if (q.type !== QUESTION_TYPES.ParallelGroup) continue;
    const children: string[] = Array.isArray(q.parallelQuestions) ? q.parallelQuestions : [];
    for (const childId of children) {
      const child = byId.get(childId);
      if (!child) continue;
      // Запрет самоссылок и циклов
      if (childId === q.id) {
        throw new Error('Параллельная ветка не может ссылаться на саму себя');
      }
      // Запрет глубины > 1: дочерняя PG не должна содержать PG
      if (child.type === QUESTION_TYPES.ParallelGroup) {
        const grandChildren: string[] = Array.isArray(child.parallelQuestions) ? child.parallelQuestions : [];
        const hasPgGrand = grandChildren.some(gcId => (byId.get(gcId)?.type === QUESTION_TYPES.ParallelGroup));
        if (hasPgGrand) {
          throw new Error('Запрещена вложенность параллельных веток глубже одного уровня');
        }
      }
    }
  }
}

// Базовая схема опроса без доп. проверок, чтобы можно было брать partial()
const BaseSurveySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().default(''),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  versions: z.array(SurveyVersionSchema).optional(),
});

export const CreateSurveySchema = BaseSurveySchema.superRefine((data, ctx) => {
  try {
    const questions = data.versions?.flatMap(v => v.questions) || [];
    validateParallelGroups(questions);
  } catch (e: any) {
    ctx.addIssue({ code: 'custom', message: e?.message || 'Ошибка валидации параллельных веток' });
  }
});

export const UpdateSurveySchema = BaseSurveySchema.partial().superRefine((data, ctx) => {
  try {
    const questions = data.versions?.flatMap((v: any) => v.questions) || [];
    validateParallelGroups(questions);
  } catch (e: any) {
    ctx.addIssue({ code: 'custom', message: e?.message || 'Ошибка валидации параллельных веток' });
  }
});

// Responses
export const CreateResponseSchema = z.object({
  surveyId: z.string().min(1),
  version: z.number().int().min(1),
  answers: z.array(z.object({
    questionId: z.string().min(1),
    value: z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.array(z.string()),
      z.object({}).passthrough(), // допускаем сложные объекты (parallel, file uploads)
    ]),
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


