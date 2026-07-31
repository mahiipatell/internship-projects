// Single shared Prisma Client instance across the app.
// Prevents exhausting DB connections in dev (hot reload) and keeps a single pool in prod.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prisma;
