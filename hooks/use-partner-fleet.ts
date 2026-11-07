"use client";

import * as React from "react";
import { useStore } from "@/lib/services/store";

/** Riders, vehicles and utilisation for a logistics partner. */
export function usePartnerFleet(partnerId: string) {
  const riders = useStore((s) => s.riders);
  const vehicles = useStore((s) => s.vehicles);
  return React.useMemo(() => {
    const myRiders = riders.filter((r) => r.partnerId === partnerId);
    const myVehicles = vehicles.filter((v) => v.partnerId === partnerId);
    const usable = myVehicles.filter((v) => v.availability !== "inactive");
    const inUse = usable.filter((v) => v.availability === "in_use" || (v.assignedRiderId && myRiders.find((r) => r.id === v.assignedRiderId)?.availability === "busy"));
    return { myRiders, myVehicles, utilisation: usable.length ? Math.round((inUse.length / usable.length) * 100) : 0, inUse: inUse.length, usable: usable.length };
  }, [riders, vehicles, partnerId]);
}
