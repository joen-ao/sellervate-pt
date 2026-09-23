import { NextResponse } from 'next/server';
import { ConflictError, ForbiddenError, NotFoundError } from '@/lib/errors';

// Route handlers wrap their DAL call in this. Only our own error classes map to
// their status and message; anything else is a 500 with a generic body, so a
// database error never leaks its text to the caller.
export async function handle<T>(fn: () => Promise<T>) {
  try {
    return NextResponse.json(await fn());
  } catch (e: unknown) {
    if (e instanceof ForbiddenError || e instanceof NotFoundError || e instanceof ConflictError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
