import { ArrowRight } from 'lucide-react';
import type { Persona } from '@/lib/data/shell';

const GROUPS = [
  {
    role: 'team_lead', title: 'Team leads',
    job: 'Judge replies your specialists already sent to customers: score each one, flag anything that could cost the account, and watch how each brand is trending.',
  },
  {
    role: 'specialist', title: 'Specialists',
    job: 'Read what your lead said about replies you sent, and mark each review as read so they know it landed.',
  },
] as const;

const initials = (name: string) => name.split(' ').map(w => w[0]).slice(0, 2).join('');

// The stubbed login as a choice of person, not a list of names: each role says
// what its job is here, each person which brands they cover. A plain form POST
// to /switch, so it works without JavaScript.
export function PersonaPicker({ people, currentId }: { people: Persona[]; currentId: string | null }) {
  return (
    <form method="post" action="/switch" className="flex flex-col gap-10">
      {GROUPS.map(g => (
        <section key={g.role} className="flex flex-col gap-3" aria-labelledby={`group-${g.role}`}>
          <div className="flex flex-col gap-1">
            <h2 id={`group-${g.role}`} className="text-xl font-semibold">{g.title}</h2>
            <p className="max-w-prose text-sm text-base-content/70">{g.job}</p>
          </div>
          <ul className="divide-y divide-base-300 overflow-hidden rounded-box border border-base-300">
            {people.filter(p => p.role === g.role).map(p => {
              const current = p.id === currentId;
              return (
                <li key={p.id}>
                  <button
                    type="submit" name="userId" value={p.id} aria-current={current ? 'true' : undefined}
                    className="group flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-base-200 focus-visible:bg-base-200 focus-visible:outline-none"
                  >
                    <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-base-300 text-xs font-medium">
                      {initials(p.fullName)}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-medium">{p.fullName}</span>
                      <span className="truncate text-sm text-base-content/60">{p.brands.join(', ') || 'No brands yet'}</span>
                    </span>
                    {current ? (
                      <span className="badge badge-sm">You are here</span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-base-content/60 group-hover:text-base-content group-focus-visible:text-base-content">
                        Continue as {p.fullName.split(' ')[0]} <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </form>
  );
}
