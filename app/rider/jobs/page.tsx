"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Briefcase, Clock, MapPin, Navigation, Package, SlidersHorizontal, Wallet } from "lucide-react";
import type { DeliveryType, Shipment } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/lib/services/store";
import { DELIVERY_TYPES, PACKAGE_CATEGORIES, VEHICLE_CATEGORIES } from "@/lib/constants";
import { STATE_NAMES } from "@/lib/mock-data/nigeria";
import { cn, formatDateTime, formatNaira, formatRelative, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { Badge, Card } from "@/components/ui/primitives";
import { EmptyState, PageHeader } from "@/components/shared";
import { RiderVerificationBanner } from "@/components/dashboard/rider-banner";

export default function AvailableJobsPage() {
  const router = useRouter();
  const { rider } = useAuth();
  const shipments = useStore((s) => s.shipments);
  const settings = useStore((s) => s.settings);
  const accept = useStore((s) => s.acceptJob);
  const [state, setState] = React.useState(rider!.state);
  const [maxKm, setMaxKm] = React.useState("all");
  const [type, setType] = React.useState<"all" | DeliveryType>("all");
  const [busy, setBusy] = React.useState<string | null>(null);

  const verified = rider!.verification === "approved" && rider!.status === "active";
  const online = rider!.availability !== "offline";
  const activeCount = shipments.filter((s) => s.riderId === rider!.id && ["assigned", "accepted", "en_route_pickup", "picked_up", "in_transit", "arrived"].includes(s.status)).length;
  const capacity = VEHICLE_CATEGORIES[rider!.vehicleType].capacityKg;

  const jobs = React.useMemo(
    () =>
      shipments
        .filter((s) => s.status === "confirmed" && !s.riderId && (!s.partnerId || s.partnerId === rider!.partnerId))
        .filter((s) => state === "all" || s.sender.state === state)
        .filter((s) => maxKm === "all" || s.distanceKm <= Number(maxKm))
        .filter((s) => type === "all" || s.deliveryType === type)
        .sort((a, b) => a.deadline.localeCompare(b.deadline)),
    [shipments, rider, state, maxKm, type],
  );

  const take = async (s: Shipment) => {
    setBusy(s.id);
    await sleep(500);
    const res = accept(s.id, rider!.id);
    setBusy(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`${s.reference} accepted. Head to pickup when ready.`);
    router.push(`/rider/deliveries/${s.id}`);
  };

  return (
    <>
      <PageHeader title="Available jobs" description="Delivery requests waiting for a rider. First to accept gets the job." />
      <RiderVerificationBanner rider={rider!} />
      {verified && !online && (
        <div className="mb-5 rounded-xl border border-amber/40 bg-amber-tint/60 p-4 text-sm text-ink">
          You are offline. Switch to <span className="font-semibold">Online</span> from the top bar to accept jobs.
        </div>
      )}

      <Card className="mb-5 p-3 sm:p-4">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-muted sm:hidden">
          <SlidersHorizontal className="size-4" /> Filters
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:mt-0 sm:grid-cols-3">
          <NativeSelect value={state} onChange={(e) => setState(e.target.value)} aria-label="Pickup location">
            <option value="all">All locations</option>
            {STATE_NAMES.map((s) => (
              <option key={s} value={s}>
                {s === rider!.state ? `${s} (your area)` : s}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect value={maxKm} onChange={(e) => setMaxKm(e.target.value)} aria-label="Distance">
            <option value="all">Any distance</option>
            <option value="10">Within 10 km</option>
            <option value="20">Within 20 km</option>
            <option value="35">Within 35 km</option>
            <option value="200">Within 200 km</option>
          </NativeSelect>
          <NativeSelect value={type} onChange={(e) => setType(e.target.value as typeof type)} aria-label="Delivery type">
            <option value="all">All delivery types</option>
            {Object.entries(DELIVERY_TYPES).map(([k, t]) => (
              <option key={k} value={k}>
                {t.label}
              </option>
            ))}
          </NativeSelect>
        </div>
      </Card>

      <p className="mb-3 text-[13px] text-muted">
        {jobs.length} {jobs.length === 1 ? "job" : "jobs"} · {activeCount}/{settings.maxActiveJobsPerRider} active deliveries
      </p>

      {jobs.length === 0 ? (
        <Card>
          <EmptyState icon={Briefcase} title="No jobs match your filters" description="New requests appear here as customers book. Try widening the distance or location." />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {jobs.map((s) => {
            const tooHeavy = s.package.weightKg * s.package.quantity > capacity;
            return (
              <Card key={s.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-3 border-b border-line p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={s.deliveryType === "express" ? "danger" : s.deliveryType === "same_day" ? "amber" : "navy"}>{DELIVERY_TYPES[s.deliveryType].label}</Badge>
                      {s.package.fragile && <Badge tone="warning" dot={false}>Fragile</Badge>}
                      {s.intercity && <Badge tone="info" dot={false}>Intercity</Badge>}
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      {s.reference} · posted {formatRelative(s.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted">You earn</p>
                    <p className="text-xl font-extrabold text-emerald-deep tabular">{formatNaira(s.riderEarning)}</p>
                  </div>
                </div>
                <div className="flex-1 space-y-3 p-4">
                  <div className="relative space-y-3 pl-6">
                    <span className="absolute top-2 bottom-2 left-[7px] w-0.5 bg-line" />
                    <div className="relative">
                      <span className="absolute top-1 -left-6 size-3.5 rounded-full border-[3px] border-navy bg-white" />
                      <p className="text-xs text-muted">Pickup · {s.sender.lga}</p>
                      <p className="text-sm font-semibold text-ink">{s.sender.address}</p>
                    </div>
                    <div className="relative">
                      <MapPin className="absolute top-0.5 -left-[25px] size-4 text-emerald" />
                      <p className="text-xs text-muted">Drop-off · {s.recipient.lga}, {s.recipient.state}</p>
                      <p className="text-sm font-semibold text-ink">{s.recipient.address}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-surface p-3 text-center text-xs">
                    <div>
                      <Navigation className="mx-auto size-4 text-navy" />
                      <p className="mt-1 font-bold text-ink">{s.distanceKm} km</p>
                      <p className="text-muted">Distance</p>
                    </div>
                    <div>
                      <Package className="mx-auto size-4 text-navy" />
                      <p className="mt-1 truncate font-bold text-ink">{PACKAGE_CATEGORIES[s.package.category]}</p>
                      <p className="text-muted">{s.package.weightKg * s.package.quantity} kg</p>
                    </div>
                    <div>
                      <Clock className="mx-auto size-4 text-navy" />
                      <p className="mt-1 font-bold text-ink">{formatDateTime(s.deadline).split(",").slice(-1)[0]}</p>
                      <p className="text-muted">Deadline</p>
                    </div>
                  </div>
                  {tooHeavy && <p className="text-xs font-medium text-danger">Too heavy for your {VEHICLE_CATEGORIES[rider!.vehicleType].label.toLowerCase()}.</p>}
                </div>
                <div className="border-t border-line p-4">
                  <Button className={cn("w-full")} size="lg" disabled={!verified || !online || tooHeavy} loading={busy === s.id} onClick={() => take(s)}>
                    <Wallet /> Accept delivery
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
