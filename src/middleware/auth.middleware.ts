import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, hasRequiredRole } from '@/lib/auth';
import { UserRole } from '@/types/auth';

export async function requireAuth(
  request: NextRequest,
  requiredRole: UserRole = 'viewer'
) {
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { userId, role } = decoded;
  if (!hasRequiredRole(role, requiredRole)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}

export function withAuth(handler: Function, requiredRole: UserRole = 'viewer') {
  return async (request: NextRequest) => {
    const authResponse = await requireAuth(request, requiredRole);
    if (authResponse.status !== 200) {
      return authResponse;
    }
    return handler(request);
  };
} 