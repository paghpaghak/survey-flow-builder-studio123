import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PageProps {
  params: {
    surveyId: string;
  };
}

export default function ThankYouPage({ params }: PageProps) {
  return (
    <div className="container py-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Спасибо за участие!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Ваши ответы успешно сохранены. Мы ценим ваше время и участие в опросе.
          </p>
          <div className="flex justify-center space-x-4">
            <Button asChild>
              <Link href="/">На главную</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/survey/${params.surveyId}/results`}>
                Посмотреть результаты
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 