import React from 'react';
import { Question, QuestionType } from "@/types/survey";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuestionForm } from "@/hooks/useQuestionForm";
import { useParallelBranch } from "@/hooks/useParallelBranch";
import { useTransitionRules } from "@/hooks/useTransitionRules";
import { 
  QuestionBasicFields, 
  QuestionTypeSelector, 
  QuestionOptionsEditor,
  TypeSpecificSettings,
  ParallelBranchTab,
  QuestionLogicTab
} from "@/components/QuestionForm";
import { needsOptions, mapFormDataToQuestion } from "@/utils/questionUtils";

interface QuestionEditDialogProps {
  question: Question;
  availableQuestions: Question[];
  onClose: () => void;
  onSave?: (updatedQuestion: Question) => void;
  readOnly?: boolean;
}

/**
 * <summary>
 * Диалог редактирования вопроса опроса.
 * Финальная версия с полностью рефакторенной архитектурой.
 * Все функциональные блоки вынесены в отдельные переиспользуемые компоненты.
 * </summary>
 */
export default function QuestionEditDialog({
  question,
  availableQuestions,
  onClose,
  onSave,
  readOnly = false
}: QuestionEditDialogProps) {
  
  // Основная логика формы
  const { formData, errors, updateField, updateTypeAndSettings, validateForm } = 
    useQuestionForm(question);
  
  // Логика параллельной ветки
  const parallelBranch = useParallelBranch(
    formData.type === QuestionType.ParallelGroup ? formData.settings : {},
    formData.parallelQuestions || []
  );

  // Логика правил перехода
  const transitionRules = useTransitionRules(formData.transitionRules);

  // Состояние для редактирования подвопросов
  const [editingSubQuestionId, setEditingSubQuestionId] = React.useState<string | null>(null);

  /**
   * Обработчик сохранения вопроса
   */
  const handleSave = () => {
    if (!validateForm() || parallelBranch.maxItemsError) return;
    
    const updatedQuestion = mapFormDataToQuestion(formData, question);

    // Для параллельной ветки добавляем специфичные данные
    if (formData.type === QuestionType.ParallelGroup) {
      updatedQuestion.settings = parallelBranch.settings;
      updatedQuestion.parallelQuestions = parallelBranch.questions;
    }

    // Добавляем валидные правила перехода
    const validRules = transitionRules.getValidRules();
    if (validRules.length > 0) {
      updatedQuestion.transitionRules = validRules;
    }

    onSave?.(updatedQuestion);
    onClose();
  };

  /**
   * Проверяем, есть ли ошибки для блокировки сохранения
   */
  const hasErrors = Object.keys(errors).length > 0 || !!parallelBranch.maxItemsError;

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="mb-4">
                {readOnly ? 'Просмотр вопроса' : 'Настройка и логика вопроса'}
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="settings">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="settings">Настройка</TabsTrigger>
                <TabsTrigger value={formData.type === QuestionType.ParallelGroup ? "parallel" : "logic"}>
                  {formData.type === QuestionType.ParallelGroup ? "Параллельная ветка" : "Логика"}
                </TabsTrigger>
              </TabsList>

              {/* Вкладка основных настроек */}
              <TabsContent value="settings" className="space-y-4">
                {/* Основные поля вопроса */}
                <QuestionBasicFields
                  data={formData}
                  availableQuestions={availableQuestions}
                  currentQuestionId={question.id}
                  onChange={updateField}
                  readOnly={readOnly}
                  errors={errors}
                />

                {/* Выбор типа вопроса */}
                <QuestionTypeSelector
                  value={formData.type}
                  onChange={updateTypeAndSettings}
                  readOnly={readOnly}
                />

                {/* Редактор вариантов ответов (для соответствующих типов) */}
                {needsOptions(formData.type) && !readOnly && (
                  <QuestionOptionsEditor
                    options={formData.options}
                    onChange={(options) => updateField('options', options)}
                    readOnly={readOnly}
                    errors={errors}
                  />
                )}

                {/* Настройки, специфичные для типа */}
                <TypeSpecificSettings
                  type={formData.type}
                  settings={formData.settings}
                  onChange={(settings) => updateField('settings', settings)}
                  readOnly={readOnly}
                />
              </TabsContent>

              {/* Вкладка параллельной ветки или логики */}
              {formData.type === QuestionType.ParallelGroup ? (
                <ParallelBranchTab
                  title={formData.title}
                  description={formData.description}
                  onTitleChange={(title) => updateField('title', title)}
                  onDescriptionChange={(description) => updateField('description', description)}
                  parallelBranch={parallelBranch}
                  availableQuestions={availableQuestions}
                  currentQuestionId={question.id}
                  onEditSubQuestion={setEditingSubQuestionId}
                  readOnly={readOnly}
                />
              ) : (
                <QuestionLogicTab
                  transitionRules={transitionRules}
                  options={formData.options}
                  availableQuestions={availableQuestions}
                  currentQuestionId={question.id}
                  readOnly={readOnly}
                />
              )}
            </Tabs>
          </div>
          
          {/* Футер с кнопками */}
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={onClose}>
              {readOnly ? 'Закрыть' : 'Отмена'}
            </Button>
            {!readOnly && onSave && (
              <Button 
                onClick={handleSave}
                disabled={hasErrors}
              >
                Сохранить
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Рекурсивный диалог для редактирования подвопросов */}
      {editingSubQuestionId && (
        <QuestionEditDialog
          question={availableQuestions.find(q => q.id === editingSubQuestionId)!}
          availableQuestions={availableQuestions.filter(q => 
            parallelBranch.questions.includes(q.id) && q.id !== editingSubQuestionId
          )}
          onClose={() => setEditingSubQuestionId(null)}
          onSave={updatedQ => {
            onSave?.(updatedQ);
            setEditingSubQuestionId(null);
          }}
        />
      )}
    </>
  );
}