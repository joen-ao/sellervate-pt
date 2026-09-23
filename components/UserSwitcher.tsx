import type { CurrentUser } from '@/lib/current-user';

type Props = {
  users: CurrentUser[];
  current: CurrentUser | null;
  variant?: 'corner' | 'inline';
};

const GROUPS = [
  { role: 'team_lead', label: 'Team leads' },
  { role: 'specialist', label: 'Specialists' },
] as const;

const ROLE_LABEL = { team_lead: 'Team lead', specialist: 'Specialist' } as const;

// Server component, no client JS: a plain form POST to /switch, which sets the
// signed cookie. The dropdown is <details>, so it opens without JavaScript too.
export function UserSwitcher({ users, current, variant = 'corner' }: Props) {
  const list = (
    <form method="post" action="/switch">
      <ul className="menu w-64 gap-0.5">
        {GROUPS.map(g => (
          <li key={g.role}>
            <h2 className="menu-title">{g.label}</h2>
            <ul>
              {users.filter(u => u.role === g.role).map(u => (
                <li key={u.id}>
                  <button
                    type="submit" name="userId" value={u.id}
                    className={u.id === current?.id ? 'menu-active' : undefined}
                    aria-current={u.id === current?.id ? 'true' : undefined}
                  >
                    {u.fullName}
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </form>
  );

  if (variant === 'inline') {
    return <div className="rounded-box border border-base-300 bg-base-100 w-fit">{list}</div>;
  }

  return (
    <details className="dropdown dropdown-top dropdown-end fixed bottom-4 right-4 z-50">
      <summary className="btn btn-sm shadow">
        {current ? `${current.fullName} · ${ROLE_LABEL[current.role]}` : 'Pick who you are'}
      </summary>
      <div className="dropdown-content mb-2 rounded-box border border-base-300 bg-base-100 shadow-lg">
        {list}
      </div>
    </details>
  );
}
