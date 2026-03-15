import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Supabase-Vercel integration sets POSTGRES_URL / POSTGRES_PRISMA_URL, not DATABASE_URL
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

function createPrismaClient(): PrismaClient {
  if (!connectionString) {
    // Return a proxy that defers the error until an actual query is made.
    // This allows the Next.js build to succeed without a database URL.
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
              'DATABASE_URL is not set. Please add it to your environment variables (or POSTGRES_URL via Supabase integration).',
            );
          },
        });
      },
    });
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
