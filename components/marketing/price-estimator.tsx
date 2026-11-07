"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import type { DeliveryType } from "@/types";
import { useStore } from "@/lib/services/store";
import { useHydrated } from "@/hooks/use-hydrated";
import { calculatePrice } from "@/lib/calculations/pricing";
import { estimateDistanceKm } from "@/lib/calculations/distance";
import { DELIVERY_TYPES } from "@/lib/constants";
import { DEFAULT_PRICING } from "@/lib/calculations/pricing";
import { formatNaira, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/primitives";
import { LgaInput, StateSelect } from "@/components/forms";

/** Public price estimator powered by the same engine as booking and admin pricing. */
export function PriceEstimator() {
  const hydrated = useHydrated();
  const storePricing = useStore((s) => s.pricing);
  const pricing = hydrated ? storePricing : DEFAULT_PRICING;
  const [from, setFrom] = React.useState({ state: "Lagos", lga: "Ikeja" });
  const [to, setTo] = React.useState({ state: "Lagos", lga: "Eti-Osa" });
  const [weight, setWeight] = React.useState("3");
  const [fragile, setFragile] = React.useState(false);
  const [type, setType] = React.useState<DeliveryType>("standard");

  const ready = from.state && from.lga && to.state && to.lga;
  const dist = ready ? estimateDistanceKm(from, to) : null;
  const price = dist ? calculatePrice({ distanceKm: dist.km, intercity: dist.intercity, weightKg: Number(weight) || 0, quantity: 1, fragile, deliveryType: type }, pricing) : null;

  return (
    <div className="grid overflow-hidden rounded-2xl border border-line bg-white shadow-raised lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-5 p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pickup state">
            <StateSelect value={from.state} onChange={(v) => setFrom({ state: v, lga: "" })} />
          </Field>
          <Field label="Pickup LGA">
            <LgaInput state={from.state} value={from.lga} onChange={(v) => setFrom((f) => ({ ...f, lga: v }))} />
          </Field>
          <Field label="Destination state">
            <StateSelect value={to.state} onChange={(v) => setTo({ state: v, lga: "" })} />
          </Field>
          <Field label="Destination LGA">
            <LgaInput state={to.state} value={to.lga} onChange={(v) => setTo((f) => ({ ...f, lga: v }))} />
          </Field>
          <Field label="Package weight (kg)">
            <Input type="number" min={0.1} step={0.1} value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal" />
          </Field>
          <div className="flex items-end">
            <label className="flex h-10 w-full items-center justify-between rounded-md border border-line-strong px-3 text-sm font-medium text-ink">
              Fragile handling
              <Switch checked={fragile} onCheckedChange={setFragile} />
            </label>
          </div>
        </div>
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink">Delivery speed</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(DELIVERY_TYPES) as DeliveryType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                aria-pressed={type === t}
                className={cn("rounded-lg border px-3 py-2.5 text-left transition-colors", type === t ? "border-emerald bg-emerald-tint/50 ring-2 ring-emerald/15" : "border-line hover:border-line-strong")}
              >
                <span className="block text-sm font-bold text-navy">{DELIVERY_TYPES[t].label}</span>
                <span className="block text-[11px] text-muted">{DELIVERY_TYPES[t].description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col bg-navy p-6 text-white sm:p-8">
        <p className="text-xs font-bold tracking-[0.14em] text-white/50 uppercase">Estimated price</p>
        <p className="mt-2 text-5xl font-extrabold tracking-tight tabular">{price ? formatNaira(price.total) : "—"}</p>
        {dist && (
          <p className="mt-2 text-sm text-white/60">
            About {dist.km} km {dist.intercity ? "· Intercity route" : "· Within the state"}
          </p>
        )}
        {price && (
          <dl className="mt-6 space-y-2.5 border-t border-white/10 pt-5 text-sm">
            {[
              ["Base fee", price.baseFee],
              ["Distance", price.distanceFee],
              ["Weight", price.weightFee],
              ["Handling", price.specialFee],
              [type === "scheduled" ? "Scheduled discount" : "Speed surcharge", price.serviceSurcharge],
            ].map(([l, v]) => (
              <div key={l as string} className="flex justify-between">
                <dt className="text-white/60">{l}</dt>
                <dd className="font-semibold tabular">{formatNaira(v as number)}</dd>
              </div>
            ))}
          </dl>
        )}
        <p className="mt-6 flex gap-2 text-xs text-white/50">
          <Info className="size-4 shrink-0" />
          Estimates use simulated distances. The final price is confirmed at booking from exact addresses.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/customer/book">
            Book this delivery <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
