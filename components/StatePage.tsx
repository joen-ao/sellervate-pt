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
      {code && <p className="font-mono text-sm tracking-widest text-base-content/50">{code}</p>}
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="text-base-content/70">{body}</div>
      {children}
      {cta && (
        <div>
          <Link href={cta.href} className="btn btn-sm btn-neutral">{cta.label}</Link>
        </div>
      )}
    </main>
  );
}
