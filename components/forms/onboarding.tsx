"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stepper } from "./index";

/** Frame shared by the multi-step rider and partner onboarding flows. */
export function OnboardingFrame({
  title,
  description,
  steps,
  step,
  onBack,
  onNext,
  nextLabel = "Continue",
  busy,
  children,
}: {
  title: string;
  description: string;
  steps: string[];
  step: number;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  busy?: boolean;
  children: React.ReactNode;
}) {
  const topRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [step]);
  return (
    <div ref={topRef} className="scroll-mt-20">
      <Link href="/auth/register" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Account type
      </Link>
      <h1 className="mt-4 text-[28px] font-extrabold tracking-tight text-navy">{title}</h1>
      <p className="mt-1.5 text-sm text-muted">{description}</p>
      <div className="mt-6">
        <Stepper steps={steps} current={step} />
      </div>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onNext();
        }}
        className="mt-7"
      >
        <div className="space-y-4">{children}</div>
        <div className="mt-8 flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-between">
          <Button type="button" variant="secondary" size="lg" onClick={onBack} disabled={step === 0}>
            <ArrowLeft /> Back
          </Button>
          <Button type="submit" size="lg" loading={busy}>
            {nextLabel} {step < steps.length - 1 && <ArrowRight />}
          </Button>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already registered?{" "}
        <Link href="/auth/login" className="font-semibold text-emerald-deep hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export function ReviewList({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="divide-y divide-line rounded-xl border border-line">
      {items.map((i) => (
        <div key={i.label} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
          <dt className="text-muted">{i.label}</dt>
          <dd className="text-right font-semibold text-ink">{i.value || "-"}</dd>
        </div>
      ))}
    </dl>
  );
}
