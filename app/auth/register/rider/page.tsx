"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { email, nigerianPhone, password, plateNumber } from "@/lib/validations";
import { useStore } from "@/lib/services/store";
import { RIDER_DOCUMENT_TYPES, VEHICLE_CATEGORIES } from "@/lib/constants";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/primitives";
import { FileUpload, LgaInput, StateSelect, type UploadedFile } from "@/components/forms";
import { OnboardingFrame, ReviewList } from "@/components/forms/onboarding";
import { formatPhone, sleep } from "@/lib/utils";

const schema = z
  .object({
    name: z.string().trim().min(3, "Enter your full name"),
    email,
    phone: nigerianPhone,
    password,
    confirmPassword: z.string(),
    address: z.string().trim().min(8, "Enter your full residential address"),
    state: z.string().min(1, "Select your state of operation"),
    lga: z.string().trim().min(2, "Enter your local government area"),
    vehicleType: z.enum(["motorcycle", "tricycle", "car", "van", "pickup_truck", "truck"], { message: "Select a vehicle type" }),
    vehiclePlate: plateNumber,
    consent: z.boolean().refine((v) => v, "Please confirm to continue"),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

type Values = z.infer<typeof schema>;

const STEPS = ["Personal details", "Location", "Vehicle", "Documents", "Review"];
const STEP_FIELDS: FieldPath<Values>[][] = [["name", "email", "phone", "password", "confirmPassword"], ["address", "state", "lga"], ["vehicleType", "vehiclePlate"], [], ["consent"]];
const REQUIRED_DOCS = RIDER_DOCUMENT_TYPES.slice(0, 3);

export default function RiderRegisterPage() {
  const router = useRouter();
  const registerRider = useStore((s) => s.registerRider);
  const [step, setStep] = React.useState(0);
  const [photo, setPhoto] = React.useState<UploadedFile>();
  const [photoError, setPhotoError] = React.useState<string>();
  const [docs, setDocs] = React.useState<Record<string, UploadedFile | undefined>>({});
  const [docError, setDocError] = React.useState<string>();
  const [busy, setBusy] = React.useState(false);
  const { register, control, trigger, getValues, watch, setValue, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "", address: "", state: "", lga: "", vehicleType: "motorcycle", vehiclePlate: "", consent: false },
  });
  const { errors } = formState;
  const state = watch("state");

  const next = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (step === 0 && !photo) {
      setPhotoError("Upload a clear photo of your face");
      return;
    }
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
    const res = registerRider({
      name: v.name,
      email: v.email,
      phone: v.phone,
      password: v.password,
      address: v.address,
      state: v.state,
      lga: v.lga,
      vehicleType: v.vehicleType,
      vehiclePlate: v.vehiclePlate,
      avatarUrl: photo?.previewUrl,
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
      title="Apply to ride with SwiftLogix"
      description="Tell us about yourself and your vehicle. Verification usually takes 24 to 48 hours."
      steps={STEPS}
      step={step}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={next}
      nextLabel={step === STEPS.length - 1 ? "Submit application" : "Continue"}
      busy={busy}
    >
      {step === 0 && (
        <>
          <Field label="Profile picture" error={photoError}>
            <FileUpload
              label="Upload a clear photo of your face"
              accept="image/*"
              hint="JPG or PNG. Your face should be clearly visible."
              value={photo}
              onChange={(f) => {
                setPhoto(f);
                setPhotoError(undefined);
              }}
              invalid={!!photoError}
            />
          </Field>
          <Field label="Full name" htmlFor="name" error={errors.name?.message} hint="As it appears on your driver's licence">
            <Input id="name" autoComplete="name" {...register("name")} aria-invalid={!!errors.name} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} />
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
          <Field label="Residential address" htmlFor="address" error={errors.address?.message}>
            <Input id="address" autoComplete="street-address" {...register("address")} aria-invalid={!!errors.address} placeholder="House number, street, area" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="State of operation" htmlFor="state" error={errors.state?.message}>
              <Controller
                control={control}
                name="state"
                render={({ field }) => (
                  <StateSelect
                    id="state"
                    value={field.value}
                    onChange={(val) => {
                      field.onChange(val);
                      setValue("lga", "");
                    }}
                    invalid={!!errors.state}
                  />
                )}
              />
            </Field>
            <Field label="Local government area" htmlFor="lga" error={errors.lga?.message}>
              <Controller control={control} name="lga" render={({ field }) => <LgaInput id="lga" state={state} value={field.value} onChange={field.onChange} invalid={!!errors.lga} />} />
            </Field>
          </div>
        </>
      )}

      {step === 2 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Vehicle type" htmlFor="vehicleType" error={errors.vehicleType?.message}>
            <NativeSelect id="vehicleType" {...register("vehicleType")}>
              {Object.entries(VEHICLE_CATEGORIES).map(([k, c]) => (
                <option key={k} value={k}>
                  {c.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Vehicle registration number" htmlFor="vehiclePlate" error={errors.vehiclePlate?.message} hint="e.g. LND-123AA">
            <Input id="vehiclePlate" {...register("vehiclePlate")} aria-invalid={!!errors.vehiclePlate} className="uppercase" />
          </Field>
        </div>
      )}

      {step === 3 && (
        <>
          <p className="text-sm text-muted">Upload clear photos or PDFs. Documents marked optional can be added later from your verification page.</p>
          {docError && <p role="alert" className="rounded-lg bg-danger-tint px-3 py-2 text-sm font-medium text-danger">{docError}</p>}
          {RIDER_DOCUMENT_TYPES.map((type) => (
            <Field key={type} label={type} optional={!REQUIRED_DOCS.includes(type)}>
              <FileUpload
                label={`Upload ${type.toLowerCase()}`}
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
              { label: "Name", value: v.name },
              { label: "Email", value: v.email },
              { label: "Phone", value: formatPhone(v.phone) },
              { label: "Address", value: v.address },
              { label: "Operating in", value: `${v.lga}, ${v.state}` },
              { label: "Vehicle", value: `${VEHICLE_CATEGORIES[v.vehicleType].label} · ${v.vehiclePlate.toUpperCase()}` },
              { label: "Documents", value: `${Object.values(docs).filter(Boolean).length} of ${RIDER_DOCUMENT_TYPES.length} uploaded` },
            ]}
          />
          <Field error={errors.consent?.message}>
            <label className="flex items-start gap-2.5 text-sm text-ink-soft">
              <Controller control={control} name="consent" render={({ field }) => <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} className="mt-0.5" />} />
              I confirm these details are accurate and consent to a background and document check.
            </label>
          </Field>
        </>
      )}
    </OnboardingFrame>
  );
}
