"use client";

import Link from "next/link";
import { Bike, ChevronRight, MapPin, Phone } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useShipments } from "@/hooks/use-shipments";
import { isActive } from "@/lib/services/selectors";
import { PACKAGE_CATEGORIES } from "@/lib/constants";
import { formatNaira } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { EmptyState, PageHeader, ShipmentStatusBadge } from "@/components/shared";
import { RiderActions, RiderStepper, mapsLink } from "@/components/dashboard/rider-workflow";

export default function MyDeliveriesPage() {
  const { rider } = useAuth();
  const mine = useShipments({ riderId: rider!.id });
  const active = mine.filter(isActive).sort((a, b) => a.deadline.localeCompare(b.deadline));

  return (
    <>
      <PageHeader title="My deliveries" description="Deliveries assigned to you that are still in progress." />
      {active.length === 0 ? (
        <Card>
          <EmptyState
            icon={Bike}
            title="No active deliveries"
            description="Accept a job from the marketplace or wait for an assignment from your fleet."
            action={
              <Button asChild>
                <Link href="/rider/jobs">Browse available jobs</Link>
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {active.map((s) => {
            const goingToPickup = ["assigned", "accepted", "en_route_pickup"].includes(s.status);
            const target = goingToPickup ? s.sender : s.recipient;
            return (
              <Card key={s.id}>
                <Link href={`/rider/deliveries/${s.id}`} className="flex items-center justify-between gap-3 border-b border-line p-4 hover:bg-surface/60">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-navy">{s.reference}</span>
                      <ShipmentStatusBadge status={s.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {PACKAGE_CATEGORIES[s.package.category]} · {s.distanceKm} km · earn {formatNaira(s.riderEarning)}
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted" />
                </Link>
                <div className="space-y-4 p-4">
                  <RiderStepper shipment={s} compact />
                  <div className="flex items-start justify-between gap-3 rounded-lg bg-surface p-3">
                    <div className="flex min-w-0 gap-2">
                      <MapPin className={goingToPickup ? "mt-0.5 size-4 shrink-0 text-navy" : "mt-0.5 size-4 shrink-0 text-emerald"} />
                      <div className="min-w-0 text-sm">
                        <p className="text-xs font-semibold text-muted uppercase">{goingToPickup ? "Next: pickup" : "Next: drop-off"}</p>
                        <p className="font-semibold text-ink">{target.name}</p>
                        <p className="text-ink-soft">{target.address}</p>
                        <p className="text-xs text-muted">
                          {target.lga}, {target.state}
                          {target.landmark && ` · ${target.landmark}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <a href={`tel:${target.phone}`} className="inline-flex size-10 items-center justify-center rounded-full bg-white text-navy ring-1 ring-line" aria-label={`Call ${target.name}`}>
                        <Phone className="size-4" />
                      </a>
                      <a href={mapsLink(target.address, target.lga, target.state)} target="_blank" rel="noreferrer" className="inline-flex size-10 items-center justify-center rounded-full bg-navy text-white" aria-label="Navigate">
                        <MapPin className="size-4" />
                      </a>
                    </div>
                  </div>
                  <RiderActions shipment={s} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
