import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';

function isAuthenticated(): boolean {
  // Проверяем наличие токена в localStorage (или можно заменить на cookie)
  return Boolean(localStorage.getItem('auth-token'));
}

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
} 