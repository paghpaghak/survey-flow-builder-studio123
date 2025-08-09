import type { NextFunction, Response } from 'express';
import type { RequestWithUser } from '../types/api';
import type { UserRole } from '@survey-platform/shared-types';

const roleOrder: Record<UserRole, number> = {
  viewer: 1,
  expert: 2,
  editor: 3,
  admin: 4,
};

export function requireRole(required: UserRole) {
  return (req: RequestWithUser, res: Response, next: NextFunction): void => {
    const role = req.user?.role as UserRole | undefined;
    if (!role || roleOrder[role] < roleOrder[required]) {
      res.status(403).json({ error: 'Недостаточно прав' });
      return;
    }
    next();
  };
}

export function requireAnyRole(...roles: UserRole[]) {
  return (req: RequestWithUser, res: Response, next: NextFunction): void => {
    const role = req.user?.role as UserRole | undefined;
    if (!role || !roles.includes(role)) {
      res.status(403).json({ error: 'Недостаточно прав' });
      return;
    }
    next();
  };
}



