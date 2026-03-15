import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Build connection string from whatever env vars are available.
// Supabase-Vercel integration sets individual POSTGRES_HOST/PASSWORD/DATABASE vars
// rather than a single DATABASE_URL.
function getConnectionString(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.POSTGRES_PRISMA_URL) return process.env.POSTGRES_PRISMA_URL;
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;
  if (process.env.POSTGRES_URL_NON_POOLING) return process.env.POSTGRES_URL_NON_POOLING;

  // Assemble from individual Supabase-Vercel integration vars
  const host = process.env.POSTGRES_HOST;
  const password = process.env.POSTGRES_PASSWORD;
  const database = process.env.POSTGRES_DATABASE;
  if (host && password && database) {
    const user = process.env.POSTGRES_USER || 'postgres';
    const port = process.env.POSTGRES_PORT || '5432';
    return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}?sslmode=require`;
  }

  return undefined;
}

const connectionString = getConnectionString();

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
  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
