import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();
  const { user, isLoading } = useAuth();

  if (isLoading) return null; // можно заменить на skeleton
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return <>{children}</>;
}