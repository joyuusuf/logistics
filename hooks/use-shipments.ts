"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/services/store";
import type { Shipment } from "@/types";

type Scope = { customerId?: string; riderId?: string; partnerId?: string } | "all";

/** Shipments visible to a scope, newest first. */
export function useShipments(scope: Scope): Shipment[] {
  const shipments = useStore((s) => s.shipments);
  const key = scope === "all" ? "all" : `${scope.customerId ?? ""}|${scope.riderId ?? ""}|${scope.partnerId ?? ""}`;
  return useMemo(() => {
    if (scope === "all") return shipments;
    return shipments.filter(
      (s) =>
        (scope.customerId ? s.customerId === scope.customerId : true) &&
        (scope.riderId ? s.riderId === scope.riderId : true) &&
        (scope.partnerId ? s.partnerId === scope.partnerId : true),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipments, key]);
}

export function useShipment(id: string | undefined) {
  return useStore((s) => s.shipments.find((x) => x.id === id || x.reference === id));
}
