import 'server-only';
import postgres from 'postgres';

// The RLS path (spec 07a, Option A). A direct Postgres connection as app_login
// — a login role with no BYPASSRLS that can only act as app_user — instead of
// supabase-js, because PostgREST runs every request in its own transaction and
// a transaction-local setting cannot span two REST calls.
//
// `admin` (service role, BYPASSRLS) stays for seed, the getCurrentUser()
// profile lookup and the user switcher.

let sql: postgres.Sql | undefined;

// Lazy, so importing this module (or `next build`) does not need the env var.
function client(): postgres.Sql {
  if (!sql) {
    const url = process.env.DATABASE_URL_APP;
    if (!url) throw new Error('DATABASE_URL_APP is not set (see .env.example)');
    sql = postgres(url, { max: 5 });
  }
  return sql;
}

// Runs fn in one transaction as app_user with app.current_user_id = userId.
// Both settings are transaction-local (set_config(..., true), `set local role`),
// so they die at commit/rollback and a pooled connection never carries one
// user's identity into the next request. Never use session-level `set role`.
//
// userId must come from getCurrentUser(), never from the request.
export async function asUser<T>(
  userId: string,
  fn: (tx: postgres.TransactionSql) => Promise<T>,
): Promise<T> {
  const result = await client().begin(async tx => {
    await tx`select set_config('app.current_user_id', ${userId}, true)`;
    await tx`set local role app_user`;
    return fn(tx);
  });
  return result as T;
}
