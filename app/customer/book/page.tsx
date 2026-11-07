"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, type FieldPath, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, BookMarked, CalendarClock, Clock, CreditCard, Landmark, Lock, Smartphone, Wallet, Zap, Truck } from "lucide-react";
import { addDays, format } from "date-fns";
import type { DeliveryType, Shipment } from "@/types";
import { contactPointSchema, packageSchema } from "@/lib/validations";
import { useStore } from "@/lib/services/store";
import { useAuth } from "@/hooks/use-auth";
import { calculatePrice } from "@/lib/calculations/pricing";
import { estimateDistanceKm } from "@/lib/calculations/distance";
import { DELIVERY_TYPES, PACKAGE_CATEGORIES, PAYMENT_METHODS } from "@/lib/constants";
import { cn, formatDateTime, formatNaira, formatPhone, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Card, CardBody, CardHeader, DetailRow, Switch } from "@/components/ui/primitives";
import { PageHeader } from "@/components/shared";
import { FileUpload, LgaInput, StateSelect, Stepper } from "@/components/forms";

const schema = z
  .object({
    sender: contactPointSchema,
    recipient: contactPointSchema,
    package: packageSchema,
    deliveryType: z.enum(["standard", "express", "same_day", "scheduled"]),
    scheduledFor: z.string().optional(),
    paymentMethod: z.enum(["card", "bank_transfer", "wallet", "ussd"]),
    saveRecipient: z.boolean(),
  })
  .superRefine((d, ctx) => {
    if (d.deliveryType === "scheduled") {
      if (!d.scheduledFor) ctx.addIssue({ code: "custom", path: ["scheduledFor"], message: "Choose a date and time" });
      else if (new Date(d.scheduledFor).getTime() < Date.now() + 2 * 3600 * 1000) ctx.addIssue({ code: "custom", path: ["scheduledFor"], message: "Pick a time at least 2 hours from now" });
    }
    if (d.sender.address.trim().toLowerCase() === d.recipient.address.trim().toLowerCase() && d.sender.address) {
      ctx.addIssue({ code: "custom", path: ["recipient", "address"], message: "Destination must be different from pickup" });
    }
  });

type Values = z.infer<typeof schema>;
const STEPS = ["Pickup", "Delivery", "Package", "Options", "Summary"];
const STEP_FIELDS: FieldPath<Values>[][] = [["sender"], ["recipient"], ["package"], ["deliveryType", "scheduledFor"], ["paymentMethod"]];

const TYPE_ICON: Record<DeliveryType, React.ComponentType<{ className?: string }>> = { standard: Truck, express: Zap, same_day: Clock, scheduled: CalendarClock };
const PAY_ICON = { card: CreditCard, bank_transfer: Landmark, wallet: Wallet, ussd: Smartphone } as const;

function ContactFields({ form, prefix }: { form: UseFormReturn<Values>; prefix: "sender" | "recipient" }) {
  const { register, control, watch, setValue, formState } = form;
  const errors = formState.errors[prefix];
  const state = watch(`${prefix}.state`);
  const who = prefix === "sender" ? "Sender" : "Recipient";
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={`${who} name`} htmlFor={`${prefix}-name`} error={errors?.name?.message}>
        <Input id={`${prefix}-name`} {...register(`${prefix}.name`)} aria-invalid={!!errors?.name} autoComplete="name" />
      </Field>
      <Field label="Phone number" htmlFor={`${prefix}-phone`} error={errors?.phone?.message}>
        <Input id={`${prefix}-phone`} type="tel" inputMode="tel" {...register(`${prefix}.phone`)} aria-invalid={!!errors?.phone} placeholder="0803 123 4567" />
      </Field>
      <Field label={prefix === "sender" ? "Pickup address" : "Destination address"} htmlFor={`${prefix}-address`} error={errors?.address?.message} className="sm:col-span-2">
        <Input id={`${prefix}-address`} {...register(`${prefix}.address`)} aria-invalid={!!errors?.address} placeholder="House number, street and area" autoComplete="street-address" />
      </Field>
      <Field label="State" htmlFor={`${prefix}-state`} error={errors?.state?.message}>
        <Controller
          control={control}
          name={`${prefix}.state`}
          render={({ field }) => (
            <StateSelect
              id={`${prefix}-state`}
              value={field.value}
              onChange={(v) => {
                field.onChange(v);
                setValue(`${prefix}.lga`, "");
              }}
              invalid={!!errors?.state}
            />
          )}
        />
      </Field>
      <Field label="LGA" htmlFor={`${prefix}-lga`} error={errors?.lga?.message}>
        <Controller control={control} name={`${prefix}.lga`} render={({ field }) => <LgaInput id={`${prefix}-lga`} state={state} value={field.value} onChange={field.onChange} invalid={!!errors?.lga} />} />
      </Field>
      <Field label="Landmark" htmlFor={`${prefix}-landmark`} optional className="sm:col-span-2">
        <Input id={`${prefix}-landmark`} {...register(`${prefix}.landmark`)} placeholder="e.g. Opposite First Bank, near the filling station" />
      </Field>
      <Field label={prefix === "sender" ? "Pickup instructions" : "Delivery instructions"} htmlFor={`${prefix}-instructions`} optional error={errors?.instructions?.message} className="sm:col-span-2">
        <Textarea id={`${prefix}-instructions`} rows={2} {...register(`${prefix}.instructions`)} placeholder={prefix === "sender" ? "e.g. Call when you reach the estate gate" : "e.g. Leave with the security man if not available"} />
      </Field>
    </div>
  );
}

export default function BookDeliveryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const allAddresses = useStore((s) => s.addresses);
  const addresses = React.useMemo(() => allAddresses.filter((a) => a.customerId === user?.id), [allAddresses, user?.id]);
  const pricing = useStore((s) => s.pricing);
  const createShipment = useStore((s) => s.createShipment);
  const saveAddress = useStore((s) => s.saveAddress);
  const [step, setStep] = React.useState(0);
  const [paying, setPaying] = React.useState(false);
  const defaultAddress = addresses.find((a) => a.isDefault);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      sender: {
        name: user?.name ?? "",
        phone: user?.phone ?? "",
        address: defaultAddress?.address ?? "",
        state: defaultAddress?.state ?? user?.state ?? "",
        lga: defaultAddress?.lga ?? "",
        landmark: defaultAddress?.landmark ?? "",
        instructions: "",
      },
      recipient: { name: "", phone: "", address: "", state: user?.state ?? "", lga: "", landmark: "", instructions: "" },
      package: { category: "documents", description: "", weightKg: 1, lengthCm: 30, widthCm: 20, heightCm: 10, quantity: 1, fragile: false },
      deliveryType: "standard",
      scheduledFor: "",
      paymentMethod: "card",
      saveRecipient: false,
    },
  });
  const { register, control, watch, trigger, setValue, getValues, formState } = form;
  const { errors } = formState;
  const v = watch();

  const dist = v.sender.state && v.sender.lga && v.recipient.state && v.recipient.lga ? estimateDistanceKm(v.sender, v.recipient) : null;
  const priceFor = (type: DeliveryType) =>
    dist ? calculatePrice({ distanceKm: dist.km, intercity: dist.intercity, weightKg: Number(v.package.weightKg) || 0, quantity: Number(v.package.quantity) || 1, fragile: v.package.fragile, deliveryType: type }, pricing) : null;
  const price = priceFor(v.deliveryType);

  const applySaved = (prefix: "sender" | "recipient", id: string) => {
    const a = addresses.find((x) => x.id === id);
    if (!a) return;
    setValue(`${prefix}.address`, a.address, { shouldValidate: true });
    setValue(`${prefix}.state`, a.state, { shouldValidate: true });
    setValue(`${prefix}.lga`, a.lga, { shouldValidate: true });
    setValue(`${prefix}.landmark`, a.landmark ?? "");
    if (prefix === "recipient") {
      setValue("recipient.name", a.name, { shouldValidate: true });
      setValue("recipient.phone", a.phone, { shouldValidate: true });
    }
    toast.success(`Using "${a.label}" address`);
  };

  const next = async () => {
    const ok = await trigger(STEP_FIELDS[step]);
    if (!ok) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const values = getValues();
    setPaying(true);
    await sleep(1300);
    const res = createShipment({
      customerId: user!.id,
      sender: values.sender,
      recipient: values.recipient,
      package: { ...values.package, weightKg: Number(values.package.weightKg), lengthCm: Number(values.package.lengthCm), widthCm: Number(values.package.widthCm), heightCm: Number(values.package.heightCm), quantity: Number(values.package.quantity) },
      deliveryType: values.deliveryType,
      scheduledFor: values.deliveryType === "scheduled" && values.scheduledFor ? new Date(values.scheduledFor).toISOString() : undefined,
      paymentMethod: values.paymentMethod,
    });
    if (values.saveRecipient) {
      saveAddress({ customerId: user!.id, label: values.recipient.name.split(" ")[0], name: values.recipient.name, phone: values.recipient.phone, address: values.recipient.address, state: values.recipient.state, lga: values.recipient.lga, landmark: values.recipient.landmark, isDefault: false });
    }
    setPaying(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    router.push(`/customer/book/confirmation?id=${(res.data as Shipment).id}`);
  };

  const minSchedule = format(addDays(new Date(), 0).getTime() + 3 * 3600 * 1000, "yyyy-MM-dd'T'HH:mm");

  return (
    <>
      <PageHeader title="Book a delivery" description="Five quick steps. You'll see the full price before you pay." breadcrumbs={[{ label: "Overview", href: "/customer" }, { label: "Book a delivery" }]} />
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card>
          <CardBody className="border-b border-line">
            <Stepper steps={STEPS} current={step} />
          </CardBody>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              next();
            }}
          >
            <CardBody className="space-y-5">
              {step === 0 && (
                <>
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-navy">Pickup information</h2>
                      <p className="text-sm text-muted">Where should the rider collect the package?</p>
                    </div>
                    {addresses.length > 0 && (
                      <NativeSelect className="h-9 w-56 text-[13px]" defaultValue="" onChange={(e) => applySaved("sender", e.target.value)} aria-label="Use a saved address">
                        <option value="">Use a saved address…</option>
                        {addresses.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.label}: {a.address}
                          </option>
                        ))}
                      </NativeSelect>
                    )}
                  </div>
                  <ContactFields form={form} prefix="sender" />
                </>
              )}
              {step === 1 && (
                <>
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-navy">Delivery information</h2>
                      <p className="text-sm text-muted">Who is receiving this package?</p>
                    </div>
                    {addresses.length > 0 && (
                      <NativeSelect className="h-9 w-56 text-[13px]" defaultValue="" onChange={(e) => applySaved("recipient", e.target.value)} aria-label="Use a saved address">
                        <option value="">Use a saved address…</option>
                        {addresses.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.label}: {a.address}
                          </option>
                        ))}
                      </NativeSelect>
                    )}
                  </div>
                  <ContactFields form={form} prefix="recipient" />
                  <label className="flex items-center gap-3 rounded-lg border border-line p-3 text-sm">
                    <Controller control={control} name="saveRecipient" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
                    <span>
                      <span className="flex items-center gap-1.5 font-semibold text-ink">
                        <BookMarked className="size-4 text-muted" /> Save this recipient to my addresses
                      </span>
                    </span>
                  </label>
                </>
              )}
              {step === 2 && (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-navy">Package information</h2>
                    <p className="text-sm text-muted">Accurate details help us send the right vehicle.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Package category" htmlFor="pkg-cat" error={errors.package?.category?.message}>
                      <NativeSelect id="pkg-cat" {...register("package.category")}>
                        {Object.entries(PACKAGE_CATEGORIES).map(([k, l]) => (
                          <option key={k} value={k}>
                            {l}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field label="Quantity" htmlFor="pkg-qty" error={errors.package?.quantity?.message}>
                      <Input id="pkg-qty" type="number" min={1} inputMode="numeric" {...register("package.quantity")} aria-invalid={!!errors.package?.quantity} />
                    </Field>
                    <Field label="Package description" htmlFor="pkg-desc" error={errors.package?.description?.message} className="sm:col-span-2">
                      <Input id="pkg-desc" {...register("package.description")} aria-invalid={!!errors.package?.description} placeholder="e.g. Two pairs of sneakers in shoe boxes" />
                    </Field>
                    <Field label="Weight per item (kg)" htmlFor="pkg-weight" error={errors.package?.weightKg?.message}>
                      <Input id="pkg-weight" type="number" min={0.1} step={0.1} inputMode="decimal" {...register("package.weightKg")} aria-invalid={!!errors.package?.weightKg} />
                    </Field>
                    <div>
                      <p className="mb-1.5 text-[13px] font-semibold text-ink">Dimensions (cm)</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(["lengthCm", "widthCm", "heightCm"] as const).map((d) => (
                          <Input key={d} type="number" min={1} inputMode="numeric" {...register(`package.${d}`)} aria-label={d.replace("Cm", "")} placeholder={d[0].toUpperCase()} aria-invalid={!!errors.package?.[d]} />
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-muted">Length × width × height</p>
                    </div>
                  </div>
                  <label className="flex items-center justify-between gap-4 rounded-lg border border-line p-4">
                    <span>
                      <span className="block text-sm font-semibold text-ink">Fragile package</span>
                      <span className="block text-[13px] text-muted">Extra padding and careful handling (+{formatNaira(pricing.fragileFee)})</span>
                    </span>
                    <Controller control={control} name="package.fragile" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
                  </label>
                  <Field label="Package photo" optional>
                    <Controller
                      control={control}
                      name="package.imageDataUrl"
                      render={({ field }) => (
                        <FileUpload
                          label="Upload a photo of the package"
                          accept="image/*"
                          hint="Helps the rider identify it at pickup"
                          value={field.value ? { fileName: "package-photo.jpg", previewUrl: field.value, size: Math.round(field.value.length * 0.75) } : undefined}
                          onChange={(f) => field.onChange(f?.previewUrl)}
                        />
                      )}
                    />
                  </Field>
                </>
              )}
              {step === 3 && (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-navy">Delivery options</h2>
                    <p className="text-sm text-muted">{dist ? `About ${dist.km} km${dist.intercity ? ", intercity" : ""}. Prices update as you choose.` : "Choose how fast you need it."}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Delivery option">
                    {(Object.keys(DELIVERY_TYPES) as DeliveryType[]).map((t) => {
                      const Icon = TYPE_ICON[t];
                      const p = priceFor(t);
                      const disabled = t === "same_day" && dist?.intercity;
                      return (
                        <button
                          key={t}
                          type="button"
                          role="radio"
                          aria-checked={v.deliveryType === t}
                          disabled={!!disabled}
                          onClick={() => setValue("deliveryType", t, { shouldValidate: true })}
                          className={cn(
                            "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                            v.deliveryType === t ? "border-emerald bg-emerald-tint/40 ring-2 ring-emerald/15" : "border-line hover:border-line-strong",
                          )}
                        >
                          <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-lg", v.deliveryType === t ? "bg-emerald text-white" : "bg-surface text-navy")}>
                            <Icon className="size-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="font-bold text-navy">{DELIVERY_TYPES[t].label}</span>
                              <span className="text-sm font-bold text-ink tabular">{p ? formatNaira(p.total) : "—"}</span>
                            </span>
                            <span className="block text-[13px] text-muted">{disabled ? "Not available for intercity routes" : DELIVERY_TYPES[t].description}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {v.deliveryType === "scheduled" && (
                    <Field label="Pickup date and time" htmlFor="scheduledFor" error={errors.scheduledFor?.message} className="max-w-xs">
                      <Input id="scheduledFor" type="datetime-local" min={minSchedule} {...register("scheduledFor")} aria-invalid={!!errors.scheduledFor} />
                    </Field>
                  )}
                </>
              )}
              {step === 4 && (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-navy">Booking summary</h2>
                    <p className="text-sm text-muted">Check everything, choose how to pay and confirm.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { title: "Pickup", c: v.sender, s: 0 },
                      { title: "Destination", c: v.recipient, s: 1 },
                    ].map((b) => (
                      <div key={b.title} className="rounded-lg border border-line p-4 text-sm">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold tracking-wide text-muted uppercase">{b.title}</p>
                          <button type="button" onClick={() => setStep(b.s)} className="text-xs font-semibold text-emerald-deep hover:underline">
                            Edit
                          </button>
                        </div>
                        <p className="mt-1 font-semibold text-ink">{b.c.name}</p>
                        <p className="text-muted">{formatPhone(b.c.phone)}</p>
                        <p className="mt-1 text-ink">{b.c.address}</p>
                        <p className="text-muted">
                          {b.c.lga}, {b.c.state}
                        </p>
                      </div>
                    ))}
                    <div className="rounded-lg border border-line p-4 text-sm sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Package and option</p>
                        <button type="button" onClick={() => setStep(2)} className="text-xs font-semibold text-emerald-deep hover:underline">
                          Edit
                        </button>
                      </div>
                      <p className="mt-1 font-semibold text-ink">
                        {v.package.description || PACKAGE_CATEGORIES[v.package.category]} · {v.package.quantity} × {v.package.weightKg} kg {v.package.fragile && "· Fragile"}
                      </p>
                      <p className="text-muted">
                        {DELIVERY_TYPES[v.deliveryType].label}
                        {v.deliveryType === "scheduled" && v.scheduledFor ? ` on ${formatDateTime(v.scheduledFor)}` : ` · ${DELIVERY_TYPES[v.deliveryType].description}`}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-[13px] font-semibold text-ink">Payment method</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {(Object.keys(PAYMENT_METHODS) as (keyof typeof PAYMENT_METHODS)[]).map((m) => {
                        const Icon = PAY_ICON[m];
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setValue("paymentMethod", m)}
                            aria-pressed={v.paymentMethod === m}
                            className={cn("flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-[13px] font-semibold", v.paymentMethod === m ? "border-emerald bg-emerald-tint/40 text-navy ring-2 ring-emerald/15" : "border-line text-ink-soft hover:border-line-strong")}
                          >
                            <Icon className="size-5" />
                            {PAYMENT_METHODS[m]}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                      <Lock className="size-3.5" /> Payment is simulated in this demo. No card details are collected.
                    </p>
                  </div>
                </>
              )}
            </CardBody>
            <div className="flex flex-col-reverse gap-2 border-t border-line p-5 sm:flex-row sm:justify-between">
              <Button type="button" variant="secondary" size="lg" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || paying}>
                <ArrowLeft /> Back
              </Button>
              <Button type="submit" size="lg" loading={paying}>
                {step === STEPS.length - 1 ? (paying ? "Processing payment…" : `Pay ${price ? formatNaira(price.total) : ""} and confirm`) : "Continue"}
                {step < STEPS.length - 1 && <ArrowRight />}
              </Button>
            </div>
          </form>
        </Card>

        <div className="xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader title="Estimated cost" description={dist ? `${dist.km} km · ${dist.intercity ? "Intercity" : "Within state"}` : "Add pickup and destination to see a price"} />
            <CardBody className="pt-3">
              <p className="text-3xl font-extrabold tracking-tight text-navy tabular">{price ? formatNaira(price.total) : "—"}</p>
              {price && (
                <dl className="mt-3 divide-y divide-line">
                  <DetailRow label="Base fee">{formatNaira(price.baseFee)}</DetailRow>
                  <DetailRow label="Distance">{formatNaira(price.distanceFee)}</DetailRow>
                  <DetailRow label="Weight">{formatNaira(price.weightFee)}</DetailRow>
                  <DetailRow label="Handling">{formatNaira(price.specialFee)}</DetailRow>
                  <DetailRow label={v.deliveryType === "scheduled" ? "Scheduled discount" : "Speed surcharge"}>{formatNaira(price.serviceSurcharge)}</DetailRow>
                </dl>
              )}
              <p className="mt-3 text-xs text-muted">Prices use a simulated distance between LGAs. You&apos;ll only be charged the amount shown at confirmation.</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
