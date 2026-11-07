"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Ban, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { useStore } from "@/lib/services/store";
import { Button } from "@/components/ui/button";
import { NotFoundCard, PageHeader } from "@/components/shared";
import { ConfirmDialog } from "@/components/dialogs";
import { RiderProfileContent } from "@/components/dashboard/rider-profile";

export default function AdminRiderDetail() {
  const { id } = useParams<{ id: string }>();
  const rider = useStore((s) => s.riders.find((r) => r.id === id));
  const review = useStore((s) => s.reviewRider);
  const setStatus = useStore((s) => s.setRiderStatus);
  const [dialog, setDialog] = React.useState<"approve" | "reject" | "suspend" | null>(null);

  if (!rider) return <NotFoundCard title="Rider not found" description="This rider doesn't exist." href="/admin/riders" cta="Back to riders" />;
  const reviewable = rider.verification === "under_review" || rider.verification === "rejected";

  return (
    <>
      <PageHeader
        title="Rider profile"
        breadcrumbs={[{ label: "Riders", href: "/admin/riders" }, { label: rider.name }]}
        actions={
          <>
            {reviewable && (
              <>
                {rider.verification === "under_review" && (
                  <Button variant="danger-ghost" onClick={() => setDialog("reject")}>
                    <XCircle /> Reject
                  </Button>
                )}
                <Button onClick={() => setDialog("approve")}>
                  <CheckCircle2 /> Approve rider
                </Button>
              </>
            )}
            {rider.status === "active" ? (
              <Button variant="secondary" onClick={() => setDialog("suspend")}>
                <Ban /> Suspend
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  setStatus(rider.id, "active");
                  toast.success("Rider reactivated");
                }}
              >
                <RotateCcw /> Reactivate
              </Button>
            )}
          </>
        }
      />
      <RiderProfileContent rider={rider} linkBase="/admin/deliveries" />
      <ConfirmDialog
        open={dialog === "approve"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Approve ${rider.name}?`}
        description="All submitted documents will be marked approved and the rider can start accepting deliveries."
        confirmLabel="Approve"
        onConfirm={() => {
          review(rider.id, "approved");
          toast.success(`${rider.name} approved`);
        }}
      />
      <ConfirmDialog
        open={dialog === "reject"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Reject ${rider.name}'s application?`}
        description="The rider will see your reason and can re-upload documents."
        confirmLabel="Reject"
        tone="danger"
        requireReason
        reasonLabel="Reason shown to the rider"
        reasonPlaceholder="e.g. Driver's licence photo is blurry"
        onConfirm={(reason) => {
          review(rider.id, "rejected", reason);
          toast.success("Application rejected");
        }}
      />
      <ConfirmDialog
        open={dialog === "suspend"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Suspend ${rider.name}?`}
        description="They'll be taken offline and blocked from new deliveries."
        confirmLabel="Suspend"
        tone="danger"
        requireReason
        onConfirm={() => {
          setStatus(rider.id, "suspended");
          toast.success("Rider suspended");
        }}
      />
    </>
  );
}
