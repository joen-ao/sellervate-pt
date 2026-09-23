import { NextResponse, type NextRequest } from 'next/server';

// Layouts receive params but not searchParams. /queue gates on ?brand= in its
// layout (see DECISIONS: "Access checks live in the segment layout"), so the
// query string is forwarded as a request header. Always overwritten, never
// trusted as identity: the brand it names is re-checked against membership.
export const SEARCH_HEADER = 'x-queue-search';

export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set(SEARCH_HEADER, req.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: '/queue' };
