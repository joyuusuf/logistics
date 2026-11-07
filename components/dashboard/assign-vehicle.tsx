"use client";

import { toast } from "sonner";
import { Truck } from "lucide-react";
import type { Rider } from "@/types";
import { useStore } from "@/lib/services/store";
import { VEHICLE_CATEGORIES } from "@/lib/constants";
import { NativeSelect } from "@/components/ui/input";

/** Select to attach one of a partner's available vehicles to a rider. */
export function AssignVehicleControl({ rider, partnerId }: { rider: Rider; partnerId: string }) {
  const vehicles = useStore((s) => s.vehicles);
  const assign = useStore((s) => s.assignVehicle);
  const options = vehicles.filter((v) => v.partnerId === partnerId && (v.id === rider.vehicleId || (!v.assignedRiderId && v.availability === "available")));
  return (
    <div className="flex items-center gap-2">
      <Truck className="size-4 shrink-0 text-muted" />

      <NativeSelect
        value={rider.vehicleId ?? ""}
        onChange={(e) => {
          const res = assign(rider.id, e.target.value || null);
          if (res.ok) toast.success(e.target.value ? "Vehicle assigned" : "Vehicle unassigned");
          else toast.error(res.error);
        }}
        className="h-9 min-w-56 text-[13px]"
        aria-label="Assigned vehicle"
      >
        <option value="">No fleet vehicle</option>
        {options.map((v) => (
          <option key={v.id} value={v.id}>
            {v.plate} · {VEHICLE_CATEGORIES[v.category].label} ({v.make})
          </option>
        ))}
      </NativeSelect>
      
    </div>
  );
}
