"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Calculator, RotateCcw, Save } from "lucide-react";
import type { DeliveryType, PricingConfig } from "@/types";
import { useStore } from "@/lib/services/store";
import { DEFAULT_PRICING, calculatePrice } from "@/lib/calculations/pricing";
import { DELIVERY_TYPES } from "@/lib/constants";
import { formatNaira, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card, CardBody, CardHeader, DetailRow, Switch } from "@/components/ui/primitives";
import { PageHeader } from "@/components/shared";
import { ConfirmDialog } from "@/components/dialogs";

const num = (min: number, max: number) => z.coerce.number<number>({ message: "Enter a number" }).min(min, `Min ${min}`).max(max, `Max ${max}`);
const schema = z.object({
  baseFee: num(0, 100000),
  perKm: num(0, 5000),
  freeWeightKg: num(0, 100),
  perKgAbove: num(0, 5000),
  expressSurchargePct: num(0, 300),
  sameDaySurchargePct: num(0, 300),
  scheduledDiscountPct: num(0, 50),
  intercityBaseFee: num(0, 200000),
  intercityPerKm: num(0, 2000),
  fragileFee: num(0, 50000),
  bulkFeePerExtraItem: num(0, 20000),
  minimumFee: num(0, 50000),
  riderSharePct: num(30, 95),
});

const GROUPS: { title: string; description: string; fields: { key: keyof PricingConfig; label: string; suffix: string }[] }[] = [
  {
    title: "Base and distance",
    description: "Applied to deliveries within the same state.",
    fields: [
      { key: "baseFee", label: "Base delivery fee", suffix: "₦" },
      { key: "perKm", label: "Per-kilometre fee", suffix: "₦/km" },
      { key: "minimumFee", label: "Minimum charge", suffix: "₦" },
    ],
  },
  {
    title: "Package weight",
    description: "Charges for heavier packages.",
    fields: [
      { key: "freeWeightKg", label: "Free weight allowance", suffix: "kg" },
      { key: "perKgAbove", label: "Charge per extra kg", suffix: "₦/kg" },
    ],
  },
  {
    title: "Delivery speed",
    description: "Surcharges and discounts by delivery option.",
    fields: [
      { key: "expressSurchargePct", label: "Express surcharge", suffix: "%" },
      { key: "sameDaySurchargePct", label: "Same-day surcharge", suffix: "%" },
      { key: "scheduledDiscountPct", label: "Scheduled discount", suffix: "%" },
    ],
  },
  {
    title: "Intercity",
    description: "Used when pickup and destination are in different states.",
    fields: [
      { key: "intercityBaseFee", label: "Intercity base fee", suffix: "₦" },
      { key: "intercityPerKm", label: "Intercity per-km fee", suffix: "₦/km" },
    ],
  },
  {
    title: "Special charges",
    description: "Handling and multi-item fees.",
    fields: [
      { key: "fragileFee", label: "Fragile handling fee", suffix: "₦" },
      { key: "bulkFeePerExtraItem", label: "Fee per extra item", suffix: "₦" },
      { key: "riderSharePct", label: "Rider share of fee", suffix: "%" },
    ],
  },
];

export default function AdminPricingPage() {
  const pricing = useStore((s) => s.pricing);
  const update = useStore((s) => s.updatePricing);
  const [resetOpen, setResetOpen] = React.useState(false);
  const { register, handleSubmit, reset, watch, formState } = useForm<PricingConfig>({ resolver: zodResolver(schema), defaultValues: pricing });
  const { errors, isSubmitting, isDirty } = formState;
  const draft = watch();

  const [sim, setSim] = React.useState({ km: 12, weight: 3, qty: 1, fragile: false, intercity: false });
  const safeDraft = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, Number(v) || 0])) as unknown as PricingConfig;

  return (
    <>
      <PageHeader
        title="Pricing"
        description="Configure the simulated pricing engine used for every booking and estimate."
        actions={
          <Button variant="secondary" onClick={() => setResetOpen(true)}>
            <RotateCcw /> Restore defaults
          </Button>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <form
          noValidate
          onSubmit={handleSubmit(async (v) => {
            await sleep(500);
            update(v);
            reset(v);
            toast.success("Pricing updated. New bookings use these rates.");
          })}
          className="space-y-5"
        >
          {GROUPS.map((g) => (
            <Card key={g.title}>
              <CardHeader title={g.title} description={g.description} />
              <CardBody className="grid gap-4 sm:grid-cols-3">
                {g.fields.map((f) => (
                  <Field key={f.key} label={f.label} htmlFor={f.key} error={errors[f.key]?.message}>
                    <div className="relative">
                      <Input id={f.key} type="number" inputMode="decimal" step="any" {...register(f.key)} aria-invalid={!!errors[f.key]} className="pr-14 tabular" />
                      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-muted">{f.suffix}</span>
                    </div>
                  </Field>
                ))}
              </CardBody>
            </Card>
          ))}
          <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border border-line bg-white/95 p-3 shadow-raised backdrop-blur">
            <p className="text-sm text-muted">{isDirty ? "You have unsaved changes." : "All changes saved."}</p>
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              <Save /> Save pricing
            </Button>
          </div>
        </form>

        <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader title="Price simulator" description="Preview prices with the values on the left, before saving." action={<Calculator className="size-5 text-muted" />} />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Distance (km)">
                  <Input type="number" value={sim.km} onChange={(e) => setSim({ ...sim, km: Number(e.target.value) })} />
                </Field>
                <Field label="Weight (kg)">
                  <Input type="number" value={sim.weight} onChange={(e) => setSim({ ...sim, weight: Number(e.target.value) })} />
                </Field>
                <Field label="Items">
                  <Input type="number" min={1} value={sim.qty} onChange={(e) => setSim({ ...sim, qty: Math.max(1, Number(e.target.value)) })} />
                </Field>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <Switch checked={sim.fragile} onCheckedChange={(v) => setSim({ ...sim, fragile: v })} /> Fragile
                </label>
                <label className="flex items-center gap-2">
                  <Switch checked={sim.intercity} onCheckedChange={(v) => setSim({ ...sim, intercity: v })} /> Intercity
                </label>
              </div>
              <dl className="divide-y divide-line rounded-lg border border-line px-4">
                {(Object.keys(DELIVERY_TYPES) as DeliveryType[]).map((t) => {
                  const next = calculatePrice({ distanceKm: sim.km, intercity: sim.intercity, weightKg: sim.weight, quantity: sim.qty, fragile: sim.fragile, deliveryType: t }, safeDraft);
                  const current = calculatePrice({ distanceKm: sim.km, intercity: sim.intercity, weightKg: sim.weight, quantity: sim.qty, fragile: sim.fragile, deliveryType: t }, pricing);
                  const diff = next.total - current.total;
                  return (
                    <DetailRow key={t} label={DELIVERY_TYPES[t].label}>
                      <span className="text-base font-extrabold text-navy tabular">{formatNaira(next.total)}</span>
                      {diff !== 0 && <span className={diff > 0 ? "ml-2 text-xs text-danger" : "ml-2 text-xs text-emerald-deep"}>{diff > 0 ? "+" : "−"}{formatNaira(Math.abs(diff))}</span>}
                    </DetailRow>
                  );
                })}
              </dl>
              <p className="text-xs text-muted">Rider earns {safeDraft.riderSharePct}% of each fee. Differences compare against the currently saved rates.</p>
            </CardBody>
          </Card>
        </div>
      </div>
      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Restore default pricing?"
        description="All rates return to the SwiftLogix defaults."
        confirmLabel="Restore defaults"
        onConfirm={() => {
          update(DEFAULT_PRICING);
          reset(DEFAULT_PRICING);
          toast.success("Default pricing restored");
        }}
      />
    </>
  );
}
