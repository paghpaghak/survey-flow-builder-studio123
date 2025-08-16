import type { User, AuthState as AuthStateInterface } from '@survey-platform/shared-types';
import { apiJson } from '@/lib/api';
import { useState, useEffect, useCallback } from 'react';

export function useAuth(): AuthStateInterface & { logout: () => void } {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(async () => {
    try {
      await apiJson('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      // Очищаем localStorage
      localStorage.removeItem('auth-token');
      // Очищаем состояние
      setUser(null);
      setError(null);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await apiJson<{ user: User }>('/api/auth/me');
        setUser(data.user);
        setError(null); // Очищаем ошибки при успешной авторизации
      } catch (error) {
        console.error('Ошибка при проверке авторизации:', error);
        setError(error instanceof Error ? error.message : 'Неизвестная ошибка');
        setUser(null);
        
        // Очищаем localStorage только при определенных ошибках
        if (error instanceof Error) {
          if (error.message.includes('401') || 
              error.message.includes('Не авторизован') ||
              error.message.includes('Unauthorized')) {
            localStorage.removeItem('auth-token');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { user, isLoading, error, logout };
} 