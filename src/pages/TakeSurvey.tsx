import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SurveyResponseForm } from '@/components/survey-take/survey-response-form';
import { Survey } from '@/types/survey';
import { fetchSurveyById } from '@/lib/api';

export const TakeSurvey = () => {
  const { surveyId } = useParams();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        if (!surveyId) {
          setError('Survey ID is required');
          return;
        }
        const surveyData = await fetchSurveyById(surveyId);
        console.log('Survey data:', {
          id: surveyData.id,
          status: surveyData.status,
          versionsCount: surveyData.versions?.length,
          versions: surveyData.versions?.map(v => ({
            id: v.id,
            version: v.version,
            status: v.status,
            pagesCount: v.pages?.length,
            questionsCount: v.questions?.length
          }))
        });
        setSurvey(surveyData);
      } catch (err) {
        console.error('Error fetching survey:', err);
        setError('Failed to load survey');
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [surveyId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !survey) {
    return <div>{error || 'Survey not found'}</div>;
  }

  // Находим опубликованную версию
  const publishedVersion = survey.versions?.find(
    v => v.status === 'published' && v.pages?.length > 0 && v.questions?.length > 0
  );

  if (!publishedVersion) {
    return <div>This survey has no published version.</div>;
  }

  // Создаем объект опроса с опубликованной версией
  const surveyWithPublishedVersion: Survey = {
    ...survey,
    currentVersion: publishedVersion.version,
    versions: [publishedVersion]
  };

  return <SurveyResponseForm survey={surveyWithPublishedVersion} />;
};

export default TakeSurvey; 