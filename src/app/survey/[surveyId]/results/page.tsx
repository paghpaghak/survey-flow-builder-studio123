import { getSurveyById } from '@/lib/api';
import { getSurveyResponses } from '@/lib/api/survey-results';
import { AnswerStats } from '@/components/survey-results/answer-stats';
import { SimpleResultsTable } from '@/components/survey-results/simple-results-table';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    surveyId: string;
  };
}

export default async function SurveyResultsPage({ params }: PageProps) {
  const survey = await getSurveyById(params.surveyId);
  
  if (!survey || !survey.publishedVersion) {
    notFound();
  }

  const publishedVersion = survey.versions.find(
    (v) => v.version === survey.publishedVersion
  );

  if (!publishedVersion) {
    notFound();
  }

  const responses = await getSurveyResponses(params.surveyId);

  return (
    <div className="container py-8 space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{survey.title}</h1>
        <p className="text-muted-foreground">
          Всего ответов: {responses.length}
        </p>
      </div>

      <SimpleResultsTable
        survey={survey}
        responses={responses}
        questions={publishedVersion.questions}
      />

      <div className="grid gap-8">
        {publishedVersion.questions.map((question) => (
          <AnswerStats
            key={question.id}
            question={question}
            responses={responses}
          />
        ))}
      </div>
    </div>
  );
} 