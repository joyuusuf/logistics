"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Ban, UserPlus } from "lucide-react";
import { useShipment } from "@/hooks/use-shipments";
import { useStore } from "@/lib/services/store";
import { CANCELLABLE_STATUSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { NotFoundCard, PageHeader } from "@/components/shared";
import { ShipmentDetailView } from "@/components/dashboard/shipment-detail";
import { AssignRiderDialog, ConfirmDialog } from "@/components/dialogs";

export default function AdminDeliveryDetail() {
  const { id } = useParams<{ id: string }>();
  const shipment = useShipment(id);
  const cancel = useStore((s) => s.cancelShipment);
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);

  if (!shipment) return <NotFoundCard title="Shipment not found" description="It may have been removed by a demo reset." href="/admin/deliveries" cta="Back to deliveries" />;

  const canAssign = ["pending", "confirmed", "assigned"].includes(shipment.status);
  const canCancel = CANCELLABLE_STATUSES.includes(shipment.status);

  return (
    <>
      <PageHeader title="Delivery details" breadcrumbs={[{ label: "Deliveries", href: "/admin/deliveries" }, { label: shipment.reference }]} />
      <ShipmentDetailView
        shipment={shipment}
        role="admin"
        actions={
          <>
            {canAssign && (
              <Button onClick={() => setAssignOpen(true)}>
                <UserPlus /> {shipment.riderId ? "Reassign rider" : "Assign rider"}
              </Button>
            )}
            {canCancel && (
              <Button variant="danger-ghost" onClick={() => setCancelOpen(true)}>
                <Ban /> Cancel
              </Button>
            )}
          </>
        }
      />
      <AssignRiderDialog shipment={shipment} open={assignOpen} onOpenChange={setAssignOpen} />
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={`Cancel ${shipment.reference}?`}
        description="The customer is refunded and the rider notified. This is recorded in the audit log."
        confirmLabel="Cancel shipment"
        tone="danger"
        requireReason
        reasonPlaceholder="Reason shared with the customer"
        onConfirm={(reason) => {
          const r = cancel(shipment.id, reason);
          if (r.ok) toast.success("Shipment cancelled");
          else toast.error(r.error);
        }}
      />
    </>
  );
}
