"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, CheckCircle2, KeyRound, MapPinned, Navigation, PackageCheck, PlayCircle, ThumbsUp, X } from "lucide-react";
import type { Shipment, ShipmentStatus } from "@/types";
import { useStore } from "@/lib/services/store";
import { cn, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, DeliveryPinDialog } from "@/components/dialogs";

/** The eight-step rider delivery workflow. */
export const RIDER_STEPS: { status: ShipmentStatus; label: string }[] = [
  { status: "assigned", label: "Delivery assigned" },
  { status: "accepted", label: "Accepted" },
  { status: "en_route_pickup", label: "Heading to pickup" },
  { status: "picked_up", label: "Pickup confirmed" },
  { status: "in_transit", label: "Delivery started" },
  { status: "arrived", label: "At destination" },
  { status: "arrived", label: "Recipient PIN" },
  { status: "delivered", label: "Delivered" },
];

const ORDER: ShipmentStatus[] = ["assigned", "accepted", "en_route_pickup", "picked_up", "in_transit", "arrived", "delivered"];

export function riderStepIndex(status: ShipmentStatus) {
  if (status === "delivered") return 7;
  if (status === "arrived") return 6;
  const i = ORDER.indexOf(status);
  return i < 0 ? 0 : i;
}

export function RiderStepper({ shipment, compact }: { shipment: Shipment; compact?: boolean }) {
  const current = riderStepIndex(shipment.status);
  return (
    <ol className={cn("grid gap-0", compact ? "grid-cols-8" : "grid-cols-1 sm:grid-cols-8")}>
      {RIDER_STEPS.map((s, i) => {
        const done = i < current || shipment.status === "delivered";
        const active = i === current && shipment.status !== "delivered";
        return (
          <li key={s.label} className={cn("flex items-center gap-2", compact ? "flex-col" : "py-1.5 sm:flex-col sm:py-0")}>
            <div className="flex w-full items-center">
              <span className={cn("hidden h-0.5 flex-1 sm:block", i === 0 ? "bg-transparent" : done || active ? "bg-emerald" : "bg-line", compact && "block")} />
              <span
                className={cn(
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                  done ? "bg-emerald text-white" : active ? "bg-navy text-white ring-4 ring-navy/15" : "bg-line text-muted",
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn("hidden h-0.5 flex-1 sm:block", i === RIDER_STEPS.length - 1 ? "bg-transparent" : done ? "bg-emerald" : "bg-line", compact && "block")} />
            </div>
            {!compact && <span className={cn("text-[13px] font-semibold sm:text-center sm:text-[11px]", active ? "text-navy" : done ? "text-ink-soft" : "text-muted")}>{s.label}</span>}
          </li>
        );
      })}
    </ol>
  );
}

const ACTIONS: Partial<Record<ShipmentStatus, { label: string; next: ShipmentStatus; icon: React.ComponentType<{ className?: string }>; hint: string }>> = {
  accepted: { label: "Head to pickup", next: "en_route_pickup", icon: Navigation, hint: "Let the customer know you're on your way." },
  en_route_pickup: { label: "Confirm pickup", next: "picked_up", icon: PackageCheck, hint: "Check the package matches the description before confirming." },
  picked_up: { label: "Start delivery", next: "in_transit", icon: PlayCircle, hint: "The recipient will be told the package is on its way." },
  in_transit: { label: "I've arrived", next: "arrived", icon: MapPinned, hint: "Mark arrival when you're at the destination." },
};

/** Primary status-update controls for the rider, enforcing the workflow order. */
export function RiderActions({ shipment, size = "lg", className }: { shipment: Shipment; size?: "md" | "lg"; className?: string }) {
  const accept = useStore((s) => s.acceptJob);
  const decline = useStore((s) => s.declineAssignment);
  const advance = useStore((s) => s.advanceShipment);
  const [busy, setBusy] = React.useState(false);
  const [pinOpen, setPinOpen] = React.useState(false);
  const [declineOpen, setDeclineOpen] = React.useState(false);

  const run = async (fn: () => { ok: boolean; error?: string }, success: string) => {
    setBusy(true);
    await sleep(450);
    const res = fn();
    setBusy(false);
    if (res.ok) toast.success(success);
    else toast.error(res.error ?? "Something went wrong");
  };

  if (shipment.status === "assigned") {
    return (
      <div className={cn("flex gap-2", className)}>
        <Button variant="secondary" size={size} className="flex-1" onClick={() => setDeclineOpen(true)}>
          <X /> Decline
        </Button>
        <Button size={size} className="flex-[2]" loading={busy} onClick={() => run(() => accept(shipment.id, shipment.riderId!) as { ok: boolean; error?: string }, "Delivery accepted")}>
          <ThumbsUp /> Accept delivery
        </Button>
        <ConfirmDialog
          open={declineOpen}
          onOpenChange={setDeclineOpen}
          title="Decline this delivery?"
          description="It will go back to the queue for another rider. Frequent declines can affect your rating."
          confirmLabel="Decline"
          tone="danger"
          onConfirm={() => {
            const r = decline(shipment.id);
            if (r.ok) toast.success("Delivery declined");
            else toast.error(r.error);
          }}
        />
      </div>
    );
  }

  if (shipment.status === "arrived") {
    return (
      <div className={className}>
        <Button size={size} className="w-full" onClick={() => setPinOpen(true)}>
          <KeyRound /> Enter delivery PIN
        </Button>
        <DeliveryPinDialog shipment={shipment} open={pinOpen} onOpenChange={setPinOpen} />
      </div>
    );
  }

  if (shipment.status === "delivered") {
    return (
      <p className={cn("flex items-center justify-center gap-2 rounded-lg bg-emerald-tint px-4 py-3 text-sm font-semibold text-emerald-deep", className)}>
        <CheckCircle2 className="size-5" /> Delivered and confirmed with PIN
      </p>
    );
  }

  const action = ACTIONS[shipment.status];
  if (!action) return null;
  const Icon = action.icon;
  return (
    <div className={className}>
      <Button size={size} className="w-full" loading={busy} onClick={() => run(() => advance(shipment.id, action.next) as { ok: boolean; error?: string }, `Status updated: ${action.label.toLowerCase()}`)}>
        <Icon /> {action.label}
      </Button>
      <p className="mt-1.5 text-center text-xs text-muted">{action.hint}</p>
    </div>
  );
}

export function mapsLink(address: string, lga: string, state: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${address}, ${lga}, ${state}, Nigeria`)}`;
}
