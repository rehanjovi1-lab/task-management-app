import { Context } from 'hono';
import type { Next } from 'hono';
import { Role } from '@prisma/client';
import { verifyToken } from '../utils/auth';
import type { JwtPayload } from '../utils/auth';

export type Variables = {
  user: JwtPayload;
};

export const authMiddleware = async (c: Context<{ Variables: Variables }>, next: Next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing or invalid token' }, 401);
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return c.json({ error: 'Unauthorized: Missing token' }, 401);
  }
  const payload = await verifyToken(token);

  if (!payload) {
    return c.json({ error: 'Unauthorized: Invalid or expired token' }, 401);
  }

  c.set('user', payload);
  await next();
};

export const requireRole = (allowedRoles: Role[]) => {
  return async (c: Context<{ Variables: Variables }>, next: Next) => {
    const user = c.get('user');
    if (!user || !allowedRoles.includes(user.role)) {
      return c.json({ error: 'Forbidden: Insufficient permissions' }, 403);
    }
    await next();
  };
};
