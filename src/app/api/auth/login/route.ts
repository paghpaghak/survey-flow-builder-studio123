import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authenticateUser, generateToken } from '@/lib/auth';
import { LoginCredentials } from '@/types/auth';
import { serialize } from 'cookie';

export async function POST(request: NextRequest) {
  try {
    const credentials: LoginCredentials = await request.json();
    const user = await authenticateUser(credentials);

    if (!user) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    const token = generateToken(user.id, user.role);
    
    // Возвращаем данные пользователя без пароля
    const { passwordHash, ...userWithoutPassword } = user.toObject();
    
    const response = NextResponse.json({
      user: userWithoutPassword,
      token,
    });
    response.headers.set(
      'Set-Cookie',
      serialize('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24,
        path: '/',
      })
    );
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
} 