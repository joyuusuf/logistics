"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Ban, LifeBuoy, Navigation } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useShipment } from "@/hooks/use-shipments";
import { useStore } from "@/lib/services/store";
import { CANCELLABLE_STATUSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { NotFoundCard, PageHeader } from "@/components/shared";
import { ShipmentDetailView } from "@/components/dashboard/shipment-detail";
import { ConfirmDialog } from "@/components/dialogs";

export default function CustomerShipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const shipment = useShipment(id);
  const cancel = useStore((s) => s.cancelShipment);
  const [open, setOpen] = React.useState(false);

  if (!shipment || shipment.customerId !== user?.id) {
    return <NotFoundCard title="Shipment not found" description="This shipment doesn't exist or belongs to another account." href="/customer/shipments" cta="Back to my shipments" />;
  }

  const canCancel = CANCELLABLE_STATUSES.includes(shipment.status);

  return (
    <>
      <PageHeader title="Shipment details" breadcrumbs={[{ label: "My shipments", href: "/customer/shipments" }, { label: shipment.reference }]} />
      <ShipmentDetailView
        shipment={shipment}
        role="customer"
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href={`/customer/support?shipment=${shipment.reference}`}>
                <LifeBuoy /> Contact support
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/track?ref=${shipment.reference}`}>
                <Navigation /> Public tracking page
              </Link>
            </Button>
            {canCancel && (
              <Button variant="danger-ghost" onClick={() => setOpen(true)}>
                <Ban /> Cancel shipment
              </Button>
            )}
          </>
        }
      />
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Cancel ${shipment.reference}?`}
        description="You can cancel free of charge until the rider picks up the package. Your payment will be refunded to the original method."
        confirmLabel="Yes, cancel"
        tone="danger"
        onConfirm={() => {
          const res = cancel(shipment.id, "Cancelled by customer");
          if (res.ok) toast.success("Shipment cancelled and refund issued");
          else toast.error(res.error);
        }}
      />
    </>
  );
}
