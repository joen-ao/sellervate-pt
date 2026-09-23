// Local skeleton; wave 3 (07b) swaps it for the shared Skeleton from components/.
export default function Loading() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10" aria-busy="true">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-24 w-full" />
      {[0, 1, 2].map(i => <div key={i} className="skeleton h-40 w-full" />)}
    </main>
  );
}
