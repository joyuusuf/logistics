"use client";

import * as React from "react";
import Link from "next/link";
import { Bike, Lock, MapPin, Package, Phone, ShieldCheck, Star } from "lucide-react";
import type { Shipment } from "@/types";
import { useStore } from "@/lib/services/store";
import { DELIVERY_TYPES, PACKAGE_CATEGORIES, VEHICLE_CATEGORIES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { Avatar, Card, CardBody, CardHeader, DetailRow } from "@/components/ui/primitives";
import { ShipmentStatusBadge } from "@/components/shared";
import { DeliveryProgress, EtaCard, ShipmentTimeline, TrackingMap } from "./index";

function maskPhone(p: string) {
  const d = p.replace(/\D/g, "");
  return d.length >= 7 ? `${d.slice(0, 4)} ••• ${d.slice(-4)}` : p;
}

/** Shared tracking view used on the public track page and in the customer portal. */
export function TrackingResult({ shipment, showPrivate = false }: { shipment: Shipment; showPrivate?: boolean }) {
  const rider = useStore((s) => s.riders.find((r) => r.id === shipment.riderId));
  const delivered = shipment.status === "delivered";
  return (
    <div className="space-y-5">
      <Card>
        <CardBody className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">Shipment reference</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-extrabold tracking-tight text-navy">{shipment.reference}</h2>
              <ShipmentStatusBadge status={shipment.status} />
            </div>
            <p className="mt-1 text-sm text-muted">
              {DELIVERY_TYPES[shipment.deliveryType].label} delivery · Booked {formatDateTime(shipment.createdAt)}
            </p>
          </div>
          <div className="sm:w-72">
            <EtaCard shipment={shipment} />
          </div>
        </CardBody>
        <div className="border-t border-line px-5 py-4">
          <DeliveryProgress shipment={shipment} />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <TrackingMap shipment={shipment} />
          <Card>
            <CardBody className="grid gap-5 sm:grid-cols-2">
              <div className="flex gap-3">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-navy text-white">
                  <span className="size-2 rounded-full bg-white" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted uppercase">Pickup</p>
                  <p className="text-sm font-semibold text-ink">{shipment.sender.address}</p>
                  <p className="text-xs text-muted">
                    {shipment.sender.lga}, {shipment.sender.state}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald text-white">
                  <MapPin className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted uppercase">Destination</p>
                  <p className="text-sm font-semibold text-ink">{showPrivate ? shipment.recipient.address : `${shipment.recipient.lga} area`}</p>
                  <p className="text-xs text-muted">
                    {shipment.recipient.lga}, {shipment.recipient.state}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Assigned rider" />
            <CardBody>
              {rider ? (
                <div className="flex items-center gap-3">
                  <Avatar name={rider.name} src={rider.avatarUrl} size={46} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{rider.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted">
                      <Star className="size-3 fill-amber text-amber" /> {rider.rating.toFixed(1)} · {VEHICLE_CATEGORIES[rider.vehicleType].label} · {rider.vehiclePlate}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                      <Phone className="size-3" /> {showPrivate ? rider.phone : maskPhone(rider.phone)}
                    </p>
                  </div>
                  {showPrivate && !delivered && (
                    <a href={`tel:${rider.phone}`} className="inline-flex size-9 items-center justify-center rounded-full bg-emerald-tint text-emerald-deep" aria-label={`Call ${rider.name}`}>
                      <Phone className="size-4" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 text-sm text-muted">
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-surface">
                    <Bike className="size-5" />
                  </span>
                  {shipment.status === "cancelled" ? "No rider. This shipment was cancelled." : "We are matching your shipment with a nearby verified rider."}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Delivery confirmation" />
            <CardBody>
              {delivered ? (
                <div className="flex gap-3 rounded-lg bg-emerald-tint/60 p-3">
                  <ShieldCheck className="size-5 shrink-0 text-emerald-deep" />
                  <p className="text-sm text-ink">
                    Confirmed with the recipient&apos;s PIN on <span className="font-semibold">{shipment.deliveredAt ? formatDateTime(shipment.deliveredAt) : "-"}</span>.
                  </p>
                </div>
              ) : shipment.status === "cancelled" ? (
                <p className="text-sm text-muted">Not applicable.</p>
              ) : (
                <div className="flex gap-3 rounded-lg bg-surface p-3">
                  <Lock className="size-5 shrink-0 text-navy" />
                  <div className="text-sm">
                    <p className="text-ink">Awaiting PIN confirmation at drop-off.</p>
                    {showPrivate ? (
                      <p className="mt-2">
                        Share this PIN with the recipient: <span className="ml-1 rounded-md bg-navy px-2 py-0.5 font-mono text-base font-bold tracking-[0.3em] text-white">{shipment.pin}</span>
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-muted">The sender shares a private PIN with the recipient.</p>
                    )}
                  </div>
                </div>
              )}
              <dl className="mt-3 divide-y divide-line">
                <DetailRow label="Package">
                  <span className="inline-flex items-center gap-1.5">
                    <Package className="size-3.5 text-muted" /> {PACKAGE_CATEGORIES[shipment.package.category]}
                  </span>
                </DetailRow>
                <DetailRow label="Distance">{shipment.distanceKm} km</DetailRow>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Shipment timeline" />
            <CardBody>
              <ShipmentTimeline shipment={shipment} />
            </CardBody>
          </Card>
        </div>
      </div>
      {!showPrivate && (
        <p className="text-center text-xs text-muted">
          Sent this package? <Link href="/auth/login" className="font-semibold text-emerald-deep hover:underline">Log in</Link> to see full details and your delivery PIN.
        </p>
      )}
    </div>
  );
}
