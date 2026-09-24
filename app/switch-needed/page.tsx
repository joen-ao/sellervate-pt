import { BrandMark } from '@/components/BrandMark';
import { PageHeader } from '@/components/PageHeader';
import { PersonaPicker } from '@/components/PersonaPicker';
import { getCurrentUser } from '@/lib/current-user';
import { listPersonas } from '@/lib/data/shell';

export const metadata = { title: 'Choose who to be · Sellervate' };

export default async function SwitchNeeded() {
  const [people, current] = await Promise.all([listPersonas(), getCurrentUser()]);
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-12 lg:py-16">
      {/* Signed out there is no sidebar, so the page carries the product's name. */}
      {!current && <BrandMark />}
      <PageHeader
        eyebrow={current ? 'Account' : undefined}
        title={current ? 'Switch person' : 'Who are you today?'}
        lead="Login is stubbed in this build. Pick a person to use Sellervate QA as them. What they can see is still decided on the server, by the brands they cover."
      />
      <PersonaPicker people={people} currentId={current?.id ?? null} />
    </main>
  );
}
