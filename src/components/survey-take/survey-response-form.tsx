'use client';

import { FormProvider } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSurveyResponse } from '@/hooks/useSurveyResponse';
import { SurveyPage } from './survey-page';
import { SurveyNavigation } from './survey-navigation';
import { ResumeSurveyDialog } from './resume-survey-dialog';
import type { Survey } from '@survey-platform/shared-types';

interface SurveyResponseFormProps {
  survey: Survey;
}

export function SurveyResponseForm({ survey }: SurveyResponseFormProps) {
  const {
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
  } = useSurveyResponse(survey);

  if (!version) {
    return <div>Error: Survey version not found.</div>;
  }

  const currentPage = version.pages[progress.currentPageIndex];
  const progressPercentage = ((progress.currentPageIndex + 1) / version.pages.length) * 100;

  return (
    <>
      <FormProvider {...form}>
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{survey.title}</CardTitle>
            <Progress value={progressPercentage} className="mt-4" />
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <SurveyPage
                page={currentPage}
                answers={form.getValues('answers')}
                allQuestions={version.questions}
              />
              <SurveyNavigation
                onPrevious={handlePrevious}
                onNext={handleNext}
                isSubmitting={isSubmitting}
                isFirstPage={progress.currentPageIndex === 0}
                isLastPage={progress.currentPageIndex === version.pages.length - 1}
              />
            </form>
          </CardContent>
        </Card>
      </FormProvider>

      <ResumeSurveyDialog
        open={showResumeDialog}
        onResume={handleResume}
        onStartOver={handleStartOver}
      />
    </>
  );
} 