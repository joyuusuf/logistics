"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Bike, Briefcase, CheckCircle2, MapPin, Package, Wallet } from "lucide-react";
import { toast } from "sonner";
import type { RiderAvailability } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useShipments } from "@/hooks/use-shipments";
import { useStore } from "@/lib/services/store";
import { isActive, riderBalance, weeklyEarnings } from "@/lib/services/selectors";
import { RIDER_AVAILABILITY } from "@/lib/constants";
import { cn, formatNaira, formatRelative } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/primitives";
import { EmptyState, FadeIn, PageHeader, ShipmentStatusBadge, StatCard } from "@/components/shared";
import { BarsChart, CHART_COLORS } from "@/components/charts";
import { RiderActions, RiderStepper } from "@/components/dashboard/rider-workflow";
import { RiderVerificationBanner } from "@/components/dashboard/rider-banner";

export default function RiderOverview() {
  const { rider } = useAuth();
  const mine = useShipments({ riderId: rider!.id });
  const all = useStore((s) => s.shipments);
  const payouts = useStore((s) => s.payouts);
  const setAvailability = useStore((s) => s.setAvailability);
  const balance = riderBalance(rider!.id, all, payouts);
  const active = mine.filter(isActive);
  const delivered = mine.filter((s) => s.status === "delivered");
  const week = React.useMemo(() => weeklyEarnings(mine), [mine]);
  const weekTotal = week.reduce((s, d) => s + d.earnings, 0);
  const openJobs = all.filter((s) => s.status === "confirmed" && !s.riderId && s.sender.state === rider!.state && (!s.partnerId || s.partnerId === rider!.partnerId)).length;
  const verified = rider!.verification === "approved" && rider!.status === "active";
  const current = active[0];

  return (
    <>
      <PageHeader title={`Hello, ${rider!.name.split(" ")[0]}`} description="Your deliveries, earnings and availability at a glance." />
      <RiderVerificationBanner rider={rider!} />

      <FadeIn>
        <Card className="mb-5 overflow-hidden">
          <div className="flex flex-col gap-4 bg-navy p-5 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wide text-white/60 uppercase">Availability</p>
              <p className="mt-1 flex items-center gap-2 text-lg font-bold">
                <span className={cn("size-3 rounded-full", RIDER_AVAILABILITY[rider!.availability].dot)} />
                You are {RIDER_AVAILABILITY[rider!.availability].label.toLowerCase()}
              </p>
              <p className="text-[13px] text-white/60">{rider!.availability === "online" ? `${openJobs} open jobs in ${rider!.state} right now` : "Go online to receive new delivery requests."}</p>
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-white/10 p-1" role="radiogroup" aria-label="Availability">
              {(["online", "busy", "offline"] as RiderAvailability[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  role="radio"
                  aria-checked={rider!.availability === a}
                  disabled={!verified && a !== "offline"}
                  onClick={() => {
                    setAvailability(rider!.id, a);
                    toast.success(`You are now ${RIDER_AVAILABILITY[a].label.toLowerCase()}`);
                  }}
                  className={cn("h-11 rounded-lg px-4 text-sm font-semibold transition-colors disabled:opacity-40", rider!.availability === a ? "bg-white text-navy" : "text-white/75 hover:bg-white/10")}
                >
                  {RIDER_AVAILABILITY[a].label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </FadeIn>

      {current && (
        <FadeIn delay={0.04}>
          <Card className="mb-5 border-emerald/40">
            <CardHeader
              title="Current delivery"
              description={`${current.reference} · ${current.sender.lga} → ${current.recipient.lga}`}
              action={<ShipmentStatusBadge status={current.status} />}
            />
            <CardBody className="space-y-4">
              <RiderStepper shipment={current} compact />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex gap-2 text-sm">
                  <span className="mt-1 size-2.5 shrink-0 rounded-full border-2 border-navy" />
                  <span>
                    <span className="block text-xs text-muted">Pickup</span>
                    {current.sender.address}
                  </span>
                </div>
                <div className="flex gap-2 text-sm">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-emerald" />
                  <span>
                    <span className="block text-xs text-muted">Destination</span>
                    {current.recipient.address}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <RiderActions shipment={current} size="md" className="flex-1" />
                <Button asChild variant="secondary">
                  <Link href={`/rider/deliveries/${current.id}`}>Open delivery</Link>
                </Button>
              </div>
            </CardBody>
          </Card>
        </FadeIn>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatCard label="Total deliveries" value={mine.filter((s) => s.status !== "cancelled").length} icon={Package} />
        <StatCard label="Active" value={active.length} icon={Bike} tone="info" href="/rider/deliveries" />
        <StatCard label="Completed" value={delivered.length} icon={CheckCircle2} tone="emerald" href="/rider/history" />
        <StatCard label="Total earnings" value={formatNaira(balance.totalEarnings)} icon={Wallet} tone="amber" href="/rider/earnings" />
        <div className="col-span-2 lg:col-span-1">
          <StatCard label="Available balance" value={formatNaira(balance.available)} icon={Wallet} tone="emerald" href="/rider/payouts" hint="Ready to withdraw" />
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title="Weekly performance" description={`${formatNaira(weekTotal)} earned from ${week.reduce((s, d) => s + d.deliveries, 0)} deliveries this week`} />
          <CardBody>
            <BarsChart data={week} series={[{ key: "earnings", name: "Earnings", color: CHART_COLORS.emerald }]} kind="currency" height={240} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader
            title="Recent activity"
            action={
              <Link href="/rider/history" className="text-[13px] font-semibold text-emerald-deep hover:underline">
                History
              </Link>
            }
          />
          <CardBody>
            {mine.length === 0 ? (
              <EmptyState icon={Bike} title="No deliveries yet" description="Accepted jobs will appear here." className="py-6" />
            ) : (
              <ul className="space-y-3">
                {mine.slice(0, 6).map((s) => (
                  <li key={s.id}>
                    <Link href={`/rider/deliveries/${s.id}`} className="flex items-center justify-between gap-3 rounded-lg p-1 hover:bg-surface">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">{s.reference}</p>
                        <p className="truncate text-xs text-muted">
                          {s.recipient.lga} · {formatRelative(s.deliveredAt ?? s.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-sm font-bold tabular", s.status === "delivered" ? "text-emerald-deep" : "text-ink-soft")}>{s.status === "delivered" ? "+" : ""}{formatNaira(s.riderEarning)}</p>
                        <ShipmentStatusBadge status={s.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {verified && !current && (
        <div className="mt-5 flex flex-col items-start justify-between gap-3 rounded-xl border border-line bg-white p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-emerald-tint text-emerald-deep">
              <Briefcase className="size-5" />
            </span>
            <div>
              <p className="font-bold text-navy">{openJobs} jobs waiting near you</p>
              <p className="text-[13px] text-muted">Accept a job to start earning.</p>
            </div>
          </div>
          <Button asChild>
            <Link href="/rider/jobs">
              Browse jobs <ArrowRight />
            </Link>
          </Button>
        </div>
      )}
    </>
  );
}
