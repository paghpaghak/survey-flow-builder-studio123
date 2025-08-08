import { useAuth } from './useAuth';
import type { UserRole } from '@survey-platform/shared-types';

const roleOrder: Record<UserRole, number> = {
  viewer: 1,
  expert: 2,
  editor: 3,
  admin: 4,
};

export function useUserRole() {
  const { user } = useAuth();

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!user?.role) return false;
    const userRole = user.role as UserRole;
    return roleOrder[userRole] >= roleOrder[requiredRole];
  };

  const hasAnyRole = (...roles: UserRole[]): boolean => {
    if (!user?.role) return false;
    return roles.includes(user.role as UserRole);
  };

  const canCreateSurvey = hasRole('editor');
  const canEditSurvey = hasRole('editor');
  const canDeleteSurvey = hasRole('editor');
  const canViewResponses = hasRole('expert');
  const canManageUsers = hasRole('admin');
  const canAccessAdminPanel = hasRole('admin');

  return {
    role: user?.role as UserRole | undefined,
    hasRole,
    hasAnyRole,
    canCreateSurvey,
    canEditSurvey,
    canDeleteSurvey,
    canViewResponses,
    canManageUsers,
    canAccessAdminPanel,
  };
}

