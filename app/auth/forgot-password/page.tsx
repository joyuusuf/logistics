"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, MailCheck } from "lucide-react";
import { email } from "@/lib/validations";
import { useStore } from "@/lib/services/store";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { sleep } from "@/lib/utils";

const schema = z.object({ email });

export default function ForgotPasswordPage() {
  const request = useStore((s) => s.requestPasswordReset);
  const [sent, setSent] = React.useState<{ email: string; code: string } | null>(null);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: z.infer<typeof schema>) => {
    await sleep(700);
    const res = request(v.email);
    setSent({ email: v.email, code: res.ok ? res.data : "" });
  };

  return (
    <div>
      <Link href="/auth/login" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Back to login
      </Link>
      {sent ? (
        <div className="mt-6">
          <span className="inline-flex size-12 items-center justify-center rounded-xl bg-emerald-tint text-emerald-deep">
            <MailCheck className="size-6" />
          </span>
          <h1 className="mt-5 text-[28px] font-extrabold tracking-tight text-navy">Check your email</h1>
          <p className="mt-2 text-sm text-muted">
            If an account exists for <span className="font-semibold text-ink">{sent.email}</span>, we&apos;ve sent a 6-digit reset code. It expires in 15 minutes.
          </p>
          {sent.code && (
            <div className="mt-5 rounded-lg border border-amber/40 bg-amber-tint/60 p-4 text-sm">
              <p className="font-semibold text-navy">Demo inbox</p>
              <p className="mt-1 text-ink-soft">
                No real email is sent. Your reset code is <span className="font-mono text-base font-bold tracking-widest text-navy">{sent.code}</span>
              </p>
            </div>
          )}
          <Button asChild size="lg" className="mt-6 w-full">
            <Link href={`/auth/reset-password?email=${encodeURIComponent(sent.email)}`}>Enter reset code</Link>
          </Button>
          <button type="button" onClick={() => setSent(null)} className="mt-4 w-full text-center text-sm font-semibold text-muted hover:text-ink">
            Use a different email
          </button>
        </div>
      ) : (
        <>
          <h1 className="mt-6 text-[28px] font-extrabold tracking-tight text-navy">Forgot your password?</h1>
          <p className="mt-1.5 text-sm text-muted">Enter the email you signed up with and we&apos;ll send a reset code.</p>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 space-y-4">
            <Field label="Email address" htmlFor="email" error={formState.errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" {...register("email")} aria-invalid={!!formState.errors.email} />
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>
              Send reset code
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
