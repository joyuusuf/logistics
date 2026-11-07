"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, Bike, Building2, Eye, EyeOff, Package, ShieldCheck, type LucideIcon } from "lucide-react";
import type { Role } from "@/types";
import { loginSchema } from "@/lib/validations";
import { useStore } from "@/lib/services/store";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/mock-data/seed";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/primitives";
import { cn, sleep } from "@/lib/utils";

type Values = z.infer<typeof loginSchema>;

const ROLE_ICONS: Record<Role, LucideIcon> = { customer: Package, rider: Bike, partner: Building2, admin: ShieldCheck };

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const login = useStore((s) => s.login);
  const loginAs = useStore((s) => s.loginAs);
  const [show, setShow] = React.useState(false);
  const [formError, setFormError] = React.useState<string>();
  const [demoBusy, setDemoBusy] = React.useState<Role | null>(null);
  const { register, handleSubmit, setValue, formState } = useForm<Values>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "", remember: true } });
  const { errors, isSubmitting } = formState;

  const destination = (role: Role) => (next && next.startsWith(`/${role}`) ? next : `/${role}`);

  const onSubmit = async (values: Values) => {
    setFormError(undefined);
    await sleep(500);
    const res = login(values.email, values.password);
    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    toast.success(`Welcome back, ${res.data.name.split(" ")[0]}`);
    router.push(res.data.emailVerified ? destination(res.data.role) : "/auth/verify-email");
  };

  const demo = async (role: Role) => {
    setDemoBusy(role);
    setValue("email", DEMO_ACCOUNTS[role].email);
    setValue("password", DEMO_PASSWORD);
    await sleep(450);
    const res = loginAs(role);
    setDemoBusy(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Signed in as ${DEMO_ACCOUNTS[role].label.toLowerCase()}`);
    router.push(destination(role));
  };

  return (
    <div>
      <h1 className="text-[28px] font-extrabold tracking-tight text-navy">Welcome back</h1>
      <p className="mt-1.5 text-sm text-muted">Log in to manage your deliveries.</p>

      <div className="mt-7 rounded-xl border border-amber/40 bg-amber-tint/50 p-4">
        <p className="text-[13px] font-bold text-navy">Explore with a demo account</p>
        <p className="mt-0.5 text-xs text-ink-soft">One click signs you in. Every role shares the same demo data, so actions in one portal show up in the others.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(Object.keys(DEMO_ACCOUNTS) as Role[]).map((role) => {
            const Icon = ROLE_ICONS[role];
            return (
              <button
                key={role}
                type="button"
                onClick={() => demo(role)}
                disabled={!!demoBusy}
                className={cn("flex items-center gap-2.5 rounded-lg border border-line bg-white p-2.5 text-left transition-colors hover:border-navy/30 hover:shadow-card disabled:opacity-60", demoBusy === role && "border-emerald ring-2 ring-emerald/15")}
              >
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-navy text-white">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold text-ink">{DEMO_ACCOUNTS[role].label}</span>
                  <span className="block truncate text-[11px] text-muted">{DEMO_ACCOUNTS[role].description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs font-semibold text-muted">
        <span className="h-px flex-1 bg-line" /> or sign in with email <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && (
          <p role="alert" className="rounded-lg border border-danger/30 bg-danger-tint px-3 py-2.5 text-sm font-medium text-danger">
            {formError}
          </p>
        )}
        <Field label="Email address" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} placeholder="you@example.com" />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <div className="relative">
            <Input id="password" type={show ? "text" : "password"} autoComplete="current-password" {...register("password")} aria-invalid={!!errors.password} className="pr-10" />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted hover:text-ink" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <Checkbox defaultChecked onCheckedChange={(v) => setValue("remember", v === true)} /> Keep me signed in
          </label>
          <Link href="/auth/forgot-password" className="text-sm font-semibold text-emerald-deep hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Log in <ArrowRight />
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        New to SwiftLogix?{" "}
        <Link href="/auth/register" className="font-semibold text-emerald-deep hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-6 text-center text-[11px] text-muted">Demo authentication only. Sessions and data live in your browser&apos;s localStorage and are not secure.</p>
    </div>
  );
}
