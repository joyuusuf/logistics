"use client";

import * as React from "react";
import Link from "next/link";
import { ClipboardCheck, ClipboardList, MapPin, Star, UserPlus } from "lucide-react";
import type { Shipment } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useShipments } from "@/hooks/use-shipments";
import { usePartnerFleet } from "@/hooks/use-partner-fleet";
import { useStore } from "@/lib/services/store";
import { DELIVERY_TYPES, RIDER_AVAILABILITY, VEHICLE_CATEGORIES } from "@/lib/constants";
import { formatDateTime, formatRelative } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, Card, CardBody, CardHeader } from "@/components/ui/primitives";
import { EmptyState, PageHeader, ShipmentStatusBadge, StatusBadge } from "@/components/shared";
import { AssignRiderDialog } from "@/components/dialogs";

export default function AssignmentsPage() {
  const { partner } = useAuth();
  const mine = useShipments({ partnerId: partner!.id });
  const shipments = useStore((s) => s.shipments);
  const { myRiders } = usePartnerFleet(partner!.id);
  const [target, setTarget] = React.useState<Shipment | null>(null);

  const pending = mine.filter((s) => !s.riderId && s.status === "confirmed").sort((a, b) => a.deadline.localeCompare(b.deadline));
  const awaitingAccept = mine.filter((s) => s.status === "assigned");
  const recent = mine
    .filter((s) => s.riderId)
    .map((s) => ({ s, at: [...s.timeline].reverse().find((e) => e.status === "assigned")?.at ?? s.createdAt }))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);
  const available = myRiders.filter((r) => r.verification === "approved" && r.status === "active");
  const load = (id: string) => shipments.filter((s) => s.riderId === id && ["assigned", "accepted", "en_route_pickup", "picked_up", "in_transit", "arrived"].includes(s.status)).length;

  return (
    <>
      <PageHeader title="Assignments" description="Match accepted deliveries with the right rider." />
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Waiting for a rider" description={`${pending.length} deliveries, earliest deadline first`} />
            <CardBody className="pt-3">
              {pending.length === 0 ? (
                <EmptyState
                  icon={ClipboardCheck}
                  title="All caught up"
                  description="Every accepted delivery has a rider."
                  action={
                    <Button asChild variant="secondary">
                      <Link href="/partner/deliveries?tab=incoming">View incoming requests</Link>
                    </Button>
                  }
                />
              ) : (
                <ul className="space-y-3">
                  {pending.map((s) => (
                    <li key={s.id} className="flex flex-col gap-3 rounded-lg border border-line p-3.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/partner/deliveries/${s.id}`} className="font-semibold text-navy hover:underline">
                            {s.reference}
                          </Link>
                          <Badge tone={s.deliveryType === "express" ? "danger" : "navy"}>{DELIVERY_TYPES[s.deliveryType].label}</Badge>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-soft">
                          <MapPin className="size-3.5 text-muted" />
                          {s.sender.lga} → {s.recipient.lga}
                        </p>
                        <p className="text-xs text-muted">
                          Due {formatDateTime(s.deadline)} · {s.package.weightKg * s.package.quantity} kg
                        </p>
                      </div>
                      <Button onClick={() => setTarget(s)}>
                        <UserPlus /> Assign
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Recent assignments" />
            <CardBody className="pt-3">
              {recent.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">No assignments yet.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {recent.map(({ s, at }) => (
                    <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0 text-sm">
                        <Link href={`/partner/deliveries/${s.id}`} className="font-semibold text-ink hover:underline">
                          {s.reference}
                        </Link>
                        <span className="text-muted"> → {myRiders.find((r) => r.id === s.riderId)?.name ?? "Rider"}</span>
                        <p className="text-xs text-muted">{formatRelative(at)}</p>
                      </div>
                      <ShipmentStatusBadge status={s.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
        <div className="space-y-5">
          {awaitingAccept.length > 0 && (
            <Card className="border-amber/40">
              <CardHeader title="Awaiting rider acceptance" description="Assigned but not yet accepted" />
              <CardBody className="pt-3">
                <ul className="space-y-2">
                  {awaitingAccept.map((s) => (
                    <li key={s.id} className="flex items-center justify-between text-sm">
                      <Link href={`/partner/deliveries/${s.id}`} className="font-semibold text-navy hover:underline">
                        {s.reference}
                      </Link>
                      <span className="text-muted">{myRiders.find((r) => r.id === s.riderId)?.name}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
          <Card>
            <CardHeader title="Rider availability" description={`${available.length} verified riders`} />
            <CardBody className="pt-3">
              {available.length === 0 ? (
                <EmptyState icon={ClipboardList} title="No verified riders" description="Add and verify riders to start assigning." className="py-6" />
              ) : (
                <ul className="space-y-3">
                  {available
                    .sort((a, b) => ["online", "busy", "offline"].indexOf(a.availability) - ["online", "busy", "offline"].indexOf(b.availability))
                    .map((r) => (
                      <li key={r.id} className="flex items-center gap-3">
                        <Avatar name={r.name} src={r.avatarUrl} size={36} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{r.name}</p>
                          <p className="flex items-center gap-1 text-xs text-muted">
                            <Star className="size-3 fill-amber text-amber" /> {r.rating.toFixed(1)} · {VEHICLE_CATEGORIES[r.vehicleType].label} · {load(r.id)} active
                          </p>
                        </div>
                        <StatusBadge map={RIDER_AVAILABILITY} value={r.availability} />
                      </li>
                    ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
      {target && <AssignRiderDialog shipment={target} open={!!target} onOpenChange={(o) => !o && setTarget(null)} partnerId={partner!.id} />}
    </>
  );
}
