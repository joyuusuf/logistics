"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { ServiceCategory } from "@/types";
import { email, nigerianPhone, password } from "@/lib/validations";
import { useStore } from "@/lib/services/store";
import { PARTNER_DOCUMENT_TYPES, SERVICE_CATEGORIES } from "@/lib/constants";
import { STATE_NAMES } from "@/lib/mock-data/nigeria";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/primitives";
import { ChoiceChip, FileUpload, StateSelect, type UploadedFile } from "@/components/forms";
import { OnboardingFrame, ReviewList } from "@/components/forms/onboarding";
import { formatPhone, sleep } from "@/lib/utils";

const schema = z
  .object({
    companyName: z.string().trim().min(3, "Enter the registered company name"),
    email,
    phone: nigerianPhone,
    password,
    confirmPassword: z.string(),
    address: z.string().trim().min(8, "Enter the full business address"),
    state: z.string().min(1, "Select the head office state"),
    cacNumber: z.string().trim().regex(/^(RC|BN|IT)\s?\d{5,8}$/i, "Use the CAC format, e.g. RC 1234567"),
    description: z.string().trim().min(30, "Tell us a bit more (at least 30 characters)"),
    operatingStates: z.array(z.string()).min(1, "Select at least one state"),
    services: z.array(z.string()).min(1, "Select at least one service"),
    fleetSize: z.coerce.number<number>({ message: "Enter a number" }).int("Whole numbers only").min(1, "Enter at least 1 vehicle").max(5000),
    motorcycles: z.coerce.number<number>().int().min(0).optional(),
    vans: z.coerce.number<number>().int().min(0).optional(),
    consent: z.boolean().refine((v) => v, "Please confirm to continue"),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

type Values = z.infer<typeof schema>;

const STEPS = ["Company account", "Business details", "Operations", "Documents", "Review"];
const STEP_FIELDS: FieldPath<Values>[][] = [["companyName", "email", "phone", "password", "confirmPassword"], ["address", "state", "cacNumber", "description"], ["operatingStates", "services", "fleetSize"], [], ["consent"]];
const REQUIRED_DOCS = PARTNER_DOCUMENT_TYPES.slice(0, 2);

export default function PartnerRegisterPage() {
  const router = useRouter();
  const registerPartner = useStore((s) => s.registerPartner);
  const [step, setStep] = React.useState(0);
  const [docs, setDocs] = React.useState<Record<string, UploadedFile | undefined>>({});
  const [docError, setDocError] = React.useState<string>();
  const [busy, setBusy] = React.useState(false);
  const { register, control, trigger, getValues, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { companyName: "", email: "", phone: "", password: "", confirmPassword: "", address: "", state: "", cacNumber: "", description: "", operatingStates: [], services: [], fleetSize: 1, consent: false },
  });
  const { errors } = formState;

  const next = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (!valid) return;
    if (step === 3) {
      const missing = REQUIRED_DOCS.filter((d) => !docs[d]);
      if (missing.length) {
        setDocError(`Upload: ${missing.join(", ")}`);
        return;
      }
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    await sleep(900);
    const v = getValues();
    const res = registerPartner({
      companyName: v.companyName,
      email: v.email,
      phone: v.phone,
      password: v.password,
      address: v.address,
      state: v.state,
      cacNumber: v.cacNumber,
      description: v.description,
      operatingStates: v.operatingStates,
      services: v.services as ServiceCategory[],
      fleetSize: v.fleetSize,
      documents: Object.entries(docs)
        .filter(([, f]) => !!f)
        .map(([type, f]) => ({ type, fileName: f!.fileName, previewUrl: f!.previewUrl })),
    });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      setStep(0);
      return;
    }
    toast.success("Application submitted");
    router.push("/auth/verify-email");
  };

  const v = getValues();

  return (
    <OnboardingFrame
      title="Register your logistics company"
      description="Join the SwiftLogix partner network and start receiving delivery requests in your coverage area."
      steps={STEPS}
      step={step}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={next}
      nextLabel={step === STEPS.length - 1 ? "Submit application" : "Continue"}
      busy={busy}
    >
      {step === 0 && (
        <>
          <Field label="Company name" htmlFor="companyName" error={errors.companyName?.message} hint="As registered with the Corporate Affairs Commission">
            <Input id="companyName" autoComplete="organization" {...register("companyName")} aria-invalid={!!errors.companyName} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} placeholder="ops@company.ng" />
            </Field>
            <Field label="Phone number" htmlFor="phone" error={errors.phone?.message}>
              <Input id="phone" type="tel" inputMode="tel" {...register("phone")} aria-invalid={!!errors.phone} placeholder="0803 123 4567" />
            </Field>
            <Field label="Password" htmlFor="password" error={errors.password?.message}>
              <Input id="password" type="password" autoComplete="new-password" {...register("password")} aria-invalid={!!errors.password} />
            </Field>
            <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
              <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} aria-invalid={!!errors.confirmPassword} />
            </Field>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <Field label="Business address" htmlFor="address" error={errors.address?.message}>
            <Input id="address" {...register("address")} aria-invalid={!!errors.address} placeholder="Office or depot address" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Head office state" htmlFor="state" error={errors.state?.message}>
              <Controller control={control} name="state" render={({ field }) => <StateSelect id="state" value={field.value} onChange={field.onChange} invalid={!!errors.state} />} />
            </Field>
            <Field label="CAC registration number" htmlFor="cacNumber" error={errors.cacNumber?.message} hint="RC, BN or IT number">
              <Input id="cacNumber" {...register("cacNumber")} aria-invalid={!!errors.cacNumber} className="uppercase" placeholder="RC 1234567" />
            </Field>
          </div>
          <Field label="Business description" htmlFor="description" error={errors.description?.message}>
            <Textarea id="description" rows={4} {...register("description")} aria-invalid={!!errors.description} placeholder="What you deliver, who your customers are and how long you've operated." />
          </Field>
        </>
      )}

      {step === 2 && (
        <>
          <Field label="Operating states" error={errors.operatingStates?.message}>
            <Controller
              control={control}
              name="operatingStates"
              render={({ field }) => (
                <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto rounded-lg border border-line p-3 scrollbar-thin">
                  {STATE_NAMES.map((s) => (
                    <ChoiceChip key={s} selected={field.value.includes(s)} onClick={() => field.onChange(field.value.includes(s) ? field.value.filter((x) => x !== s) : [...field.value, s])}>
                      {s}
                    </ChoiceChip>
                  ))}
                </div>
              )}
            />
          </Field>
          <Field label="Service categories" error={errors.services?.message}>
            <Controller
              control={control}
              name="services"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(SERVICE_CATEGORIES).map(([k, label]) => (
                    <ChoiceChip key={k} selected={field.value.includes(k)} onClick={() => field.onChange(field.value.includes(k) ? field.value.filter((x) => x !== k) : [...field.value, k])}>
                      {label}
                    </ChoiceChip>
                  ))}
                </div>
              )}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Total fleet size" htmlFor="fleetSize" error={errors.fleetSize?.message}>
              <Input id="fleetSize" type="number" min={1} inputMode="numeric" {...register("fleetSize")} aria-invalid={!!errors.fleetSize} />
            </Field>
            <Field label="Motorcycles" htmlFor="motorcycles" optional>
              <Input id="motorcycles" type="number" min={0} inputMode="numeric" {...register("motorcycles")} />
            </Field>
            <Field label="Vans and trucks" htmlFor="vans" optional>
              <Input id="vans" type="number" min={0} inputMode="numeric" {...register("vans")} />
            </Field>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <p className="text-sm text-muted">We use these to verify your company. Files stay in your browser in this demo.</p>
          {docError && <p role="alert" className="rounded-lg bg-danger-tint px-3 py-2 text-sm font-medium text-danger">{docError}</p>}
          {PARTNER_DOCUMENT_TYPES.map((type) => (
            <Field key={type} label={type} optional={!REQUIRED_DOCS.includes(type)}>
              <FileUpload
                label={`Upload ${type}`}
                value={docs[type]}
                onChange={(f) => {
                  setDocs((d) => ({ ...d, [type]: f }));
                  setDocError(undefined);
                }}
              />
            </Field>
          ))}
        </>
      )}

      {step === 4 && (
        <>
          <ReviewList
            items={[
              { label: "Company", value: v.companyName },
              { label: "Business email", value: v.email },
              { label: "Phone", value: formatPhone(v.phone) },
              { label: "Address", value: `${v.address}, ${v.state}` },
              { label: "CAC number", value: v.cacNumber.toUpperCase() },
              { label: "Operating states", value: v.operatingStates.join(", ") },
              { label: "Services", value: v.services.map((s) => SERVICE_CATEGORIES[s as ServiceCategory]).join(", ") },
              { label: "Fleet size", value: `${v.fleetSize} vehicles` },
              { label: "Documents", value: `${Object.values(docs).filter(Boolean).length} of ${PARTNER_DOCUMENT_TYPES.length} uploaded` },
            ]}
          />
          <Field error={errors.consent?.message}>
            <label className="flex items-start gap-2.5 text-sm text-ink-soft">
              <Controller control={control} name="consent" render={({ field }) => <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} className="mt-0.5" />} />
              I am authorised to register this company and the information provided is accurate.
            </label>
          </Field>
        </>
      )}
    </OnboardingFrame>
  );
}
