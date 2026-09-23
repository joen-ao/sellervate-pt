const pad = (n: number) => String(n).padStart(2, '0');
const DAY = 86_400_000;

// "today 09:10" · "yesterday 16:42" · "3 days ago". Server time zone, no library.
// `now` is a parameter so the output is deterministic under test.
export function relativeTime(iso: string, now: number = Date.now()): string {
  const d = new Date(iso);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.ceil((startOfToday.getTime() - d.getTime()) / DAY);
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (days <= 0) return `today ${hm}`;
  if (days === 1) return `yesterday ${hm}`;
  return `${days} days ago`;
}
