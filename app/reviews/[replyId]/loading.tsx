// Two-column skeleton matching page.tsx: exchange on the left, review card on the right.
export default function Loading() {
  return (
    <main aria-busy="true" className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_26rem]">
      <section className="flex flex-col gap-5">
        <div className="skeleton h-7 w-40" />
        <div className="skeleton h-4 w-64" />
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-28 w-full" />
        <div className="skeleton h-36 w-full" />
      </section>
      <div className="skeleton h-96 w-full" />
    </main>
  );
}
