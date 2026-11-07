"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { MapPin, MessageSquare, Navigation, Package, Phone, User, Wallet } from "lucide-react";
import type { ContactPoint } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useShipment } from "@/hooks/use-shipments";
import { useStore } from "@/lib/services/store";
import { DELIVERY_TYPES, PACKAGE_CATEGORIES } from "@/lib/constants";
import { formatDateTime, formatNaira, formatPhone } from "@/lib/utils";
import { Badge, Card, CardBody, CardHeader, DetailRow } from "@/components/ui/primitives";
import { NotFoundCard, PageHeader, ShipmentStatusBadge } from "@/components/shared";
import { ShipmentTimeline, TrackingMap } from "@/components/tracking";
import { RiderActions, RiderStepper, mapsLink } from "@/components/dashboard/rider-workflow";

function StopCard({ title, point, tone, active }: { title: string; point: ContactPoint; tone: "navy" | "emerald"; active: boolean }) {
  return (
    <Card className={active ? "border-emerald/50 ring-1 ring-emerald/20" : undefined}>
      <CardBody className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-muted uppercase">
            <span className={tone === "navy" ? "size-2.5 rounded-full border-2 border-navy" : "size-2.5 rounded-full bg-emerald"} />
            {title}
          </p>
          {active && <Badge tone="success">Next stop</Badge>}
        </div>
        <div>
          <p className="font-bold text-ink">{point.name}</p>
          <p className="text-sm text-ink-soft">{point.address}</p>
          <p className="text-xs text-muted">
            {point.lga}, {point.state}
          </p>
          {point.landmark && <p className="mt-1 text-xs text-muted">Landmark: {point.landmark}</p>}
          {point.instructions && <p className="mt-2 rounded-md bg-amber-tint/60 px-2.5 py-1.5 text-xs text-ink-soft">{point.instructions}</p>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <a href={`tel:${point.phone}`} className="flex h-11 flex-col items-center justify-center rounded-lg bg-surface text-[11px] font-semibold text-navy ring-1 ring-line">
            <Phone className="size-4" /> Call
          </a>
          <a href={`sms:${point.phone}`} className="flex h-11 flex-col items-center justify-center rounded-lg bg-surface text-[11px] font-semibold text-navy ring-1 ring-line">
            <MessageSquare className="size-4" /> Text
          </a>
          <a href={mapsLink(point.address, point.lga, point.state)} target="_blank" rel="noreferrer" className="flex h-11 flex-col items-center justify-center rounded-lg bg-navy text-[11px] font-semibold text-white">
            <Navigation className="size-4" /> Navigate
          </a>
        </div>
        <p className="text-xs text-muted">{formatPhone(point.phone)}</p>
      </CardBody>
    </Card>
  );
}

export default function RiderDeliveryDetail() {
  const { id } = useParams<{ id: string }>();
  const { rider } = useAuth();
  const shipment = useShipment(id);
  const customer = useStore((s) => s.users.find((u) => u.id === shipment?.customerId));

  if (!shipment || shipment.riderId !== rider?.id) {
    return <NotFoundCard title="Delivery not found" description="This delivery isn't assigned to you." href="/rider/deliveries" cta="Back to my deliveries" />;
  }

  const toPickup = ["assigned", "accepted", "en_route_pickup"].includes(shipment.status);
  const done = shipment.status === "delivered" || shipment.status === "cancelled";

  return (
    <div className="pb-28 md:pb-0">
      <PageHeader title={shipment.reference} breadcrumbs={[{ label: "My deliveries", href: "/rider/deliveries" }, { label: shipment.reference }]} actions={<ShipmentStatusBadge status={shipment.status} />} />
      <Card className="mb-5">
        <CardBody>
          <RiderStepper shipment={shipment} />
        </CardBody>
        {!done && (
          <div className="hidden border-t border-line p-4 md:block">
            <RiderActions shipment={shipment} className="mx-auto max-w-md" />
          </div>
        )}
        {shipment.status === "delivered" && (
          <div className="border-t border-line p-4">
            <RiderActions shipment={shipment} />
          </div>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <StopCard title="Pickup" point={shipment.sender} tone="navy" active={toPickup} />
            <StopCard title="Drop-off" point={shipment.recipient} tone="emerald" active={!toPickup && !done} />
          </div>
          <TrackingMap shipment={shipment} height={260} />
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader title="Earnings" />
            <CardBody className="flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-lg bg-emerald-tint text-emerald-deep">
                <Wallet className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-extrabold text-navy tabular">{formatNaira(shipment.riderEarning)}</p>
                <p className="text-xs text-muted">{shipment.status === "delivered" ? "Added to your balance" : "Paid once the recipient confirms with PIN"}</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Package" />
            <CardBody className="pt-2">
              <dl className="divide-y divide-line">
                <DetailRow label="Category">
                  <span className="inline-flex items-center gap-1.5">
                    <Package className="size-3.5 text-muted" /> {PACKAGE_CATEGORIES[shipment.package.category]}
                  </span>
                </DetailRow>
                <DetailRow label="Description">{shipment.package.description}</DetailRow>
                <DetailRow label="Weight">
                  {shipment.package.quantity} × {shipment.package.weightKg} kg
                </DetailRow>
                <DetailRow label="Fragile">{shipment.package.fragile ? "Yes, handle with care" : "No"}</DetailRow>
                <DetailRow label="Service">{DELIVERY_TYPES[shipment.deliveryType].label}</DetailRow>
                <DetailRow label="Deadline">{formatDateTime(shipment.deadline)}</DetailRow>
              </dl>
              {shipment.package.imageDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shipment.package.imageDataUrl} alt="Package" className="mt-3 h-40 w-full rounded-lg object-cover ring-1 ring-line" />
              )}
            </CardBody>
          </Card>
          {customer && (
            <Card>
              <CardHeader title="Customer" />
              <CardBody className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-surface text-navy">
                  <User className="size-5" />
                </span>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold text-ink">{customer.name}</p>
                  <p className="text-xs text-muted">{formatPhone(customer.phone)}</p>
                </div>
                <a href={`tel:${customer.phone}`} className="inline-flex size-9 items-center justify-center rounded-full bg-emerald-tint text-emerald-deep" aria-label="Call customer">
                  <Phone className="size-4" />
                </a>
              </CardBody>
            </Card>
          )}
          <Card>
            <CardHeader title="Timeline" />
            <CardBody>
              <ShipmentTimeline shipment={shipment} compact />
            </CardBody>
          </Card>
          <p className="text-center text-xs text-muted">
            Need help? <Link href="tel:+2347007943856" className="font-semibold text-navy">Call rider support</Link>
          </p>
        </div>
      </div>

      {!done && (
        <div className="fixed inset-x-0 bottom-16 z-30 border-t border-line bg-white/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:hidden">
          <p className="mb-2 flex items-center justify-center gap-1 text-xs text-muted">
            <MapPin className="size-3.5" /> {toPickup ? `Pickup: ${shipment.sender.lga}` : `Drop-off: ${shipment.recipient.lga}`}
          </p>
          <RiderActions shipment={shipment} />
        </div>
      )}
    </div>
  );
}
