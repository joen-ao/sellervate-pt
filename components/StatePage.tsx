import Link from 'next/link';

type Props = {
  code?: string;
  title: string;
  body: React.ReactNode;
  cta?: { href: string; label: string };
  children?: React.ReactNode;
};

// Shared shell for 403, 404 and "pick who you are": a designed state, not a crash.
export function StatePage({ code, title, body, cta, children }: Props) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center gap-4 px-6">
      {code && (
        <p className="w-fit rounded-field bg-base-300 px-2 py-0.5 font-mono text-xs tracking-widest text-base-content/60">{code}</p>
      )}
      <h1 className="font-serif text-[2rem] font-medium leading-tight tracking-tight">{title}</h1>
      <div className="leading-relaxed text-base-content/65">{body}</div>
      {children}
      {cta && (
        <div className="mt-2">
          <Link href={cta.href} className="btn btn-sm btn-neutral">{cta.label}</Link>
        </div>
      )}
    </main>
  );
}
