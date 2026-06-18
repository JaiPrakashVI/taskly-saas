import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  console.log('[Taskly Seeder] Starting database seeding...');

  const demoEmail = 'demo@taskly.app';
  const demoPassword = 'TasklyDemo@2026';

  // 1. Clean up existing demo user if they already exist
  const existingUser = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (existingUser) {
    console.log('[Taskly Seeder] Cleaning up existing demo user data...');
    await prisma.user.delete({
      where: { email: demoEmail },
    });
  }

  // 2. Hash Password for safety
  const hashedPassword = await bcrypt.hash(demoPassword, SALT_ROUNDS);

  // 3. Create the demo User
  const demoUser = await prisma.user.create({
    data: {
      email: demoEmail,
      password: hashedPassword,
    },
  });
  console.log(`[Taskly Seeder] Created Demo User: ${demoUser.email}`);

  // 4. Create 4 simplified projects
  
  // Project 1: Website Design (Completed)
  const projectAarav = await prisma.project.create({
    data: {
      name: 'Website Design',
      description: 'Clean marketing website layout.',
      status: 'COMPLETED',
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-06-10'),
      ownerId: demoUser.id,
    },
  });

  // Project 2: Branding Package (In Progress)
  const projectCoastline = await prisma.project.create({
    data: {
      name: 'Branding Package',
      description: 'Logo design and brand guides.',
      status: 'IN_PROGRESS',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-07-15'),
      ownerId: demoUser.id,
    },
  });

  // Project 3: Mobile App (In Progress)
  const projectArena = await prisma.project.create({
    data: {
      name: 'Mobile App',
      description: 'Booking app for reservations.',
      status: 'IN_PROGRESS',
      startDate: new Date('2026-05-15'),
      endDate: new Date('2026-07-30'),
      ownerId: demoUser.id,
    },
  });

  // Project 4: Marketing Campaign (Not Started)
  const projectSalon = await prisma.project.create({
    data: {
      name: 'Marketing Campaign',
      description: 'Ad designs and social media layouts.',
      status: 'NOT_STARTED',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-08-15'),
      ownerId: demoUser.id,
    },
  });

  console.log('[Taskly Seeder] Created 4 client projects.');

  // 5. Seed tasks spanning different due dates relative to June 18, 2026

  // Tasks for Website Design (Completed)
  await prisma.task.createMany({
    data: [
      {
        name: 'Wireframes',
        description: 'Create page layout wireframes.',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        dueDate: new Date('2026-05-10'),
        projectId: projectAarav.id,
      },
      {
        name: 'API Setup',
        description: 'Integrate third-party API service.',
        priority: 'HIGH',
        status: 'COMPLETED',
        dueDate: new Date('2026-06-05'),
        projectId: projectAarav.id,
      },
      {
        name: 'Deploy Site',
        description: 'Publish live pages and map domain.',
        priority: 'HIGH',
        status: 'COMPLETED',
        dueDate: new Date('2026-06-09'),
        projectId: projectAarav.id,
      },
    ],
  });

  // Tasks for Branding Package (In Progress)
  await prisma.task.createMany({
    data: [
      {
        name: 'Moodboard',
        description: 'Review color schemes and typography.',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        dueDate: new Date('2026-06-05'),
        projectId: projectCoastline.id,
      },
      {
        name: 'Logo Design',
        description: 'Draft logo concepts for review.',
        priority: 'HIGH',
        status: 'PENDING',
        dueDate: new Date('2026-06-12'), // OVERDUE
        projectId: projectCoastline.id,
      },
      {
        name: 'Print Assets',
        description: 'Design printable brand assets.',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        dueDate: new Date('2026-06-18'), // DUE TODAY
        projectId: projectCoastline.id,
      },
      {
        name: 'Draft Review',
        description: 'Present brand draft to client.',
        priority: 'MEDIUM',
        status: 'PENDING',
        dueDate: new Date('2026-06-22'), // DUE THIS WEEK
        projectId: projectCoastline.id,
      },
    ],
  });

  // Tasks for Mobile App (In Progress)
  await prisma.task.createMany({
    data: [
      {
        name: 'App Mockups',
        description: 'Design UI screen mockups.',
        priority: 'HIGH',
        status: 'COMPLETED',
        dueDate: new Date('2026-05-25'),
        projectId: projectArena.id,
      },
      {
        name: 'Calendar Sync',
        description: 'Sync events to calendar.',
        priority: 'MEDIUM',
        status: 'PENDING',
        dueDate: new Date('2026-06-15'), // OVERDUE
        projectId: projectArena.id,
      },
      {
        name: 'Payment Flow',
        description: 'Implement secure checkout flow.',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        dueDate: new Date('2026-06-18'), // DUE TODAY
        projectId: projectArena.id,
      },
      {
        name: 'Coupon Codes',
        description: 'Test discount code logic.',
        priority: 'LOW',
        status: 'PENDING',
        dueDate: new Date('2026-06-24'), // DUE THIS WEEK
        projectId: projectArena.id,
      },
    ],
  });

  // Tasks for Marketing Campaign (Not Started)
  await prisma.task.createMany({
    data: [
      {
        name: 'Research',
        description: 'Analyze competitor campaigns.',
        priority: 'LOW',
        status: 'PENDING',
        dueDate: new Date('2026-07-05'),
        projectId: projectSalon.id,
      },
      {
        name: 'Social Graphics',
        description: 'Design templates for posts.',
        priority: 'MEDIUM',
        status: 'PENDING',
        dueDate: new Date('2026-07-10'),
        projectId: projectSalon.id,
      },
      {
        name: 'Ad Layouts',
        description: 'Draft visual layouts for ads.',
        priority: 'LOW',
        status: 'PENDING',
        dueDate: new Date('2026-07-15'),
        projectId: projectSalon.id,
      },
    ],
  });

  console.log('[Taskly Seeder] Successfully seeded 14 tasks.');
  console.log('[Taskly Seeder] Seeding process completed successfully!');
}

main()
  .catch((e) => {
    console.error('[Taskly Seeder] Error running database seeder:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
