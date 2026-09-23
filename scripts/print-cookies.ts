// Prints signed cookie values for the seed users, as shell exports:
//   eval "$(npm run -s print-cookies)"
//   curl localhost:3000/api/brands/voltaire/replies -H "Cookie: app_user=$DANI"
// Runs with --conditions=react-server (see package.json) so lib/session.ts's
// `server-only` import resolves to its no-op build outside Next.
import { signUserId } from '../lib/session';

process.loadEnvFile('.env.local');

const SEED_USERS = {
  MARTA: '00000000-0000-0000-0000-000000000011',
  NURIA: '00000000-0000-0000-0000-000000000012',
  DANI: '00000000-0000-0000-0000-000000000021',
  IKER: '00000000-0000-0000-0000-000000000022',
  LEO: '00000000-0000-0000-0000-000000000023',
};

console.log(
  'export ' +
    Object.entries(SEED_USERS).map(([name, id]) => `${name}=${signUserId(id)}`).join(' '),
);
