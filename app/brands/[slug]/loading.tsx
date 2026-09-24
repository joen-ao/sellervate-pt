export default function Loading() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10" aria-busy="true">
      <div className="flex flex-col gap-2">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-9 w-48" />
        <div className="skeleton h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map(i => <div key={i} className="skeleton h-28" />)}
      </div>
      <div className="skeleton h-52" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="skeleton h-48" />
        <div className="skeleton h-48" />
      </div>
    </main>
  );
}
