"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Undo2, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useShipment } from "@/hooks/use-shipments";
import { useStore } from "@/lib/services/store";
import { formatNaira } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/primitives";
import { NotFoundCard, PageHeader } from "@/components/shared";
import { ShipmentDetailView } from "@/components/dashboard/shipment-detail";
import { AssignRiderDialog } from "@/components/dialogs";
import { PLATFORM_FEE_PCT, partnerNet } from "@/components/dashboard/partner-banner";

export default function PartnerDeliveryDetail() {
  const { id } = useParams<{ id: string }>();
  const { partner } = useAuth();
  const shipment = useShipment(id);
  const release = useStore((s) => s.partnerReleaseShipment);
  const [open, setOpen] = React.useState(false);

  if (!shipment || shipment.partnerId !== partner?.id) {
    return <NotFoundCard title="Delivery not found" description="This delivery isn't handled by your company." href="/partner/deliveries" cta="Back to deliveries" />;
  }
  const canAssign = ["confirmed", "assigned"].includes(shipment.status);

  return (
    <>
      <PageHeader title="Delivery details" breadcrumbs={[{ label: "Deliveries", href: "/partner/deliveries" }, { label: shipment.reference }]} />
      <ShipmentDetailView
        shipment={shipment}
        role="partner"
        actions={
          canAssign && (
            <>
              {!shipment.riderId && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    const r = release(shipment.id);
                    if (r.ok) toast.success("Request released back to the marketplace");
                    else toast.error(r.error);
                  }}
                >
                  <Undo2 /> Release request
                </Button>
              )}
              <Button onClick={() => setOpen(true)}>
                <UserPlus /> {shipment.riderId ? "Reassign rider" : "Assign rider"}
              </Button>
            </>
          )
        }
        banner={
          <Card>
            <CardBody className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              {[
                ["Gross value", formatNaira(shipment.amount)],
                ["Rider pay", formatNaira(shipment.riderEarning)],
                [`Platform fee (${PLATFORM_FEE_PCT}%)`, formatNaira((shipment.amount * PLATFORM_FEE_PCT) / 100)],
                ["Your share", formatNaira(partnerNet(shipment.amount, shipment.riderEarning))],
              ].map(([l, v], i) => (
                <div key={l}>
                  <p className="text-xs text-muted">{l}</p>
                  <p className={i === 3 ? "text-lg font-extrabold text-emerald-deep tabular" : "text-lg font-bold text-ink tabular"}>{v}</p>
                </div>
              ))}
            </CardBody>
          </Card>
        }
      />
      <AssignRiderDialog shipment={shipment} open={open} onOpenChange={setOpen} partnerId={partner!.id} />
    </>
  );
}
