'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Sidebar counts come from the root layout, and Next does not reliably
// re-render the root layout after an action that stays on the page: the page
// updates, the sidebar keeps its old number. So such an action returns the real
// counts (read on the server right after the write) and they are shown here
// until the server sends the sidebar again — at which point its number wins.
// Absolute values, never deltas, so a count can't be subtracted twice.
type Counts = Record<string, number>;
type Ctx = { overrides: Counts; setCounts: (c: Counts) => void; clear: (id: string) => void };
const PendingCountsContext = createContext<Ctx>({ overrides: {}, setCounts: () => {}, clear: () => {} });

export function PendingCountsProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<Counts>({});
  const setCounts = useCallback((c: Counts) => setOverrides(o => ({ ...o, ...c })), []);
  const clear = useCallback((id: string) => setOverrides(o => {
    if (!(id in o)) return o;
    const { [id]: _drop, ...rest } = o;
    void _drop;
    return rest;
  }), []);
  return <PendingCountsContext value={{ overrides, setCounts, clear }}>{children}</PendingCountsContext>;
}

// What a sidebar count shows: the action's fresh number if there is one,
// otherwise the server's. A new server value clears the override.
export function usePendingCount(id: string | undefined, serverValue: number | undefined) {
  const { overrides, clear } = useContext(PendingCountsContext);
  useEffect(() => { if (id) clear(id); }, [id, serverValue, clear]);
  return id && id in overrides ? overrides[id] : serverValue;
}

export const useSetPendingCounts = () => useContext(PendingCountsContext).setCounts;
