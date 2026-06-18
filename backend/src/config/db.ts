import { PrismaClient } from '@prisma/client';

// We instantiate a single PrismaClient instance to reuse across all requests.
// This prevents reaching database connection limits, especially in serverless or highly concurrent environments.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;
