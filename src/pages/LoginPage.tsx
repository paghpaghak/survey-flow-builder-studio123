import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/login-form';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Если загрузка завершена и пользователь есть, перенаправляем его
    if (!isLoading && user) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  // Пока идет проверка авторизации, можно показать лоадер или пустой экран
  if (isLoading) {
    return <div>Загрузка...</div>; // или null
  }
  
  // Если пользователь не авторизован, показываем форму входа
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <LoginForm />
    </div>
  );
} 