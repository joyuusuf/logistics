"use client";

import { Clock3, ShieldAlert } from "lucide-react";
import type { Partner } from "@/types";

export function PartnerStatusBanner({ partner }: { partner: Partner }) {
  if (partner.verification === "approved" && partner.status === "active") return null;
  const suspended = partner.status === "suspended";
  const rejected = partner.verification === "rejected";
  const Icon = suspended || rejected ? ShieldAlert : Clock3;
  return (
    <div className={`mb-5 flex gap-3 rounded-xl border p-4 ${suspended || rejected ? "border-danger/30 bg-danger-tint" : "border-info/25 bg-info-tint"}`}>
      <Icon className="mt-0.5 size-5 shrink-0 text-navy" />
      <div>
        <p className="text-sm font-bold text-navy">{suspended ? "Your company account is suspended" : rejected ? "Your application was not approved" : "Your company is under review"}</p>
        <p className="text-[13px] text-ink-soft">
          {suspended
            ? "Contact partnerships@swiftlogix.ng to restore access to delivery requests."
            : rejected
              ? partner.rejectionReason ?? "Contact the partnerships team for details."
              : "You can set up your fleet and riders now. Incoming delivery requests unlock once SwiftLogix approves your documents."}
        </p>
      </div>
    </div>
  );
}

export const PLATFORM_FEE_PCT = 15;

/** Partner's share of a delivery: gross minus rider pay and the platform fee. */
export function partnerNet(amount: number, riderEarning: number) {
  return Math.max(0, amount - riderEarning - (amount * PLATFORM_FEE_PCT) / 100);
}
