import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
    });
  }
  return prismaInstance;
}

export function setPrismaClient(client: PrismaClient): void {
  prismaInstance = client;
}

const targetObj: any = {
  $transaction: (fn: any) => (typeof fn === 'function' ? fn(getPrismaClient()) : Promise.all(fn)),
  $disconnect: () => {},
  $connect: () => {},
  $queryRawUnsafe: () => {},
};

export const prisma = new Proxy(targetObj as PrismaClient, {
  get(target, prop) {
    const record = target as unknown as Record<string | symbol, unknown>;
    if (prop in record && record[prop] !== undefined) {
      return record[prop];
    }
    return (getPrismaClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
  set(target, prop, value) {
    (target as unknown as Record<string | symbol, unknown>)[prop] = value;
    return true;
  }
});

export async function checkDatabaseConnection(): Promise<{ isConnected: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    const client = getPrismaClient();
    await client.$queryRawUnsafe('SELECT 1');
    const latencyMs = Date.now() - start;
    return { isConnected: true, latencyMs };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { isConnected: false, error: message };
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}
