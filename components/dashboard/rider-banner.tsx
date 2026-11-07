"use client";

import Link from "next/link";
import { AlertTriangle, Clock3, ShieldAlert } from "lucide-react";
import type { Rider } from "@/types";
import { Button } from "@/components/ui/button";


export function RiderVerificationBanner({ rider }: { rider: Rider }) {
  if (rider.verification === "approved" && rider.status === "active") return null;
  const map = {
    suspended: { icon: ShieldAlert, tone: "border-danger/30 bg-danger-tint", title: "Your account is suspended", body: "Contact support to resolve this before accepting new deliveries.", cta: null },
    not_submitted: { icon: AlertTriangle, tone: "border-amber/40 bg-amber-tint/60", title: "Upload your documents to start earning", body: "We need your driver's licence, ID and vehicle papers before you can accept jobs.", cta: "Upload documents" },
    under_review: { icon: Clock3, tone: "border-info/25 bg-info-tint", title: "Your documents are under review", body: "Verification usually takes 24 to 48 hours. You'll be notified once approved.", cta: "View status" },
    rejected: { icon: ShieldAlert, tone: "border-danger/30 bg-danger-tint", title: "Verification was not successful", body: rider.rejectionReason ?? "Please re-upload the flagged documents.", cta: "Fix documents" },
    approved: { icon: Clock3, tone: "", title: "", body: "", cta: null },
  } as const;
  
  const key = rider.status === "suspended" ? "suspended" : rider.verification;
  const c = map[key];
  const Icon = c.icon;
  return (
    <div className={`mb-5 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${c.tone}`}>
      
      <div className="flex gap-3">

        <Icon className="mt-0.5 size-5 shrink-0 text-navy" />
        <div>
          <p className="text-sm font-bold text-navy">{c.title}</p>
          <p className="text-[13px] text-ink-soft">{c.body}</p>
        </div>

      </div>

      {c.cta && (
        <Button asChild size="sm" variant="navy">
          <Link href="/rider/verification">{c.cta}</Link>
        </Button>
      )}

    </div>
  );
}
