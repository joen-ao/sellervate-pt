// Writes .env.local from the Supabase stack that is actually running on this
// machine, and generates a fresh SESSION_SECRET.
//
// Why a script rather than values committed in .env.example: the local keys are
// JWTs, and a JWT in the repository trips every secret scanner that looks at it
// — including the one on this repo's pull requests. Reading them from
// `supabase status` is also simply more correct, because it uses your stack's
// keys rather than a key that happens to match today.
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';

const OUT = '.env.local';
const CLI = ['supabase', ['status', '-o', 'env']];
const NPX = ['npx', ['--yes', 'supabase@2.117.0', 'status', '-o', 'env']];

function status() {
  for (const [cmd, args] of [CLI, NPX]) {
    try {
      return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    } catch {
      // The CLI may be absent from PATH; fall through to npx, then report.
    }
  }
  console.error(
    'Could not read `supabase status`. Is the stack running?\n' +
    '  1. Start Docker (the daemon itself, not just the app icon).\n' +
    '  2. supabase start    (or: npx supabase@2.117.0 start)\n' +
    '  3. npm run setup',
  );
  process.exit(1);
}

const env = Object.fromEntries(
  status().split('\n').flatMap(line => {
    const m = line.match(/^([A-Z_]+)="?(.*?)"?$/);
    return m ? [[m[1], m[2]]] : [];
  }),
);

const missing = ['API_URL', 'SERVICE_ROLE_KEY'].filter(k => !env[k]);
if (missing.length) {
  console.error(`\`supabase status\` did not report ${missing.join(' and ')}. Is the stack fully up?`);
  process.exit(1);
}

if (existsSync(OUT)) {
  console.log(`${OUT} already exists — leaving it alone. Delete it and rerun to regenerate.`);
  process.exit(0);
}

writeFileSync(OUT, `# Written by \`npm run setup\` from the Supabase stack running locally.
# Local development only. Every value here has to be replaced anywhere else.

# Signs the httpOnly cookie carrying the stubbed user. Generated for this machine.
SESSION_SECRET=${randomBytes(32).toString('hex')}

# The "API URL" line of \`supabase start\`.
SUPABASE_URL=${env.API_URL}

# The "service_role key" line. Server-only: it bypasses RLS, so it must never
# reach a client component or a NEXT_PUBLIC_ anything.
SUPABASE_SERVICE_ROLE_KEY=${env.SERVICE_ROLE_KEY}

# Direct Postgres connection for asUser() (spec 07a), the path RLS applies to.
# app_login has no BYPASSRLS and can only act as app_user — not postgres, which
# bypasses RLS. Local-only password, set in migration 0002.
DATABASE_URL_APP=postgresql://app_login:app_login_local@127.0.0.1:54322/postgres
`);
console.log(`Wrote ${OUT}: SESSION_SECRET generated, Supabase values read from your running stack.`);
