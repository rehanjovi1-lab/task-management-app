import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { authMiddleware, requireRole } from '../middleware/auth';
import type { Variables } from '../middleware/auth';
import { Role, TaskStatus, TaskPriority } from '@prisma/client';

const tasksRoutes = new Hono<{ Variables: Variables }>();

// Protect all routes
tasksRoutes.use('*', authMiddleware);

// GET /tasks
tasksRoutes.get('/', async (c) => {
  const projectId = c.req.query('projectId');
  const status = c.req.query('status');

  const tasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      ...(projectId ? { projectId } : {}),
      ...(status ? { status: status as TaskStatus } : {}),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
    },
  });

  return c.json({ tasks });
});

// POST /tasks
tasksRoutes.post('/', requireRole([Role.PROJECT_MANAGER, Role.INTERNAL_TEAM]), async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  let { title, description, projectId, assigneeId, priority, status } = body;

  if (!title) {
    return c.json({ error: 'Title is required', message: 'Title is required' }, 400);
  }

  if (!projectId) {
    const firstProject = await prisma.project.findFirst({ where: { deletedAt: null } });
    if (firstProject) {
      projectId = firstProject.id;
    } else {
      return c.json({ error: 'Title and projectId are required', message: 'Title and projectId are required' }, 400);
    }
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      status: (status as TaskStatus) || TaskStatus.TODO,
      projectId,
      assigneeId,
      priority: (priority as TaskPriority) || TaskPriority.MEDIUM,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'CREATE_TASK',
      entity: 'Task',
      entityId: task.id,
      userId: user.id,
      payload: body,
    },
  });

  return c.json({ message: 'Task created', task }, 201);
});

// PUT or PATCH /tasks/:id
tasksRoutes.on(['PUT', 'PATCH'], '/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();

  const { version, status, title, description, priority, assigneeId } = body;

  if (version === undefined) {
    return c.json({ error: 'Version is required for updates', message: 'Version is required for updates' }, 400);
  }

  const existingTask = await prisma.task.findUnique({
    where: { id },
    include: {
      dependencies: { include: { dependsOnTask: true } },
    },
  });

  if (!existingTask || existingTask.deletedAt) {
    return c.json({ error: 'Task not found', message: 'Task not found' }, 404);
  }

  if (existingTask.version !== version) {
    return c.json({ error: 'Task has been modified by another user', message: 'Task has been modified by another user' }, 409);
  }

  if (status === TaskStatus.DONE) {
    const unresolvedDependencies = existingTask.dependencies.filter(
      (dep) => dep.dependsOnTask && dep.dependsOnTask.status !== TaskStatus.DONE
    );
    if (unresolvedDependencies.length > 0) {
      return c.json({ error: 'Cannot complete task. Unresolved dependencies exist.', message: 'Cannot complete task. Unresolved dependencies exist.' }, 400);
    }
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      title,
      description,
      status: status as TaskStatus,
      priority: priority as TaskPriority,
      assigneeId,
      version: { increment: 1 },
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'UPDATE_TASK',
      entity: 'Task',
      entityId: updatedTask.id,
      userId: user.id,
      payload: body,
    },
  });

  return c.json({ message: 'Task updated', task: updatedTask });
});

// POST /tasks/:id/dependencies
tasksRoutes.post('/:id/dependencies', requireRole([Role.PROJECT_MANAGER]), async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'ID required' }, 400);
  const body = await c.req.json();
  const { dependsOnTaskId } = body;

  if (!dependsOnTaskId) {
    return c.json({ error: 'dependsOnTaskId is required' }, 400);
  }

  if (id === dependsOnTaskId) {
    return c.json({ error: 'Task cannot depend on itself' }, 400);
  }

  const [task, dependsOnTask] = await Promise.all([
    prisma.task.findUnique({ where: { id } }),
    prisma.task.findUnique({ where: { id: dependsOnTaskId } }),
  ]);

  if (!task || !dependsOnTask || task.deletedAt || dependsOnTask.deletedAt) {
    return c.json({ error: 'One or both tasks not found' }, 404);
  }

  try {
    const dependency = await prisma.taskDependency.create({
      data: {
        taskId: id,
        dependsOnTaskId,
      },
    });

    return c.json({ message: 'Dependency added', dependency }, 201);
  } catch (error) {
    return c.json({ error: 'Dependency already exists or error occurred' }, 400);
  }
});

// DELETE /tasks/:id
tasksRoutes.delete('/:id', requireRole([Role.PROJECT_MANAGER]), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'ID required' }, 400);

  const task = await prisma.task.findUnique({ where: { id } });

  if (!task || task.deletedAt) {
    return c.json({ error: 'Task not found' }, 404);
  }

  await prisma.task.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      action: 'DELETE_TASK',
      entity: 'Task',
      entityId: id,
      userId: user.id,
      payload: { deleted: true },
    },
  });

  return c.json({ message: 'Task deleted' });
});

export { tasksRoutes };
