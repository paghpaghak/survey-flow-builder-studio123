'use client';

import { Link } from 'react-router-dom';
import { LogoutButton } from '@/components/auth/logout-button';
import { useUserRole } from '@/hooks/useUserRole';
import { Badge } from '@/components/ui/badge';

export function Header() {
  console.log('Header rendered');
  const { role } = useUserRole();

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'editor': return 'Редактор';
      case 'expert': return 'Эксперт';
      case 'viewer': return 'Просмотр';
      default: return 'Пользователь';
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'editor': return 'bg-blue-500';
      case 'expert': return 'bg-green-500';
      case 'viewer': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex flex-1 items-center">
          <span className="text-3xl font-bold">Опросы</span>
        </div>
        <div className="flex items-center justify-end space-x-4">
          {role && (
            <Badge className={`${getRoleColor(role)} text-white`}>
              {getRoleLabel(role)}
            </Badge>
          )}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
} 