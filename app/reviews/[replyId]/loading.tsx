// Two-column skeleton matching page.tsx: the thread on the left, the review panel on the right.
export default function Loading() {
  return (
    <main aria-busy="true" className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-9 w-48" />
          <div className="skeleton h-4 w-64" />
        </div>
        <div className="skeleton h-16 w-full" />
        {[28, 36].map(h => (
          <div key={h} className="flex gap-3">
            <div className="skeleton size-8 shrink-0 rounded-full" />
            <div className={`skeleton w-full ${h === 28 ? 'h-28' : 'h-36'}`} />
          </div>
        ))}
      </section>
      <div className="skeleton h-[28rem] w-full" />
    </main>
  );
}
