const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDate = (iso: string) => DATE.format(new Date(iso));

// "today" / "22 Sep 2026" — used for "Read today" / "Read on 22 Sep 2026".
export function readOn(iso: string): string {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString() ? 'Read today' : `Read on ${formatDate(iso)}`;
}
