"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, FileText, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useHydrated } from "@/hooks/use-hydrated";
import { VERIFICATION_STATUS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/shared";
import { cn } from "@/lib/utils";

/** Account verification status after onboarding, for riders and logistics partners. */
export default function AccountVerificationPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const { user, rider, partner } = useAuth();

  React.useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/auth/login");
    else if (user.role === "customer" || user.role === "admin") router.replace(`/${user.role}`);
  }, [hydrated, user, router]);

  const profile = rider ?? partner;
  if (!hydrated || !user || !profile) return <Skeleton className="h-96 w-full rounded-xl" />;

  const status = profile.verification;
  const steps = [
    { label: "Account created", done: true },
    { label: "Email verified", done: user.emailVerified },
    { label: "Documents submitted", done: status !== "not_submitted" },
    { label: "Review by SwiftLogix", done: status === "approved", failed: status === "rejected" },
  ];
  const Icon = status === "approved" ? CheckCircle2 : status === "rejected" ? XCircle : Clock3;
  const home = `/${user.role}`;

  return (
    <div>
      <span className={cn("inline-flex size-12 items-center justify-center rounded-xl", status === "approved" ? "bg-emerald-tint text-emerald-deep" : status === "rejected" ? "bg-danger-tint text-danger" : "bg-amber-tint text-[#93630f]")}>
        <Icon className="size-6" />
      </span>
      <h1 className="mt-5 text-[28px] font-extrabold tracking-tight text-navy">
        {status === "approved" ? "You're verified" : status === "rejected" ? "Verification needs attention" : "Your application is under review"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {status === "approved"
          ? "Everything checks out. You can start working right away."
          : status === "rejected"
            ? profile.rejectionReason ?? "One or more documents could not be verified. Upload new copies to continue."
            : "Our team reviews documents within 24 to 48 hours. You can explore your dashboard while you wait. We'll notify you when you're approved."}
      </p>
      <ol className="mt-7 space-y-3 rounded-xl border border-line p-5">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-3 text-sm">
            {s.done ? <CheckCircle2 className="size-5 text-emerald" /> : s.failed ? <XCircle className="size-5 text-danger" /> : <span className="size-5 rounded-full border-2 border-line-strong" />}
            <span className={cn("font-medium", s.done ? "text-ink" : "text-muted")}>{s.label}</span>
          </li>
        ))}
      </ol>
      <div className="mt-5 rounded-xl border border-line">
        <p className="border-b border-line px-4 py-3 text-sm font-bold text-navy">Submitted documents</p>
        <ul className="divide-y divide-line">
          {profile.documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-ink">
                <FileText className="size-4 shrink-0 text-muted" />
                <span className="truncate">{d.type}</span>
              </span>
              <StatusBadge map={VERIFICATION_STATUS} value={d.status} />
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button asChild size="lg" className="flex-1">
          <Link href={home}>Go to dashboard</Link>
        </Button>
        {user.role === "rider" && status !== "approved" && (
          <Button asChild size="lg" variant="secondary" className="flex-1">
            <Link href="/rider/verification">Manage documents</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
