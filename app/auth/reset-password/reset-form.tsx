"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { email, password } from "@/lib/validations";
import { useStore } from "@/lib/services/store";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { sleep } from "@/lib/utils";

const schema = z
  .object({ email, code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"), password, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords do not match" });
type Values = z.infer<typeof schema>;

export function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const reset = useStore((s) => s.resetPassword);
  const [error, setError] = React.useState<string>();
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: params.get("email") ?? "", code: "", password: "", confirm: "" } });
  const { errors, isSubmitting } = formState;

  const onSubmit = async (v: Values) => {
    setError(undefined);
    await sleep(600);
    const res = reset(v.email, v.code, v.password);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast.success("Password updated. Log in with your new password.");
    router.push("/auth/login");
  };

  return (
    <div>
      <Link href="/auth/forgot-password" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Request a new code
      </Link>
      <h1 className="mt-6 text-[28px] font-extrabold tracking-tight text-navy">Set a new password</h1>
      <p className="mt-1.5 text-sm text-muted">Enter the code from your email and choose a new password.</p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 space-y-4">
        {error && <p role="alert" className="rounded-lg border border-danger/30 bg-danger-tint px-3 py-2.5 text-sm font-medium text-danger">{error}</p>}
        <Field label="Email address" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" {...register("email")} aria-invalid={!!errors.email} />
        </Field>
        <Field label="Reset code" htmlFor="code" error={errors.code?.message}>
          <Input id="code" inputMode="numeric" maxLength={6} autoComplete="one-time-code" {...register("code")} aria-invalid={!!errors.code} className="font-mono tracking-[0.4em]" />
        </Field>
        <Field label="New password" htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="new-password" {...register("password")} aria-invalid={!!errors.password} />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm" error={errors.confirm?.message}>
          <Input id="confirm" type="password" autoComplete="new-password" {...register("confirm")} aria-invalid={!!errors.confirm} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Update password
        </Button>
      </form>
    </div>
  );
}
