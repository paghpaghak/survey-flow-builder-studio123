import { SurveyList } from '@/components/surveys/SurveyList';

export default function Dashboard() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Конструктор опросов</h1>
      </div>
      <SurveyList />
    </div>
  );
}
