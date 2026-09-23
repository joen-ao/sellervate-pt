export default function Loading() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8" aria-busy="true">
      <div className="skeleton h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map(i => <div key={i} className="skeleton h-28" />)}
      </div>
      <div className="skeleton h-40" />
      <div className="grid gap-8 md:grid-cols-2">
        <div className="skeleton h-40" />
        <div className="skeleton h-40" />
      </div>
    </main>
  );
}
