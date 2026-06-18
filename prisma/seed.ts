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

  // 4. Create 4 realistic small-business freelance projects
  
  // Project 1: Aarav Furnishings (Completed website contract)
  const projectAarav = await prisma.project.create({
    data: {
      name: 'Aarav Furnishings',
      description: 'E-commerce showroom site showcasing handmade wooden furniture catalog and local shipping rate calculator.',
      status: 'COMPLETED',
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-06-10'),
      ownerId: demoUser.id,
    },
  });

  // Project 2: Coastline Cafe (In Progress branding & website)
  const projectCoastline = await prisma.project.create({
    data: {
      name: 'Coastline Cafe',
      description: 'Branding package and one-page menu website with dynamic digital ordering integration.',
      status: 'IN_PROGRESS',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-07-15'),
      ownerId: demoUser.id,
    },
  });

  // Project 3: Tiruvallur Sports Arena (In Progress client reservation app)
  const projectArena = await prisma.project.create({
    data: {
      name: 'Tiruvallur Sports Arena',
      description: 'Building custom court reservation and membership scheduling calendar portal for local matches.',
      status: 'IN_PROGRESS',
      startDate: new Date('2026-05-15'),
      endDate: new Date('2026-07-30'),
      ownerId: demoUser.id,
    },
  });

  // Project 4: Urban Edge Salon (Not Started layout design)
  const projectSalon = await prisma.project.create({
    data: {
      name: 'Urban Edge Salon',
      description: 'UX wireframing and design layouts for service menus and stylist booking pages.',
      status: 'NOT_STARTED',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-08-15'),
      ownerId: demoUser.id,
    },
  });

  console.log('[Keel Seeder] Created 4 client projects.');

  // 5. Seed tasks spanning different due dates relative to June 18, 2026

  // Tasks for Aarav Furnishings (Completed)
  await prisma.task.createMany({
    data: [
      {
        name: 'Showroom Catalog Layout',
        description: 'Design dynamic catalog pages for sectional sofas and teak dining sets.',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        dueDate: new Date('2026-05-10'),
        projectId: projectAarav.id,
      },
      {
        name: 'Shipping Rate API Integration',
        description: 'Map local shipping courier charges based on pin code distance.',
        priority: 'HIGH',
        status: 'COMPLETED',
        dueDate: new Date('2026-06-05'),
        projectId: projectAarav.id,
      },
      {
        name: 'Domain Mapping & Live Deployment',
        description: 'Connect aaravfurnishings.com domain and configure secure SSL certificates.',
        priority: 'HIGH',
        status: 'COMPLETED',
        dueDate: new Date('2026-06-09'),
        projectId: projectAarav.id,
      },
    ],
  });

  // Tasks for Coastline Cafe (In Progress)
  await prisma.task.createMany({
    data: [
      {
        name: 'Brand Typography & Moodboard',
        description: 'Review coastal color schemes and select clean typography systems.',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        dueDate: new Date('2026-06-05'),
        projectId: projectCoastline.id,
      },
      {
        name: 'Menu Card Layout Design',
        description: 'Create print-ready PDF and matching mobile menu layout wireframes.',
        priority: 'HIGH',
        status: 'PENDING',
        dueDate: new Date('2026-06-12'), // OVERDUE (June 12 is before June 18)
        projectId: projectCoastline.id,
      },
      {
        name: 'QR Ordering Setup',
        description: 'Generate dynamic QR code linking table seating to menu parameters.',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        dueDate: new Date('2026-06-18'), // DUE TODAY
        projectId: projectCoastline.id,
      },
      {
        name: 'Menu Website Draft Submission',
        description: 'Present draft hosting URL to client for copy signoff.',
        priority: 'MEDIUM',
        status: 'PENDING',
        dueDate: new Date('2026-06-22'), // DUE THIS WEEK
        projectId: projectCoastline.id,
      },
    ],
  });

  // Tasks for Tiruvallur Sports Arena (In Progress)
  await prisma.task.createMany({
    data: [
      {
        name: 'Court Booking Layout Mockups',
        description: 'Submit mobile wireframes for choosing court timeslots.',
        priority: 'HIGH',
        status: 'COMPLETED',
        dueDate: new Date('2026-05-25'),
        projectId: projectArena.id,
      },
      {
        name: 'Calendar Sync Integration',
        description: 'Sync booking reservations with staff Google Calendars.',
        priority: 'MEDIUM',
        status: 'PENDING',
        dueDate: new Date('2026-06-15'), // OVERDUE
        projectId: projectArena.id,
      },
      {
        name: 'Payment Checkout Security Audit',
        description: 'Audit SSL token exchanges for UPI and card checkout endpoints.',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        dueDate: new Date('2026-06-18'), // DUE TODAY
        projectId: projectArena.id,
      },
      {
        name: 'Test membership coupons code',
        description: 'Verify coupon discounts correctly calculate checkouts.',
        priority: 'LOW',
        status: 'PENDING',
        dueDate: new Date('2026-06-24'), // DUE THIS WEEK
        projectId: projectArena.id,
      },
    ],
  });

  // Tasks for Urban Edge Salon (Not Started)
  await prisma.task.createMany({
    data: [
      {
        name: 'Moodboard & Competitor Research',
        description: 'Review boutique salon pages and catalog booking layouts.',
        priority: 'LOW',
        status: 'PENDING',
        dueDate: new Date('2026-07-05'),
        projectId: projectSalon.id,
      },
      {
        name: 'Stylist Slots Mockups',
        description: 'Draft wireframes for choosing specific stylists.',
        priority: 'MEDIUM',
        status: 'PENDING',
        dueDate: new Date('2026-07-10'),
        projectId: projectSalon.id,
      },
      {
        name: 'Service List Accordion Design',
        description: 'Design catalog filters for hair, nail, and massage services.',
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
