"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/services/store";

/**
 * True once the component has mounted and the persisted store has rehydrated
 * from localStorage. Data-driven UI renders only after this to avoid
 * server/client hydration mismatches.
 */
export function useHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (useStore.persist.hasHydrated()) {
      setReady(true);
      return;
    }
    const unsub = useStore.persist.onFinishHydration(() => setReady(true));
    return unsub;
  }, []);
  return ready;
}
