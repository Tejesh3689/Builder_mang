import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

// Prisma errors caused by contention rather than bad input; safe to retry the whole transaction.
//   P2034 – write conflict / deadlock (serialization failure)
//   P2028 – interactive transaction API error (e.g. expired / timed out waiting to start)
//   P2024 – timed out acquiring a connection from the pool
export const TRANSIENT_PRISMA_CODES = ['P2034', 'P2028', 'P2024'];

export function isTransientPrismaError(error: any) {
  return TRANSIENT_PRISMA_CODES.includes(error?.code);
}

type TxFn<T> = (tx: Prisma.TransactionClient) => Promise<T>;

/**
 * Runs an interactive transaction, retrying a bounded number of times on contention errors
 * (Prisma's documented pattern for P2034). Non-transient errors, including ApiErrors thrown
 * inside the callback, propagate immediately.
 */
export async function runTransaction<T>(
  fn: TxFn<T>,
  { maxRetries = 4, timeout = 15000, maxWait = 10000 }: { maxRetries?: number; timeout?: number; maxWait?: number } = {}
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(fn, { timeout, maxWait });
    } catch (e: any) {
      if (!isTransientPrismaError(e) || attempt >= maxRetries) throw e;
      // Exponential backoff with jitter: ~50ms, 100ms, 200ms, 400ms (+ up to 50ms)
      const delay = 50 * 2 ** attempt + Math.floor(Math.random() * 50);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
