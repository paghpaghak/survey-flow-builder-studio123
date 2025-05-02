import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export function ThankYou() {
  const navigate = useNavigate();

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Спасибо за ваши ответы!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Ваши ответы были успешно сохранены. Благодарим за участие в опросе!
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            Вернуться на главную
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default ThankYou; 