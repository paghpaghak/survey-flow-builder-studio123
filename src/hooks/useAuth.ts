import { useState, useEffect } from 'react';
import { User } from '@/types/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          throw new Error('Не авторизован');
        }
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error('Ошибка при проверке авторизации:', error);
        setError(error instanceof Error ? error.message : 'Неизвестная ошибка');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { user, isLoading, error };
} 