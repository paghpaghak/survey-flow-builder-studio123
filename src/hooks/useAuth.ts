import type { User, AuthState as AuthStateInterface } from '@survey-platform/shared-types';
import { apiJson } from '@/lib/api';
import { useState, useEffect } from 'react';

export function useAuth(): AuthStateInterface {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await apiJson<{ user: User }>('/api/auth/me');
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