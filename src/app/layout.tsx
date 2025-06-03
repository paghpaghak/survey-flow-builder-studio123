import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/header';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata = {
  title: 'Система опросов',
  description: 'Создавайте и управляйте опросами',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <TooltipProvider>
          <Header />
          <main className="container py-6">{children}</main>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </body>
    </html>
  );
} 