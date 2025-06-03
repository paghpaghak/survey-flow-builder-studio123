'use client';

import { Link } from 'react-router-dom';
import { LogoutButton } from '@/components/auth/logout-button';

export function Header() {
  console.log('Header rendered');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex flex-1 items-center">
          <span className="text-3xl font-bold">Опросы</span>
        </div>
        <div className="flex items-center justify-end space-x-4">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
} 