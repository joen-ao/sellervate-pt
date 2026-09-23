import 'server-only';
import { forbidden, notFound } from 'next/navigation';
import { ForbiddenError, NotFoundError } from '@/lib/errors';

// Pages wrap their DAL calls in this so a thrown ForbiddenError / NotFoundError
// renders app/forbidden.tsx / app/not-found.tsx instead of the error boundary.
// Anything else (including Next's own redirect/notFound signals) is rethrown.
export async function runPage<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ForbiddenError) forbidden();
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
}
