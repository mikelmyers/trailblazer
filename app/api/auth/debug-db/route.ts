import { NextRequest, NextResponse } from 'next/server';
import pg from 'pg';

/**
 * Temporary debug endpoint to test raw database connectivity.
 * DELETE THIS after debugging.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (!secret || secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const connStr =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  // Mask password in output
  const masked = connStr
    ? connStr.replace(/(:\/\/[^:]+:)[^@]+(@)/, '$1****$2')
    : 'NO CONNECTION STRING FOUND';

  const envKeys = Object.keys(process.env)
    .filter((k) => k.includes('POSTGRES') || k.includes('DATABASE') || k.includes('SUPABASE'))
    .sort();

  // Try raw pg connection
  let pgResult = 'not attempted';
  if (connStr) {
    try {
      // Strip sslmode and use our own ssl config
      const cleaned = connStr.replace(/[?&]sslmode=[^&]*/g, '');
      const pool = new pg.Pool({
        connectionString: cleaned,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });
      const client = await pool.connect();
      const res = await client.query('SELECT 1 as ok');
      client.release();
      await pool.end();
      pgResult = `SUCCESS: ${JSON.stringify(res.rows)}`;
    } catch (err: any) {
      pgResult = `FAILED: ${err.message}`;
    }
  }

  return NextResponse.json({
    connectionString: masked,
    relevantEnvVars: envKeys,
    pgDirectTest: pgResult,
    nodeVersion: process.version,
  });
}
