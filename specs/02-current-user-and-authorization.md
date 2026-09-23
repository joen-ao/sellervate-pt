# 02 · Current user and authorisation foundation
Branch `feat/current-user-dal` · No migration · Est. 45 min · Wave 1 (solo; defines contracts for wave 2)

## 1. Product
Stub the login, never stub who can see what.

> The server decides what the current user may see, from a value the client cannot forge, before any row leaves the database.

- Identity: a signed httpOnly cookie set by the switcher. Forgeable plain cookies would be "hardcoding what they may see" through the back door.
- Authorisation: `lib/data/*` is the only path to the database. Every function resolves the user, resolves membership, filters in SQL.
- Route handlers exist so evaluators can curl the API; they call the same DAL.
- What real auth would take: replace `/switch` with Supabase Auth, `getCurrentUser()` reads `auth.getUser()`, RLS switches to `auth.uid()`. DAL and membership model untouched.

## 2. Technical plan

### Files (all new; these are the wave-2 contracts)
```
.env.example                          # SESSION_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
lib/errors.ts
lib/current-user.ts
lib/supabase/admin.ts
lib/data/membership.ts
lib/data/_shared.ts
app/switch/route.ts
components/UserSwitcher.tsx
app/layout.tsx                        # renders <UserSwitcher/>; passes profiles + current
app/page.tsx                          # redirect by role
app/forbidden.tsx  app/not-found.tsx
app/api/brands/[slug]/replies/route.ts   # minimal, proves 200/403
app/api/_lib/respond.ts
scripts/print-cookies.ts              # prints signed cookies for seed users
```

### `lib/errors.ts`
```ts
export class ForbiddenError extends Error { readonly status = 403; constructor(m = 'Forbidden') { super(m); } }
export class NotFoundError extends Error { readonly status = 404; constructor(m = 'Not found') { super(m); } }
export class ConflictError extends Error { readonly status = 409; constructor(m = 'Conflict') { super(m); } }
```

### `lib/supabase/admin.ts`
```ts
import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export const admin = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
```
This is the **only** Supabase client in the repo. It has `server-only` so importing it from a client component fails the build.

### `lib/current-user.ts`
```ts
import 'server-only';
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cache } from 'react';
import { admin } from '@/lib/supabase/admin';
import { ForbiddenError } from '@/lib/errors';
import type { UserRole } from '@/lib/types';

export const COOKIE = 'app_user';
const secret = () => {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET missing or too short');
  return s;
};

export type CurrentUser = { id: string; fullName: string; role: UserRole };

export function signUserId(userId: string): string {
  const sig = createHmac('sha256', secret()).update(userId).digest('hex');
  return `${userId}.${sig}`;
}

function verify(raw: string | undefined): string | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf('.');
  if (dot < 0) return null;
  const id = raw.slice(0, dot), sig = raw.slice(dot + 1);
  const expected = createHmac('sha256', secret()).update(id).digest('hex');
  const a = Buffer.from(sig, 'utf8'), b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return id;
}

// cache(): one DB hit per request even if called from layout + page + actions
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const id = verify((await cookies()).get(COOKIE)?.value);
  if (!id) return null;
  const { data } = await admin.from('profiles')
    .select('id, full_name, role').eq('id', id).maybeSingle();
  return data ? { id: data.id, fullName: data.full_name, role: data.role } : null;
});

export async function requireUser(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) throw new ForbiddenError('Not signed in');
  return u;
}

export async function requireRole(role: UserRole): Promise<CurrentUser> {
  const u = await requireUser();
  if (u.role !== role) throw new ForbiddenError(`Requires ${role}`);
  return u;
}
```

### `lib/data/membership.ts`
```ts
import 'server-only';
import { cache } from 'react';
import { admin } from '@/lib/supabase/admin';
import { ForbiddenError, NotFoundError } from '@/lib/errors';

export const getMemberBrandIds = cache(async (userId: string): Promise<string[]> => {
  const { data, error } = await admin.from('brand_members')
    .select('brand_id').eq('user_id', userId);
  if (error) throw error;
  return data.map(r => r.brand_id);
});

export async function assertBrandMember(userId: string, brandId: string): Promise<void> {
  const ids = await getMemberBrandIds(userId);
  if (!ids.includes(brandId)) throw new ForbiddenError('Not a member of this brand');
}

// slug → id, but only if member. 404 if slug unknown, 403 if known and not member.
export async function resolveMemberBrand(userId: string, slug: string) {
  const { data } = await admin.from('brands')
    .select('id, name, slug, voice_guidelines').eq('slug', slug).maybeSingle();
  if (!data) throw new NotFoundError('Brand');
  await assertBrandMember(userId, data.id);
  return data;
}
```
Note the ordering decision: unknown slug → 404; known slug, not member → 403. We accept leaking "this brand exists" because brands are Sellervate's own client list, not the specialists' secret. Write this in DECISIONS.

### `lib/data/_shared.ts`
```ts
export const REPLY_COLUMNS =
  'id, brand_id, specialist_id, customer_message, reply_text, sent_at, channel, source, external_id' as const;
export const REVIEW_COLUMNS =
  'id, reply_id, reviewer_id, score, severity, categories, comment, created_at, acknowledged_at' as const;
export const PAGE_SIZE = 25;
export const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
```

### `app/switch/route.ts`
```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { admin } from '@/lib/supabase/admin';
import { COOKIE, signUserId } from '@/lib/current-user';

const Body = z.object({ userId: z.string().uuid() });

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
```

### `components/UserSwitcher.tsx` (server component, plain `<form method="post" action="/switch">`)
Lists all profiles grouped by role, current one highlighted, bottom-right corner, daisyUI `dropdown`. No client JS needed.

### `app/page.tsx`
```ts
const u = await getCurrentUser();
redirect(!u ? '/switch-needed' : u.role === 'team_lead' ? '/queue' : '/me');
```
`/switch-needed` is a tiny page: "Pick who you are" + the switcher. Designed, not a 500.

### `app/api/_lib/respond.ts`
```ts
import { NextResponse } from 'next/server';
export async function handle<T>(fn: () => Promise<T>) {
  try { return NextResponse.json(await fn()); }
  catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json({ error: status === 500 ? 'Internal error' : e.message }, { status });
  }
}
```

### `app/api/brands/[slug]/replies/route.ts` (foundation version; 03 may extend)
```ts
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  return handle(async () => {
    const u = await requireUser();
    const brand = await resolveMemberBrand(u.id, (await params).slug);
    let q = admin.from('replies').select(REPLY_COLUMNS)
      .eq('brand_id', brand.id).order('sent_at', { ascending: false }).limit(PAGE_SIZE);
    if (u.role === 'specialist') q = q.eq('specialist_id', u.id);
    const { data, error } = await q;
    if (error) throw error;
    return { brand: brand.slug, replies: data };
  });
}
```

### Error pages
`app/forbidden.tsx` and `app/not-found.tsx`: shared `<StatePage code title body cta/>` component, tool typography. Pages call `forbidden()` / `notFound()` from `next/navigation` when the DAL throws (wrap in a small `runPage(fn)` helper in `lib/page.ts` that maps `ForbiddenError`→`forbidden()`, `NotFoundError`→`notFound()`). Enable `experimental.authInterrupts` in `next.config.ts` for `forbidden()`.

### `scripts/print-cookies.ts`
Loads `.env.local`, prints `export MARTA=... DANI=... IKER=...` using `signUserId` for the fixed seed ids. Script `npm run print-cookies`.

## 3. Verify by hand
```bash
eval "$(npm run -s print-cookies)"
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/api/brands/voltaire/replies -H "Cookie: app_user=$DANI"       # 200
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/api/brands/lume/replies     -H "Cookie: app_user=$DANI"       # 403
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/api/brands/nope/replies     -H "Cookie: app_user=$DANI"       # 404
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/api/brands/lume/replies     -H "Cookie: app_user=${DANI%.*}.deadbeef"  # 403
curl -s localhost:3000/api/brands/kraftco/replies -H "Cookie: app_user=$DANI" | jq '.replies[].specialist_id' | sort -u   # only Dani's id
grep -rn "service_role\|SERVICE_ROLE" --include=*.ts --include=*.tsx . | grep -v node_modules   # only lib/supabase/admin.ts + scripts
grep -rn "x-user\|userId=" app lib | grep -v switch/route.ts   # nothing
```

## 4. Review checklist
- Did the agent read identity from anything other than the cookie? Any `searchParams.userId`, header, or client-side "current user" state?
- Is the HMAC compare constant-time and length-checked? Is `SESSION_SECRET` validated for length?
- Does `admin.ts` have `server-only`? Does any file under `components/` import it?
- Does the specialist filter in the route happen in SQL (`.eq`) and not after the fetch?
- Is `getCurrentUser` wrapped in `cache()` (otherwise layout + page = two DB hits)?
- 404 vs 403 ordering matches the decision above?
