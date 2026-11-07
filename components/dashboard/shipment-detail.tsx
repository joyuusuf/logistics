"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Copy, Package, Phone, Star, User } from "lucide-react";
import { toast } from "sonner";
import type { Role, Shipment } from "@/types";
import { useStore } from "@/lib/services/store";
import { DELIVERY_TYPES, PACKAGE_CATEGORIES, PAYMENT_METHODS, TRANSACTION_STATUS, VEHICLE_CATEGORIES } from "@/lib/constants";
import { formatDate, formatDateTime, formatNaira, formatPhone } from "@/lib/utils";
import { Avatar, Badge, Card, CardBody, CardHeader, DetailRow } from "@/components/ui/primitives";
import { ShipmentStatusBadge, StatusBadge } from "@/components/shared";
import { DeliveryProgress, EtaCard, ShipmentTimeline, TrackingMap } from "@/components/tracking";

function ContactBlock({ title, point, tone, showPhone = true }: { title: string; point: Shipment["sender"]; tone: "navy" | "emerald"; showPhone?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className={tone === "navy" ? "mt-1 size-3 shrink-0 rounded-full border-[3px] border-navy" : "mt-1 size-3 shrink-0 rounded-full bg-emerald ring-4 ring-emerald/20"} />
      <div className="min-w-0 text-sm">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">{title}</p>
        <p className="mt-0.5 font-semibold text-ink">{point.name}</p>
        {showPhone && (
          <a href={`tel:${point.phone}`} className="text-ink-soft hover:text-emerald-deep">
            {formatPhone(point.phone)}
          </a>
        )}
        <p className="mt-1 text-ink">{point.address}</p>
        <p className="text-muted">
          {point.lga}, {point.state}
        </p>
        {point.landmark && <p className="mt-1 text-xs text-muted">Landmark: {point.landmark}</p>}
        {point.instructions && (
          <p className="mt-2 rounded-md bg-amber-tint/60 px-2.5 py-1.5 text-xs text-ink-soft">
            <span className="font-semibold">Note:</span> {point.instructions}
          </p>
        )}
      </div>
    </div>
  );
}

/** Full shipment view shared by customer, partner and admin portals. */
export function ShipmentDetailView({ shipment, role, actions, banner }: { shipment: Shipment; role: Role; actions?: React.ReactNode; banner?: React.ReactNode }) {
  const rider = useStore((s) => s.riders.find((r) => r.id === shipment.riderId));
  const partner = useStore((s) => s.partners.find((p) => p.id === shipment.partnerId));
  const customer = useStore((s) => s.users.find((u) => u.id === shipment.customerId));
  const allTxns = useStore((s) => s.transactions);
  const txns = React.useMemo(() => allTxns.filter((t) => t.shipmentId === shipment.id), [allTxns, shipment.id]);
  const txn = txns.find((t) => t.status !== "failed") ?? txns[0];
  const showPin = role === "customer" || role === "admin";

  const copy = () => {
    navigator.clipboard?.writeText(shipment.reference).then(
      () => toast.success("Reference copied"),
      () => toast.error("Could not copy"),
    );
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardBody className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-extrabold tracking-tight text-navy">{shipment.reference}</h2>
              <button type="button" onClick={copy} className="rounded-md p-1 text-muted hover:bg-surface hover:text-ink" aria-label="Copy reference">
                <Copy className="size-4" />
              </button>
              <ShipmentStatusBadge status={shipment.status} />
              {shipment.intercity && <Badge tone="navy" dot={false}>Intercity</Badge>}
              {shipment.package.fragile && <Badge tone="amber" dot={false}>Fragile</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted">
              {DELIVERY_TYPES[shipment.deliveryType].label} · Booked {formatDateTime(shipment.createdAt)}
              {shipment.scheduledFor && ` · Scheduled for ${formatDateTime(shipment.scheduledFor)}`}
            </p>
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </CardBody>
        <div className="border-t border-line px-5 py-4">
          <DeliveryProgress shipment={shipment} />
        </div>
      </Card>

      {banner}

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[1fr_260px]">
            <TrackingMap shipment={shipment} height={280} />
            <div className="flex flex-col gap-3">
              <EtaCard shipment={shipment} />
              {showPin && shipment.status !== "delivered" && shipment.status !== "cancelled" && (
                <div className="rounded-lg border border-line bg-white p-4">
                  <p className="text-xs font-semibold tracking-wide text-muted uppercase">Delivery PIN</p>
                  <p className="mt-1 font-mono text-3xl font-extrabold tracking-[0.35em] text-navy">{shipment.pin}</p>
                  <p className="mt-1 text-xs text-muted">{role === "customer" ? "Share only with the recipient. The rider needs it to complete delivery." : "Visible to admins for support only."}</p>
                </div>
              )}
              <div className="rounded-lg border border-line bg-white p-4 text-sm">
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">Deadline</p>
                <p className="mt-1 font-semibold text-ink">{formatDateTime(shipment.deadline)}</p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader title="Pickup and destination" />
            <CardBody className="grid gap-6 sm:grid-cols-2">
              <ContactBlock title="Pickup" point={shipment.sender} tone="navy" />
              <ContactBlock title="Destination" point={shipment.recipient} tone="emerald" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Package" />
            <CardBody className="flex flex-col gap-5 sm:flex-row">
              {shipment.package.imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shipment.package.imageDataUrl} alt="Package" className="size-28 shrink-0 rounded-lg object-cover ring-1 ring-line" />
              ) : (
                <span className="inline-flex size-28 shrink-0 items-center justify-center rounded-lg bg-surface text-muted ring-1 ring-line">
                  <Package className="size-8" />
                </span>
              )}
              <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                {[
                  ["Category", PACKAGE_CATEGORIES[shipment.package.category]],
                  ["Description", shipment.package.description],
                  ["Weight", `${shipment.package.weightKg} kg`],
                  ["Dimensions", `${shipment.package.lengthCm} × ${shipment.package.widthCm} × ${shipment.package.heightCm} cm`],
                  ["Quantity", String(shipment.package.quantity)],
                  ["Distance", `${shipment.distanceKm} km`],
                ].map(([l, v]) => (
                  <div key={l} className="min-w-0">
                    <dt className="text-xs text-muted">{l}</dt>
                    <dd className="mt-0.5 font-semibold text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Rider" />
            <CardBody>
              {rider ? (
                <div className="flex items-center gap-3">
                  <Avatar name={rider.name} src={rider.avatarUrl} size={46} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{role === "admin" ? <Link href={`/admin/riders/${rider.id}`} className="hover:underline">{rider.name}</Link> : rider.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted">
                      <Star className="size-3 fill-amber text-amber" /> {rider.rating.toFixed(1)} · {VEHICLE_CATEGORIES[rider.vehicleType].label} · {rider.vehiclePlate}
                    </p>
                    {partner && <p className="text-xs text-muted">Fleet: {partner.companyName}</p>}
                  </div>
                  <a href={`tel:${rider.phone}`} className="inline-flex size-9 items-center justify-center rounded-full bg-emerald-tint text-emerald-deep" aria-label={`Call ${rider.name}`}>
                    <Phone className="size-4" />
                  </a>
                </div>
              ) : (
                <p className="flex items-center gap-2 text-sm text-muted">
                  <AlertTriangle className="size-4 text-amber" />
                  {shipment.status === "cancelled" ? "No rider was assigned." : "Waiting for a rider to be assigned."}
                </p>
              )}
            </CardBody>
          </Card>

          {role !== "customer" && customer && (
            <Card>
              <CardHeader title="Customer" />
              <CardBody className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-surface text-navy">
                  <User className="size-5" />
                </span>
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-ink">{role === "admin" ? <Link href={`/admin/customers/${customer.id}`} className="hover:underline">{customer.name}</Link> : customer.name}</p>
                  <p className="truncate text-xs text-muted">
                    {customer.email} · {formatPhone(customer.phone)}
                  </p>
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Payment" />
            <CardBody className="pt-3">
              <dl className="divide-y divide-line">
                <DetailRow label="Base fee">{formatNaira(shipment.price.baseFee)}</DetailRow>
                <DetailRow label="Distance">{formatNaira(shipment.price.distanceFee)}</DetailRow>
                {shipment.price.weightFee > 0 && <DetailRow label="Extra weight">{formatNaira(shipment.price.weightFee)}</DetailRow>}
                {shipment.price.specialFee > 0 && <DetailRow label="Handling">{formatNaira(shipment.price.specialFee)}</DetailRow>}
                {shipment.price.serviceSurcharge !== 0 && <DetailRow label={shipment.price.serviceSurcharge < 0 ? "Scheduled discount" : "Speed surcharge"}>{formatNaira(shipment.price.serviceSurcharge)}</DetailRow>}
                <DetailRow label="Total" className="text-base">
                  <span className="text-lg font-extrabold text-navy">{formatNaira(shipment.amount)}</span>
                </DetailRow>
                <DetailRow label="Method">{PAYMENT_METHODS[shipment.paymentMethod]}</DetailRow>
                {txn && (
                  <>
                    <DetailRow label="Status">
                      <StatusBadge map={TRANSACTION_STATUS} value={txn.status} />
                    </DetailRow>
                    <DetailRow label="Reference">
                      <span className="font-mono text-xs">{txn.reference}</span>
                    </DetailRow>
                    <DetailRow label="Paid on">{formatDate(txn.createdAt)}</DetailRow>
                  </>
                )}
                {role !== "customer" && <DetailRow label="Rider earning">{formatNaira(shipment.riderEarning)}</DetailRow>}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Timeline" />
            <CardBody>
              <ShipmentTimeline shipment={shipment} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
