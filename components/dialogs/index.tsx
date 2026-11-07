"use client";

import * as React from "react";
import { toast } from "sonner";
import { Bike, Search, ShieldCheck, Star } from "lucide-react";
import type { Rider, Shipment } from "@/types";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/services/store";
import { RIDER_AVAILABILITY, VEHICLE_CATEGORIES } from "@/lib/constants";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/overlays";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Avatar, Badge } from "@/components/ui/primitives";
import { EmptyState } from "@/components/shared";

/* ------------------------------ Confirm ------------------------------ */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "primary",
  onConfirm,
  requireReason,
  reasonLabel = "Reason",
  reasonPlaceholder,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: "primary" | "danger";
  onConfirm: (reason?: string) => void | Promise<void>;
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
}) {
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string>();
  React.useEffect(() => {
    if (open) {
      setReason("");
      setError(undefined);
    }
  }, [open]);
  const submit = async () => {
    if (requireReason && reason.trim().length < 5) {
      setError("Please give a short reason (at least 5 characters).");
      return;
    }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 350));
    await onConfirm(reason.trim() || undefined);
    setBusy(false);
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} description={description} size="sm">
        {requireReason && (
          <Field label={reasonLabel} error={error}>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={reasonPlaceholder} aria-invalid={!!error} />
          </Field>
        )}
        <DialogFooter className={requireReason ? undefined : "mt-0 border-t-0 bg-transparent pt-0"}>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={submit} loading={busy}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------ Assign rider ------------------------------ */
/**
 * Mock assignment logic: ranks verified, active riders by
 * same-state match, availability, current load and rating.
 */
export function rankRiders(riders: Rider[], shipments: Shipment[], shipment: Shipment) {
  return riders
    .filter((r) => r.verification === "approved" && r.status === "active")
    .map((r) => {
      const load = shipments.filter((s) => s.riderId === r.id && ["assigned", "accepted", "en_route_pickup", "picked_up", "in_transit", "arrived"].includes(s.status)).length;
      const sameState = r.state === shipment.sender.state;
      const capable = shipment.package.weightKg * shipment.package.quantity <= VEHICLE_CATEGORIES[r.vehicleType].capacityKg;
      const score = (sameState ? 50 : 0) + (r.availability === "online" ? 30 : r.availability === "busy" ? 10 : 0) - load * 12 + r.rating * 4 + (capable ? 10 : -40);
      return { rider: r, load, sameState, capable, score };
    })
    .sort((a, b) => b.score - a.score);
}

export function AssignRiderDialog({ shipment, open, onOpenChange, partnerId }: { shipment: Shipment; open: boolean; onOpenChange: (o: boolean) => void; partnerId?: string }) {
  const riders = useStore((s) => s.riders);
  const shipments = useStore((s) => s.shipments);
  const assign = useStore((s) => s.assignRider);
  const [q, setQ] = React.useState("");
  const [selected, setSelected] = React.useState<string>();
  const [busy, setBusy] = React.useState(false);

  const ranked = React.useMemo(() => {
    const pool = partnerId ? riders.filter((r) => r.partnerId === partnerId) : riders;
    return rankRiders(pool, shipments, shipment).filter((x) => !q || x.rider.name.toLowerCase().includes(q.toLowerCase()) || x.rider.lga.toLowerCase().includes(q.toLowerCase()));
  }, [riders, shipments, shipment, partnerId, q]);

  React.useEffect(() => {
    if (open) {
      setSelected(undefined);
      setQ("");
    }
  }, [open]);

  const submit = async () => {
    if (!selected) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 400));
    const res = assign(shipment.id, selected);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Rider assigned to ${shipment.reference}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Assign a rider" description={`${shipment.reference} · ${shipment.sender.lga} to ${shipment.recipient.lga}`} size="md">
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search riders by name or LGA" className="pl-9" />
        </div>
        <p className="mb-2 text-xs text-muted">Riders are ranked by location match, availability, current workload and rating.</p>
        {ranked.length === 0 ? (
          <EmptyState icon={Bike} title="No eligible riders" description="Only verified, active riders can be assigned. Add or verify riders first." />
        ) : (
          <ul className="max-h-[48vh] space-y-2 overflow-y-auto pr-1 scrollbar-thin" role="radiogroup" aria-label="Riders">
            {ranked.map(({ rider, load, sameState, capable }, i) => (
              <li key={rider.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected === rider.id}
                  onClick={() => setSelected(rider.id)}
                  className={cn("flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors", selected === rider.id ? "border-emerald bg-emerald-tint/50 ring-2 ring-emerald/15" : "border-line hover:border-line-strong")}
                >
                  <Avatar name={rider.name} src={rider.avatarUrl} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                      {rider.name}
                      {i === 0 && <Badge tone="success" dot={false}>Best match</Badge>}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {VEHICLE_CATEGORIES[rider.vehicleType].label} · {rider.lga}, {rider.state} · {load} active
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge tone={RIDER_AVAILABILITY[rider.availability].tone}>{RIDER_AVAILABILITY[rider.availability].label}</Badge>
                      {!sameState && <Badge tone="warning" dot={false}>Different state</Badge>}
                      {!capable && <Badge tone="danger" dot={false}>Vehicle too small</Badge>}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft">
                    <Star className="size-3.5 fill-amber text-amber" />
                    {rider.rating.toFixed(1)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!selected} loading={busy}>
            Assign rider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------ Delivery PIN ------------------------------ */
export function DeliveryPinDialog({ shipment, open, onOpenChange, onDone }: { shipment: Shipment; open: boolean; onOpenChange: (o: boolean) => void; onDone?: () => void }) {
  const confirm = useStore((s) => s.confirmDelivery);
  const [digits, setDigits] = React.useState(["", "", "", ""]);
  const [error, setError] = React.useState<string>();
  const [busy, setBusy] = React.useState(false);
  const [showHint, setShowHint] = React.useState(false);
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    if (open) {
      setDigits(["", "", "", ""]);
      setError(undefined);
      setShowHint(false);
      setTimeout(() => refs.current[0]?.focus(), 50);
    }
  }, [open]);

  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "");
    if (clean.length > 1) {
      const all = clean.slice(0, 4).split("");
      setDigits([0, 1, 2, 3].map((k) => all[k] ?? ""));
      refs.current[Math.min(3, all.length)]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    setError(undefined);
    if (clean && i < 3) refs.current[i + 1]?.focus();
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const pin = digits.join("");
    if (pin.length !== 4) {
      setError("Enter all four digits.");
      return;
    }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 500));
    const res = confirm(shipment.id, pin);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      setDigits(["", "", "", ""]);
      refs.current[0]?.focus();
      return;
    }
    toast.success("Delivery confirmed. Earnings added to your balance.");
    onOpenChange(false);
    onDone?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Confirm delivery" description={`Ask ${shipment.recipient.name} for the 4-digit delivery PIN.`} size="sm">
        <form onSubmit={submit}>
          <div className="mx-auto mb-2 inline-flex size-12 w-full items-center justify-center">
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-emerald-tint text-emerald-deep">
              <ShieldCheck className="size-6" />
            </span>
          </div>
          <div className="flex justify-center gap-3" role="group" aria-label="Delivery PIN">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                aria-label={`Digit ${i + 1}`}
                aria-invalid={!!error}
                className={cn("size-14 rounded-xl border-2 text-center text-2xl font-extrabold text-navy outline-none tabular focus:border-emerald focus:ring-4 focus:ring-emerald/15", error ? "border-danger" : "border-line-strong")}
              />
            ))}
          </div>
          {error && <p role="alert" className="mt-3 text-center text-[13px] font-medium text-danger">{error}</p>}
          <div className="mt-5 rounded-lg bg-surface p-3 text-xs text-muted">
            The shipment cannot be marked delivered without the correct PIN.{" "}
            <button type="button" className="font-semibold text-navy underline-offset-2 hover:underline" onClick={() => setShowHint((v) => !v)}>
              {showHint ? "Hide demo PIN" : "Demo: show PIN"}
            </button>
            {showHint && <span className="ml-1 font-bold text-ink tabular">{shipment.pin}</span>}
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={busy} size="lg" className="sm:h-10">
              Confirm delivery
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
