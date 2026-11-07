"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { customerRegisterSchema } from "@/lib/validations";
import { useStore } from "@/lib/services/store";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/primitives";
import { StateSelect } from "@/components/forms";
import { sleep } from "@/lib/utils";

type Values = z.infer<typeof customerRegisterSchema>;

export default function CustomerRegisterPage() {
  const router = useRouter();
  const registerCustomer = useStore((s) => s.registerCustomer);
  const [formError, setFormError] = React.useState<string>();
  const { register, handleSubmit, control, formState } = useForm<Values>({
    resolver: zodResolver(customerRegisterSchema),
    defaultValues: { name: "", email: "", phone: "", state: "", city: "", password: "", confirmPassword: "", terms: false },
  });
  const { errors, isSubmitting } = formState;

  const onSubmit = async (v: Values) => {
    setFormError(undefined);
    await sleep(700);
    const res = registerCustomer({ name: v.name, email: v.email, phone: v.phone, password: v.password, state: v.state, city: v.city });
    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    toast.success("Account created");
    router.push("/auth/verify-email");
  };

  return (
    <div>
      <Link href="/auth/register" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Account type
      </Link>
      <h1 className="mt-4 text-[28px] font-extrabold tracking-tight text-navy">Create a customer account</h1>
      <p className="mt-1.5 text-sm text-muted">Book your first delivery in minutes.</p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 space-y-4">
        {formError && <p role="alert" className="rounded-lg border border-danger/30 bg-danger-tint px-3 py-2.5 text-sm font-medium text-danger">{formError}</p>}
        <Field label="Full name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" {...register("name")} aria-invalid={!!errors.name} placeholder="e.g. Adaeze Okafor" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} />
          </Field>
          <Field label="Phone number" htmlFor="phone" error={errors.phone?.message}>
            <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" {...register("phone")} aria-invalid={!!errors.phone} placeholder="0803 123 4567" />
          </Field>
          <Field label="State" htmlFor="state" error={errors.state?.message}>
            <Controller control={control} name="state" render={({ field }) => <StateSelect id="state" value={field.value} onChange={field.onChange} invalid={!!errors.state} />} />
          </Field>
          <Field label="City" htmlFor="city" error={errors.city?.message}>
            <Input id="city" autoComplete="address-level2" {...register("city")} aria-invalid={!!errors.city} placeholder="e.g. Ikeja" />
          </Field>
          <Field label="Password" htmlFor="password" error={errors.password?.message} hint="At least 8 characters with a letter and a number">
            <Input id="password" type="password" autoComplete="new-password" {...register("password")} aria-invalid={!!errors.password} />
          </Field>
          <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
            <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} aria-invalid={!!errors.confirmPassword} />
          </Field>
        </div>
        <Field error={errors.terms?.message}>
          <label className="flex items-start gap-2.5 text-sm text-ink-soft">
            <Controller control={control} name="terms" render={({ field }) => <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} className="mt-0.5" />} />
            <span>
              I agree to the SwiftLogix <span className="font-semibold text-navy">Terms of Service</span> and <span className="font-semibold text-navy">Privacy Policy</span>.
            </span>
          </label>
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-emerald-deep hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
