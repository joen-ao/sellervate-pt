import { PersonaPicker } from '@/components/PersonaPicker';
import { getCurrentUser } from '@/lib/current-user';
import { listPersonas } from '@/lib/data/shell';

export const metadata = { title: 'Choose who to be · Sellervate' };

export default async function SwitchNeeded() {
  const [people, current] = await Promise.all([listPersonas(), getCurrentUser()]);
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{current ? 'Switch person' : 'Who are you today?'}</h1>
        <p className="max-w-prose text-base-content/70">
          Login is stubbed in this build. Pick a person to use Sellervate QA as them. What they can
          see is still decided on the server, by the brands they cover.
        </p>
      </header>
      <PersonaPicker people={people} currentId={current?.id ?? null} />
    </main>
  );
}
