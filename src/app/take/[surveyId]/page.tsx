import { SurveyResponseForm } from '@/components/survey-take/survey-response-form';
import { fetchSurveyById } from '@/lib/api';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    surveyId: string;
  };
}

export default async function TakeSurveyPage({ params }: PageProps) {
  const survey = await fetchSurveyById(params.surveyId);
  
  if (!survey || !survey.publishedVersion) {
    notFound();
  }

  const publishedVersion = survey.versions.find(
    (v) => v.version === survey.publishedVersion
  );

  if (!publishedVersion) {
    notFound();
  }

  return (
    <div className="container py-8">
      <SurveyResponseForm survey={survey} />
    </div>
  );
} 