'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { QUESTION_TYPES, type Survey, type SurveyVersion, type QuestionType } from '@survey-platform/shared-types';
import { QuestionInput } from './question-inputs';
import { FormProvider } from 'react-hook-form';
import { submitSurveyResponse } from '@/lib/api/survey-response';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSurveyProgress } from '@/hooks/use-survey-progress';
import type { CreateSurveyResponseDto } from '@survey-platform/shared-types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PlaceholderText } from '@/components/ui/placeholder-text';

interface SurveyResponseFormProps {
  survey: Survey;
}

const formSchema = z.object({
  answers: z.record(z.string(), z.any()),
});

type FormValues = z.infer<typeof formSchema>;

export function SurveyResponseForm({ survey }: SurveyResponseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const navigate = useNavigate();
  
  // Используем опубликованную версию опроса
  const version = survey.versions.find(v => v.version === survey.publishedVersion);
  if (!version) {
    return <div>Error: Survey version not found</div>;
  }
  
  const versionWithSurveyId = {
    ...version,
    surveyId: survey.id,
    createdAt: new Date(version.createdAt),
    updatedAt: new Date(version.updatedAt),
    publishedAt: version.publishedAt ? new Date(version.publishedAt) : undefined,
  };
  const { progress, updateProgress, clearProgress } = useSurveyProgress(
    survey,
    versionWithSurveyId
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      answers: progress.answers,
    },
  });

  // Показываем диалог возобновления, если есть сохраненный прогресс
  useEffect(() => {
    if (Object.keys(progress.answers).length > 0) {
      setShowResumeDialog(true);
    }
  }, [progress.answers]);

  const currentPage = version.pages[progress.currentPageIndex];
  const progressPercentage = ((progress.currentPageIndex + 1) / version.pages.length) * 100;

  const handleNext = () => {
    if (progress.currentPageIndex < version.pages.length - 1) {
      updateProgress({
        currentPageIndex: progress.currentPageIndex + 1,
      });
    }
  };

  const handlePrevious = () => {
    if (progress.currentPageIndex > 0) {
      updateProgress({
        currentPageIndex: progress.currentPageIndex - 1,
      });
    }
  };

  const handleResume = () => {
    setShowResumeDialog(false);
  };

  const handleStartOver = () => {
    clearProgress();
    form.reset({ answers: {} });
    setShowResumeDialog(false);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      const startTime = new Date();
      const answers = Object.entries(data.answers).map(([questionId, value]) => ({
        questionId,
        value,
        timestamp: new Date().toISOString(),
      }));

      const responseData: CreateSurveyResponseDto = {
        surveyId: survey.id,
        version: version.version,
        answers,
        metadata: {
          device: navigator.userAgent,
          browser: navigator.userAgent,
          duration: new Date().getTime() - startTime.getTime(),
        },
      };

      await submitSurveyResponse(responseData);
      
      clearProgress();
      toast.success('Ответы успешно отправлены!');
      navigate(`/surveys/${survey.id}/thank-you`);
    } catch (error) {
      console.error('Ошибка при отправке ответов:', error);
      toast.error('Произошла ошибка при отправке ответов');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Обновляем сохраненные ответы при изменении формы
  const handleFormChange = () => {
    const formData = form.getValues();
    updateProgress({
      answers: formData.answers,
    });
  };

  const answers = form.watch('answers');

  return (
    <>
      <FormProvider {...form}>
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{survey.title}</CardTitle>
            <Progress value={progressPercentage} className="mt-4" />
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              onChange={handleFormChange}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{currentPage.title}</h3>
                {currentPage.description && (
                  <p className="text-sm text-muted-foreground">
                    <PlaceholderText text={currentPage.description} answers={answers} questions={currentPage.questions} />
                  </p>
                )}
                
                <div className="space-y-4">
                  {currentPage.questions?.map((question) => (
                    <div key={question.id} className="space-y-2">
                      <label className="text-sm font-medium">
                        {question.title}
                        {question.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {question.description && (
                        <p className="text-sm text-muted-foreground">
                          <PlaceholderText text={question.description} answers={answers} questions={currentPage.questions} />
                        </p>
                      )}
                      <QuestionInput
                        question={question}
                        name={`answers.${question.id}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={progress.currentPageIndex === 0 || isSubmitting}
                >
                  Назад
                </Button>
                {progress.currentPageIndex === version.pages.length - 1 ? (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Отправка...' : 'Отправить'}
                  </Button>
                ) : (
                  <Button type="button" onClick={handleNext} disabled={isSubmitting}>
                    Далее
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </FormProvider>

      <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Продолжить заполнение?</AlertDialogTitle>
            <AlertDialogDescription>
              У вас есть сохраненный прогресс заполнения этого опроса. Хотите продолжить с того места, где остановились?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStartOver}>
              Начать заново
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleResume}>
              Продолжить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 