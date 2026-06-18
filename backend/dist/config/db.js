"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
// We instantiate a single PrismaClient instance to reuse across all requests.
// This prevents reaching database connection limits, especially in serverless or highly concurrent environments.
const prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
exports.default = prisma;
