type Props = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lead?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
};

// Every landing page opens the same way: where you are, a serif title, one
// sentence on what you do here, and the page's actions on the right.
export function PageHeader({ eyebrow, title, lead, meta, actions }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="flex min-w-0 max-w-2xl flex-col gap-1.5">
        {eyebrow && <div className="text-xs font-medium uppercase tracking-[0.08em] text-base-content/50">{eyebrow}</div>}
        <h1 className="font-serif text-[1.75rem] font-medium leading-tight tracking-tight">{title}</h1>
        {lead && <p className="text-[15px] leading-relaxed text-base-content/70">{lead}</p>}
        {meta && <p className="text-sm text-base-content/50">{meta}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

// A section heading inside a page: small caps label, quiet.
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-base-content/50">{children}</h2>;
}

// A raised surface: cards, panels, the list container.
export function Panel({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-box bg-base-200 ${className}`}>{children}</div>;
}

export const initials = (name: string) => name.split(' ').map(w => w[0]).slice(0, 2).join('');

// A person as a disc with initials. Neutral: people are never colour-coded.
export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'size-6 text-[10px]' : 'size-8 text-xs';
  return (
    <span aria-hidden className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-base-300 font-medium text-base-content/80`}>
      {initials(name)}
    </span>
  );
}
