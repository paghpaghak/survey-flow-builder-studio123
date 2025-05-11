import { useState, useEffect } from 'react';

interface AuthState {
  isAdmin: boolean;
  isLoading: boolean;
}

export function useAuth(): AuthState {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Здесь должна быть реальная проверка прав доступа
    // Например, через API или JWT токен
    const checkAuth = async () => {
      try {
        // Временная заглушка для демонстрации
        // В реальном приложении здесь будет запрос к API
        const isUserAdmin = localStorage.getItem('isAdmin') === 'true';
        setIsAdmin(isUserAdmin);
      } catch (error) {
        console.error('Ошибка при проверке прав доступа:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { isAdmin, isLoading };
} 