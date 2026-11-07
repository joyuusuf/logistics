"use client";

import * as React from "react";
import { Check, Clock, MapPin, Navigation, Package, Radio } from "lucide-react";
import type { Shipment, ShipmentStatus } from "@/types";
import { cn, formatDateTime, formatRelative } from "@/lib/utils";
import { STATUS_FLOW, TIMELINE_LABELS } from "@/lib/constants";
import { getRiderPosition } from "@/lib/services/location";

/* ------------------------------ Timeline ------------------------------ */
const CUSTOMER_STEPS: ShipmentStatus[] = ["pending", "confirmed", "assigned", "accepted", "picked_up", "in_transit", "arrived", "delivered"];

export function ShipmentTimeline({ shipment, compact }: { shipment: Shipment; compact?: boolean }) {
  if (shipment.status === "cancelled") {
    return (
      <ol className="relative space-y-0">
        {shipment.timeline.map((e, i) => (
          <TimelineItem key={`${e.status}-${i}`} label={e.label} at={e.at} note={e.note} state={e.status === "cancelled" ? "cancelled" : "done"} last={i === shipment.timeline.length - 1} compact={compact} />
        ))}
      </ol>
    );
  }
  const currentIdx = STATUS_FLOW.indexOf(shipment.status);
  const steps = CUSTOMER_STEPS.filter((s) => s !== "en_route_pickup");
  return (
    <ol className="relative">
      {steps.map((step, i) => {
        const ev = [...shipment.timeline].reverse().find((e) => e.status === step);
        const stepIdx = STATUS_FLOW.indexOf(step);
        const state = stepIdx < currentIdx || (stepIdx === currentIdx && step === "delivered") ? "done" : stepIdx === currentIdx ? "current" : "upcoming";
        return <TimelineItem key={step} label={ev?.label ?? TIMELINE_LABELS[step]} at={ev?.at} note={ev?.note} state={ev && state === "upcoming" ? "done" : state} last={i === steps.length - 1} compact={compact} />;
      })}
    </ol>
  );
}

function TimelineItem({ label, at, note, state, last, compact }: { label: string; at?: string; note?: string; state: "done" | "current" | "upcoming" | "cancelled"; last: boolean; compact?: boolean }) {
  return (
    <li className={cn("relative flex gap-3", compact ? "pb-3" : "pb-5", last && "pb-0")}>
      {!last && <span className={cn("absolute top-6 bottom-0 left-[11px] w-0.5", state === "done" ? "bg-emerald" : "bg-line")} />}
      <span
        className={cn(
          "relative z-10 mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full ring-4 ring-white",
          state === "done" && "bg-emerald text-white",
          state === "current" && "bg-navy text-white",
          state === "upcoming" && "border-2 border-line-strong bg-white",
          state === "cancelled" && "bg-danger text-white",
        )}
      >
        {state === "done" && <Check className="size-3.5" strokeWidth={3} />}
        {state === "current" && (
          <>
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-navy/40" />
            <span className="size-2 rounded-full bg-white" />
          </>
        )}
        {state === "cancelled" && <span className="text-[11px] font-bold">✕</span>}
      </span>
      <div className="min-w-0 pt-0.5">
        <p className={cn("text-sm font-semibold", state === "upcoming" ? "text-muted" : "text-ink")}>{label}</p>
        {at && <p className="text-xs text-muted">{formatDateTime(at)}</p>}
        {note && <p className="mt-0.5 text-xs text-ink-soft">{note}</p>}
      </div>
    </li>
  );
}

/* ------------------------------ Progress strip ------------------------------ */
export function DeliveryProgress({ shipment }: { shipment: Shipment }) {
  const stages = [
    { key: "confirmed", label: "Booked" },
    { key: "accepted", label: "Rider matched" },
    { key: "picked_up", label: "Picked up" },
    { key: "in_transit", label: "On the way" },
    { key: "delivered", label: "Delivered" },
  ] as const;
  const idx = STATUS_FLOW.indexOf(shipment.status);
  const reached = (k: ShipmentStatus) => shipment.status !== "cancelled" && idx >= STATUS_FLOW.indexOf(k);
  const done = stages.filter((s) => reached(s.key)).length;
  return (
    <div>
      <div className="flex gap-1.5">
        {stages.map((s) => (
          <span key={s.key} className={cn("h-1.5 flex-1 rounded-full", reached(s.key) ? "bg-emerald" : "bg-line")} />
        ))}
      </div>
      <div className="mt-2 hidden justify-between text-[11px] font-semibold text-muted sm:flex">
        {stages.map((s) => (
          <span key={s.key} className={cn(reached(s.key) && "text-ink")}>
            {s.label}
          </span>
        ))}
      </div>
      <p className="mt-1 text-xs text-muted sm:hidden">
        Step {done} of {stages.length}: {stages[Math.max(0, done - 1)].label}
      </p>
    </div>
  );
}

/* ------------------------------ Simulated map ------------------------------ */
// Cubic bezier from pickup (P0) to destination (P3) in a 600x340 viewBox.
const P0 = { x: 90, y: 262 };
const P1 = { x: 210, y: 120 };
const P2 = { x: 370, y: 300 };
const P3 = { x: 515, y: 86 };
const APPROACH = { x: 40, y: 150 };

function bezier(t: number) {
  const u = 1 - t;
  return {
    x: u ** 3 * P0.x + 3 * u * u * t * P1.x + 3 * u * t * t * P2.x + t ** 3 * P3.x,
    y: u ** 3 * P0.y + 3 * u * u * t * P1.y + 3 * u * t * t * P2.y + t ** 3 * P3.y,
  };
}

/**
 * Polished map placeholder with a clearly labelled simulated route.
 * Swap for a Google Maps / Mapbox adapter once NEXT_PUBLIC_MAP_PROVIDER and a
 * real rider-location feed are available (see lib/services/location.ts).
 */
export function TrackingMap({ shipment, className, height = 300 }: { shipment: Shipment; className?: string; height?: number }) {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (shipment.status !== "in_transit") return;
    const t = setInterval(() => setTick((x) => x + 1), 15000);
    return () => clearInterval(t);
  }, [shipment.status]);

  const pos = React.useMemo(() => getRiderPosition(shipment), [shipment, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const showRider = !!shipment.riderId && shipment.status !== "cancelled" && pos.progress > -1;
  const riderPoint = pos.progress >= 0 ? bezier(Math.min(1, pos.progress)) : { x: APPROACH.x + (P0.x - APPROACH.x) * (1 + pos.progress / 0.4), y: APPROACH.y + (P0.y - APPROACH.y) * (1 + pos.progress / 0.4) };
  const traveled = Math.max(0, Math.min(1, pos.progress));
  const pathD = `M${P0.x},${P0.y} C${P1.x},${P1.y} ${P2.x},${P2.y} ${P3.x},${P3.y}`;

  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-line map-grid", className)} style={{ height }}>
      <svg viewBox="0 0 600 340" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" role="img" aria-label={`Simulated route from ${shipment.sender.lga} to ${shipment.recipient.lga}`}>
        {/* water and parks */}
        <path d="M0 300 C120 280 180 330 300 318 S520 290 600 310 L600 340 L0 340 Z" fill="#d7e8f3" />
        <path d="M420 0 C440 40 500 50 600 30 L600 0 Z" fill="#d7e8f3" />
        <rect x="250" y="40" width="70" height="46" rx="10" fill="#dcefe5" />
        <rect x="455" y="190" width="90" height="56" rx="12" fill="#dcefe5" />
        {/* roads */}
        <g stroke="#ffffff" strokeLinecap="round" fill="none">
          <path d="M0 200 C150 180 260 220 600 170" strokeWidth="14" />
          <path d="M160 0 C170 120 140 230 180 340" strokeWidth="10" />
          <path d="M380 0 C360 120 420 220 400 340" strokeWidth="10" />
          <path d="M0 90 C200 110 420 60 600 110" strokeWidth="8" />
        </g>
        <g stroke="#e3e9ee" strokeLinecap="round" fill="none" strokeWidth="4">
          <path d="M60 0 L90 340" />
          <path d="M260 0 L240 340" />
          <path d="M520 0 L560 340" />
          <path d="M0 250 L600 230" />
        </g>
        {/* route */}
        <path d={pathD} stroke="#142C45" strokeOpacity="0.18" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d={pathD} stroke="#142C45" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="8 8" className="animate-route-dash" />
        <path d={pathD} stroke="#16A477" strokeWidth="5" fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${traveled} 1`} />
        {showRider && pos.progress < 0 && <path d={`M${APPROACH.x},${APPROACH.y} L${P0.x},${P0.y}`} stroke="#F2B84B" strokeWidth="3" strokeDasharray="4 6" fill="none" />}

        {/* pickup marker */}
        <g transform={`translate(${P0.x},${P0.y})`}>
          <circle r="14" fill="#142C45" />
          <circle r="5" fill="#fff" />
        </g>
        {/* destination marker */}
        <g transform={`translate(${P3.x},${P3.y - 18})`}>
          <path d="M0 18 C-12 6 -14 0 -14 -4 A14 14 0 1 1 14 -4 C14 0 12 6 0 18Z" fill="#16A477" />
          <circle cy="-4" r="5" fill="#fff" />
        </g>
        {/* rider */}
        {showRider && (
          <g transform={`translate(${riderPoint.x},${riderPoint.y})`}>
            <circle r="20" fill="#F2B84B" opacity="0.25">
              <animate attributeName="r" values="12;24;12" dur="2.2s" repeatCount="indefinite" />
            </circle>
            <circle r="11" fill="#F2B84B" stroke="#fff" strokeWidth="3" />
          </g>
        )}
      </svg>

      {/* overlays */}
      <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink-soft shadow-card">
          <Radio className="size-3 text-amber" />
          Simulated route. Not live GPS.
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-navy px-2.5 py-1 text-[11px] font-semibold text-white shadow-card">
          <Navigation className="size-3" />
          {shipment.distanceKm} km
        </span>
      </div>
      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap justify-between gap-2 text-[11px] font-semibold">
        <span className="inline-flex max-w-[48%] items-center gap-1.5 truncate rounded-md bg-white/95 px-2 py-1 text-ink shadow-card">
          <span className="size-2 shrink-0 rounded-full bg-navy" />
          <span className="truncate">{shipment.sender.lga}</span>
        </span>
        <span className="inline-flex max-w-[48%] items-center gap-1.5 truncate rounded-md bg-white/95 px-2 py-1 text-ink shadow-card">
          <MapPin className="size-3 shrink-0 text-emerald" />
          <span className="truncate">{shipment.recipient.lga}</span>
        </span>
      </div>
    </div>
  );
}

export function EtaCard({ shipment }: { shipment: Shipment }) {
  const delivered = shipment.status === "delivered";
  const cancelled = shipment.status === "cancelled";
  return (
    <div className="flex items-center gap-3 rounded-lg bg-navy px-4 py-3 text-white">
      <span className="inline-flex size-9 items-center justify-center rounded-lg bg-white/10">{delivered ? <Package className="size-4" /> : <Clock className="size-4" />}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-wide text-white/60 uppercase">{delivered ? "Delivered" : cancelled ? "Cancelled" : "Estimated arrival"}</p>
        <p className="truncate text-sm font-bold">
          {delivered && shipment.deliveredAt ? formatDateTime(shipment.deliveredAt) : cancelled ? "This shipment was cancelled" : formatDateTime(shipment.estimatedArrival)}
        </p>
        {!delivered && !cancelled && <p className="text-xs text-white/60">{formatRelative(shipment.estimatedArrival)}</p>}
      </div>
    </div>
  );
}
