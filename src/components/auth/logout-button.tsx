'use client';

import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { apiJson } from '@/lib/api';

export function LogoutButton() {
  const navigate = useNavigate();
  const { user, isLoading, error } = useAuth();

  console.log('LogoutButton:', { user, isLoading, error });

  if (isLoading || !user) return null;

  const handleLogout = async () => {
    try {
      await apiJson('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } });

      // Очищаем localStorage
      localStorage.removeItem('auth-token');
      
      // Перенаправляем на страницу входа
      navigate('/login');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      
      // Даже если запрос не прошел, очищаем localStorage
      localStorage.removeItem('auth-token');
      navigate('/login');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Выйти</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-2 py-1.5 text-sm text-muted-foreground">
          {user.email}
        </div>
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Выйти</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 