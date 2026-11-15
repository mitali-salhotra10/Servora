import { prisma } from '../db/prisma';

let dbReachable = true;
let lastDbCheck = 0;

/**
 * Checks PostgreSQL reachability against the connected database pooler.
 * Uses a 10-second cache to prevent query flood.
 */
export async function isDatabaseOnline(): Promise<boolean> {
  const now = Date.now();
  if (now - lastDbCheck < 10000 && dbReachable) {
    return true;
  }

  lastDbCheck = now;
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    dbReachable = true;
    return true;
  } catch (err) {
    // Retry once before marking unreachable
    try {
      await prisma.$queryRawUnsafe('SELECT 1');
      dbReachable = true;
      return true;
    } catch {
      dbReachable = false;
      return false;
    }
  }
}
