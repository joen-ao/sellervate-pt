import { ArrowRight } from 'lucide-react';
import type { Persona } from '@/lib/data/shell';
import { Avatar } from './PageHeader';

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

// The stubbed login as a choice of person, not a list of names: each role says
// what its job is here, each person which brands they cover. A plain form POST
// to /switch, so it works without JavaScript.
export function PersonaPicker({ people, currentId }: { people: Persona[]; currentId: string | null }) {
  return (
    <form method="post" action="/switch" className="grid items-start gap-4 lg:grid-cols-2">
      {GROUPS.map(g => (
        <section key={g.role} className="flex flex-col gap-4 rounded-box bg-base-200 p-5" aria-labelledby={`group-${g.role}`}>
          <div className="flex flex-col gap-1.5 px-1">
            <h2 id={`group-${g.role}`} className="text-lg font-semibold">{g.title}</h2>
            <p className="text-sm leading-relaxed text-base-content/60">{g.job}</p>
          </div>
          <ul className="flex flex-col gap-0.5">
            {people.filter(p => p.role === g.role).map(p => {
              const current = p.id === currentId;
              return (
                <li key={p.id}>
                  <button
                    type="submit" name="userId" value={p.id} aria-current={current ? 'true' : undefined}
                    className="group flex w-full items-center gap-3 rounded-field px-2 py-2.5 text-left transition-colors hover:bg-base-300/50 focus-visible:bg-base-300/50 focus-visible:outline-none"
                  >
                    <Avatar name={p.fullName} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-medium">{p.fullName}</span>
                      <span className="truncate text-xs text-base-content/50">{p.brands.join(', ') || 'No brands yet'}</span>
                    </span>
                    {current ? (
                      <span className="badge badge-sm badge-soft badge-success">You are here</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-base-content/40 transition-colors group-hover:text-base-content group-focus-visible:text-base-content">
                        Continue <ArrowRight size={14} strokeWidth={1.75} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
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
