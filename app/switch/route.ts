import { NextResponse } from 'next/server';
import { z } from 'zod';
import { admin } from '@/lib/supabase/admin';
import { COOKIE, signUserId } from '@/lib/current-user';

// z.guid(), not z.uuid(): zod 4's uuid() enforces RFC version/variant bits, and
// the fixed seed ids (00000000-...-0000000000NN) have neither.
const Body = z.object({ userId: z.guid() });

export async function POST(req: Request) {
  const form = await req.formData();
  const parsed = Body.safeParse({ userId: form.get('userId') });
  if (!parsed.success) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const { data } = await admin.from('profiles').select('id, role')
    .eq('id', parsed.data.userId).maybeSingle();
  if (!data) return NextResponse.json({ error: 'unknown user' }, { status: 404 });

  const res = NextResponse.redirect(new URL(data.role === 'team_lead' ? '/queue' : '/me', req.url), 303);
  res.cookies.set(COOKIE, signUserId(data.id), {
    httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
