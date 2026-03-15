import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    // Return a proxy that defers the error until an actual query is made.
    // This allows the Next.js build to succeed without a DATABASE_URL.
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        // Allow PrismaAdapter to read known non-query properties without throwing
        if (typeof prop === 'symbol' || prop === 'then' || prop === '$connect' || prop === '$disconnect') {
          return undefined;
        }
        // For model accessors (user, job, etc.), return a proxy that throws on actual queries
        return new Proxy({} as any, {
          get() {
            throw new Error(
              'DATABASE_URL is not set. Please add it to your environment variables.',
            );
          },
        });
      },
    });
  }
  return new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
