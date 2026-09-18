import { Role, TaskStatus } from '@prisma/client';
import { prisma } from '../src/lib/prisma';

async function main() {
  const hashedPassword = await Bun.password.hash('password123');

  // Create Users
  const pmUser = await prisma.user.upsert({
    where: { email: 'pm@nodewave.com' },
    update: {},
    create: {
      email: 'pm@nodewave.com',
      password: hashedPassword,
      name: 'Project Manager',
      role: Role.PROJECT_MANAGER,
    },
  });

  const devUser = await prisma.user.upsert({
    where: { email: 'dev@nodewave.com' },
    update: {},
    create: {
      email: 'dev@nodewave.com',
      password: hashedPassword,
      name: 'Developer',
      role: Role.INTERNAL_TEAM,
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: 'client@nodewave.com' },
    update: {},
    create: {
      email: 'client@nodewave.com',
      password: hashedPassword,
      name: 'Client Guest',
      role: Role.CLIENT_GUEST,
    },
  });

  // Create Project
  const project = await prisma.project.create({
    data: {
      name: 'Nodewave Assessment Project',
      description: 'Initial project for assessment',
      ownerId: pmUser.id,
    },
  });

  // Create Tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Task 1',
      description: 'Task 1 description',
      status: TaskStatus.TODO,
      projectId: project.id,
      assigneeId: devUser.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Task 2',
      description: 'Task 2 description',
      status: TaskStatus.IN_PROGRESS,
      projectId: project.id,
      assigneeId: devUser.id,
    },
  });

  // Create Task Dependency
  await prisma.taskDependency.create({
    data: {
      taskId: task2.id,
      dependsOnTaskId: task1.id,
    },
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
