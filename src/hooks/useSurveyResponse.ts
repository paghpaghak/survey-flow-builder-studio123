import { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSurveyProgress } from '@/hooks/use-survey-progress';
import { submitSurveyResponse } from '@/lib/api/survey-response';
import type { Survey, SurveyVersion, CreateSurveyResponseDto } from '@survey-platform/shared-types';

const formSchema = z.object({
  answers: z.record(z.string(), z.any()),
});

type FormValues = z.infer<typeof formSchema>;

export function useSurveyResponse(survey: Survey) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const navigate = useNavigate();

  const version = survey.versions.find(v => v.version === survey.publishedVersion);

  const versionWithSurveyId = version ? {
    ...version,
    surveyId: survey.id,
    createdAt: new Date(version.createdAt),
    updatedAt: new Date(version.updatedAt),
    publishedAt: version.publishedAt ? new Date(version.publishedAt) : undefined,
  } : undefined;

  const { progress, updateProgress, clearProgress } = useSurveyProgress(
    survey,
    versionWithSurveyId!
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      answers: progress.answers,
    },
  });

  useEffect(() => {
    if (Object.keys(progress.answers).length > 0) {
      setShowResumeDialog(true);
    }
  }, [progress.answers]);
  
  const handleNext = () => {
    if (version && progress.currentPageIndex < version.pages.length - 1) {
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
    if (!version) return;
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
  
  const handleFormChange = useCallback(() => {
    const formData = form.getValues();
    updateProgress({
      answers: formData.answers,
    });
  }, [form, updateProgress]);

  useEffect(() => {
    const subscription = form.watch(() => handleFormChange());
    return () => subscription.unsubscribe();
  }, [form, handleFormChange]);

  return {
    form,
    version,
    progress,
    isSubmitting,
    showResumeDialog,
    handleNext,
    handlePrevious,
    handleResume,
    handleStartOver,
    onSubmit,
  };
} 