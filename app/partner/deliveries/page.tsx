"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Check, Inbox, MapPin, UserPlus } from "lucide-react";
import type { Shipment } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useShipments } from "@/hooks/use-shipments";
import { useStore } from "@/lib/services/store";
import { isActive } from "@/lib/services/selectors";
import { DELIVERY_TYPES, PACKAGE_CATEGORIES } from "@/lib/constants";
import { formatNaira, formatRelative } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge, Card, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { EmptyState, PageHeader } from "@/components/shared";
import { ShipmentTable } from "@/components/tables/shipment-table";
import { AssignRiderDialog } from "@/components/dialogs";
import { PartnerStatusBanner, partnerNet } from "@/components/dashboard/partner-banner";

function RequestCard({ s, action }: { s: Shipment; action: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-navy">{s.reference}</span>
          <Badge tone={s.deliveryType === "express" ? "danger" : "navy"}>{DELIVERY_TYPES[s.deliveryType].label}</Badge>
          {s.intercity && <Badge tone="info" dot={false}>Intercity</Badge>}
        </div>
        <p className="mt-1 flex items-center gap-1 text-sm text-ink-soft">
          <MapPin className="size-3.5 text-muted" /> {s.sender.lga}, {s.sender.state} → {s.recipient.lga}, {s.recipient.state}
        </p>
        <p className="text-xs text-muted">
          {PACKAGE_CATEGORIES[s.package.category]} · {s.package.weightKg * s.package.quantity} kg · {s.distanceKm} km · {formatRelative(s.createdAt)}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs text-muted">Your share</p>
          <p className="font-extrabold text-emerald-deep tabular">{formatNaira(partnerNet(s.amount, s.riderEarning))}</p>
        </div>
        {action}
      </div>
    </div>
  );
}

function PartnerDeliveries() {
  const router = useRouter();
  const params = useSearchParams();
  const { partner } = useAuth();
  const mine = useShipments({ partnerId: partner!.id });
  const all = useStore((s) => s.shipments);
  const claim = useStore((s) => s.partnerClaimShipment);
  const [assign, setAssign] = React.useState<Shipment | null>(null);
  const approved = partner!.verification === "approved" && partner!.status === "active";

  const incoming = approved ? all.filter((s) => s.status === "confirmed" && !s.riderId && !s.partnerId && partner!.operatingStates.includes(s.sender.state)) : [];
  const pending = mine.filter((s) => !s.riderId && s.status === "confirmed");
  const active = mine.filter(isActive);
  const completed = mine.filter((s) => s.status === "delivered" || s.status === "cancelled");
  const tab = params.get("tab") ?? (incoming.length ? "incoming" : "all");

  return (
    <>
      <PageHeader title="Deliveries" description="Accept requests in your coverage area and track every delivery your riders handle." />
      <PartnerStatusBanner partner={partner!} />
      <Tabs value={tab} onValueChange={(v) => router.replace(`/partner/deliveries?tab=${v}`)}>
        <TabsList className="mb-4">
          <TabsTrigger value="incoming">Incoming {incoming.length > 0 && <Badge tone="success" dot={false}>{incoming.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="pending">Pending assignment {pending.length > 0 && <Badge tone="amber" dot={false}>{pending.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value="incoming">
          <Card className="divide-y divide-line">
            {incoming.length === 0 ? (
              <EmptyState icon={Inbox} title={approved ? "No incoming requests right now" : "Requests unlock after approval"} description={approved ? `New bookings in ${partner!.operatingStates.join(", ")} will appear here.` : "SwiftLogix is reviewing your company documents."} />
            ) : (
              incoming.map((s) => (
                <RequestCard
                  key={s.id}
                  s={s}
                  action={
                    <Button
                      onClick={() => {
                        const res = claim(s.id, partner!.id);
                        if (res.ok) toast.success(`${s.reference} accepted. Assign a rider next.`);
                        else toast.error(res.error);
                      }}
                    >
                      <Check /> Accept
                    </Button>
                  }
                />
              ))
            )}
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card className="divide-y divide-line">
            {pending.length === 0 ? (
              <EmptyState icon={UserPlus} title="Nothing waiting for a rider" description="Accepted requests that still need a rider appear here." />
            ) : (
              pending.map((s) => (
                <RequestCard
                  key={s.id}
                  s={s}
                  action={
                    <Button variant="navy" onClick={() => setAssign(s)}>
                      <UserPlus /> Assign rider
                    </Button>
                  }
                />
              ))
            )}
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <ShipmentTable data={active} role="partner" showRider showCustomer partnerId={partner!.id} filters={[{ value: "all", label: "All" }]} emptyTitle="No active deliveries" />
        </TabsContent>
        <TabsContent value="completed">
          <ShipmentTable
            data={completed}
            role="partner"
            showRider
            partnerId={partner!.id}
            filters={[
              { value: "all", label: "All" },
              { value: "delivered", label: "Delivered" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            emptyTitle="No completed deliveries yet"
          />
        </TabsContent>
        <TabsContent value="all">
          <ShipmentTable data={mine} role="partner" showRider showCustomer partnerId={partner!.id} emptyTitle="No deliveries yet" emptyDescription="Accept incoming requests to get started." />
        </TabsContent>
      </Tabs>
      {assign && <AssignRiderDialog shipment={assign} open={!!assign} onOpenChange={(o) => !o && setAssign(null)} partnerId={partner!.id} />}
    </>
  );
}

export default function PartnerDeliveriesPage() {
  return (
    <Suspense>
      <PartnerDeliveries />
    </Suspense>
  );
}
