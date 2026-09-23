import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

// Signing lives apart from current-user.ts so scripts/print-cookies.ts can sign
// cookies without pulling in next/headers or the Supabase client.

export const COOKIE = 'app_user';

const secret = () => {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET missing or too short');
  return s;
};

export function signUserId(userId: string): string {
  const sig = createHmac('sha256', secret()).update(userId).digest('hex');
  return `${userId}.${sig}`;
}

export function verifyUserId(raw: string | undefined): string | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf('.');
  if (dot < 0) return null;
  const id = raw.slice(0, dot), sig = raw.slice(dot + 1);
  const expected = createHmac('sha256', secret()).update(id).digest('hex');
  const a = Buffer.from(sig, 'utf8'), b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return id;
}
