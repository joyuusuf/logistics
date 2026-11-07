"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Star } from "lucide-react";
import type { Rider } from "@/types";
import { useStore } from "@/lib/services/store";
import { riderBalance, successRate } from "@/lib/services/selectors";
import { RIDER_AVAILABILITY, VEHICLE_CATEGORIES, VERIFICATION_STATUS } from "@/lib/constants";
import { formatDate, formatNaira, formatPhone } from "@/lib/utils";
import { Avatar, Badge, Card, CardBody, CardHeader, DetailRow } from "@/components/ui/primitives";
import { ShipmentStatusBadge, StatusBadge } from "@/components/shared";
import { Dialog, DialogContent } from "@/components/ui/overlays";

/** Reusable rider summary: identity, KPIs, documents and recent deliveries. */
export function RiderProfileContent({ rider, linkBase }: { rider: Rider; linkBase: string }) {
  const shipments = useStore((s) => s.shipments);
  const payouts = useStore((s) => s.payouts);
  const vehicles = useStore((s) => s.vehicles);
  const partner = useStore((s) => s.partners.find((p) => p.id === rider.partnerId));
  const mine = React.useMemo(() => shipments.filter((s) => s.riderId === rider.id), [shipments, rider.id]);
  const delivered = mine.filter((s) => s.status === "delivered");
  const balance = riderBalance(rider.id, shipments, payouts);
  const vehicle = vehicles.find((v) => v.id === rider.vehicleId);
  const [preview, setPreview] = React.useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar name={rider.name} src={rider.avatarUrl} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold text-navy">{rider.name}</h2>
            <StatusBadge map={VERIFICATION_STATUS} value={rider.verification} />
            {rider.status === "suspended" ? <Badge tone="danger">Suspended</Badge> : <StatusBadge map={RIDER_AVAILABILITY} value={rider.availability} />}
          </div>
          <p className="text-sm text-muted">
            {rider.email} · {formatPhone(rider.phone)}
          </p>
          <p className="text-sm text-muted">
            {rider.lga}, {rider.state} · {partner?.companyName ?? "Independent"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Deliveries", v: delivered.length },
          { l: "Success rate", v: `${successRate(mine)}%` },
          { l: "Rating", v: rider.rating ? rider.rating.toFixed(1) : "New", star: true },
          { l: "Total earned", v: formatNaira(balance.totalEarnings) },
        ].map((k) => (
          <div key={k.l} className="rounded-lg border border-line p-3">
            <p className="text-xs text-muted">{k.l}</p>
            <p className="mt-0.5 flex items-center gap-1 text-lg font-extrabold text-navy tabular">
              {k.star && <Star className="size-4 fill-amber text-amber" />}
              {k.v}
            </p>
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Details" />
          <CardBody className="pt-2">
            <dl className="divide-y divide-line">
              <DetailRow label="Address">{rider.address}</DetailRow>
              <DetailRow label="Vehicle">
                {VEHICLE_CATEGORIES[rider.vehicleType].label} · {rider.vehiclePlate}
              </DetailRow>
              <DetailRow label="Fleet vehicle">{vehicle ? `${vehicle.make} ${vehicle.model}` : "None assigned"}</DetailRow>
              <DetailRow label="Bank">{rider.bank ? `${rider.bank.bankName}` : "Not added"}</DetailRow>
              <DetailRow label="Joined">{formatDate(rider.joinedAt)}</DetailRow>
            </dl>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Documents" />
          <CardBody className="pt-2">
            <ul className="divide-y divide-line">
              {rider.documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                  <button type="button" disabled={!d.previewUrl} onClick={() => setPreview(d.previewUrl ?? null)} className="flex min-w-0 items-center gap-2 text-left text-sm text-ink enabled:hover:text-emerald-deep">
                    <FileText className="size-4 shrink-0 text-muted" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{d.type}</span>
                      <span className="block truncate text-xs text-muted">{d.fileName || "Not uploaded"}</span>
                    </span>
                  </button>
                  <StatusBadge map={VERIFICATION_STATUS} value={d.status} />
                </li>
              ))}
            </ul>
            {rider.rejectionReason && <p className="mt-2 rounded-md bg-danger-tint px-3 py-2 text-xs text-danger">Rejected: {rider.rejectionReason}</p>}
          </CardBody>
        </Card>
      </div>
      <Card>
        <CardHeader title="Recent deliveries" description={`${mine.length} total`} />
        <CardBody className="pt-2">
          {mine.length === 0 ? (
            <p className="py-4 text-sm text-muted">No deliveries yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {mine.slice(0, 6).map((s) => (
                <li key={s.id}>
                  <Link href={`${linkBase}/${s.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-emerald-deep">
                    <span className="min-w-0 text-sm">
                      <span className="font-semibold">{s.reference}</span>
                      <span className="text-muted">
                        {" "}
                        · {s.sender.lga} → {s.recipient.lga} · {formatDate(s.createdAt)}
                      </span>
                    </span>
                    <ShipmentStatusBadge status={s.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent title="Document preview" size="lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img src={preview} alt="Document" className="mx-auto max-h-[70vh] rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
