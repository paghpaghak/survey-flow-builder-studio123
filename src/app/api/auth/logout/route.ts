import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { serialize } from 'cookie';

export async function POST() {
  try {
    // Удаляем cookie с токеном
    const response = NextResponse.json({ success: true });
    response.headers.set(
      'Set-Cookie',
      serialize('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0),
        path: '/',
      })
    );
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
} 