import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth';
import { Role } from '@prisma/client';

const authRoutes = new Hono();

authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return c.json({ error: 'User with this email already exists' }, 400);
    }

    const hashedPassword = await hashPassword(password);
    const userRole = role && Object.values(Role).includes(role as Role) ? (role as Role) : Role.INTERNAL_TEAM;

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: userRole,
      },
    });

    return c.json(
      {
        message: 'User registered successfully',
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      },
      201
    );
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const token = await generateToken({ id: user.id, email: user.email, role: user.role });

    return c.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { authRoutes };
