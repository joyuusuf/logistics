"use client";

import * as React from "react";
import Link from "next/link";
import { Activity, ArrowRight, Bike, CheckCircle2, ClipboardList, Gauge, Package, Truck, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useShipments } from "@/hooks/use-shipments";
import { useStore } from "@/lib/services/store";
import { usePartnerFleet } from "@/hooks/use-partner-fleet";
import { isActive, monthlySeries, successRate } from "@/lib/services/selectors";
import { formatNaira, formatRelative } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, Progress } from "@/components/ui/primitives";
import { FadeIn, PageHeader, ShipmentStatusBadge, StatCard } from "@/components/shared";
import { CHART_COLORS, TrendChart } from "@/components/charts";
import { PartnerStatusBanner } from "@/components/dashboard/partner-banner";

export default function PartnerOverview() {
  const { partner } = useAuth();
  const shipments = useShipments({ partnerId: partner!.id });
  const all = useStore((s) => s.shipments);
  const logs = useStore((s) => s.auditLogs);
  const { myRiders, myVehicles, utilisation, inUse, usable } = usePartnerFleet(partner!.id);
  const delivered = shipments.filter((s) => s.status === "delivered");
  const active = shipments.filter(isActive);
  const revenue = delivered.reduce((s, x) => s + x.amount, 0);
  const pendingAssign = shipments.filter((s) => !s.riderId && s.status === "confirmed").length;
  const incoming = partner!.verification === "approved" ? all.filter((s) => s.status === "confirmed" && !s.riderId && !s.partnerId && partner!.operatingStates.includes(s.sender.state)).length : 0;
  const series = React.useMemo(() => monthlySeries(shipments, 6), [shipments]);

  const activity = React.useMemo(() => {
    const fromShipments = shipments.slice(0, 8).map((s) => ({ id: s.id, at: s.timeline[s.timeline.length - 1]?.at ?? s.createdAt, text: `${s.reference}: ${s.timeline[s.timeline.length - 1]?.label ?? "Created"}`, href: `/partner/deliveries/${s.id}`, status: s.status }));
    const fromLogs = logs.filter((l) => l.actorId === partner!.userId).slice(0, 5).map((l) => ({ id: l.id, at: l.at, text: `${l.action}: ${l.target}`, href: undefined, status: undefined }));
    return [...fromShipments, ...fromLogs].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
  }, [shipments, logs, partner]);

  return (
    <>
      <PageHeader
        title={partner!.companyName}
        description={`Operating in ${partner!.operatingStates.join(", ")}`}
        actions={
          <Button asChild>
            <Link href="/partner/assignments">
              <ClipboardList /> Assign deliveries
            </Link>
          </Button>
        }
      />
      <PartnerStatusBanner partner={partner!} />

      {(pendingAssign > 0 || incoming > 0) && (
        <FadeIn>
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            {incoming > 0 && (
              <Link href="/partner/deliveries?tab=incoming" className="flex items-center justify-between rounded-xl border border-emerald/40 bg-emerald-tint/50 p-4 hover:shadow-card">
                <span className="text-sm">
                  <span className="block font-bold text-navy">{incoming} incoming delivery requests</span>
                  <span className="text-muted">In your coverage area, waiting to be accepted</span>
                </span>
                <ArrowRight className="size-5 text-emerald-deep" />
              </Link>
            )}
            {pendingAssign > 0 && (
              <Link href="/partner/assignments" className="flex items-center justify-between rounded-xl border border-amber/40 bg-amber-tint/50 p-4 hover:shadow-card">
                <span className="text-sm">
                  <span className="block font-bold text-navy">{pendingAssign} accepted, awaiting a rider</span>
                  <span className="text-muted">Assign them to available riders</span>
                </span>
                <ArrowRight className="size-5 text-[#93630f]" />
              </Link>
            )}
          </div>
        </FadeIn>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total deliveries" value={shipments.length} icon={Package} href="/partner/deliveries" />
        <StatCard label="Active deliveries" value={active.length} icon={Activity} tone="info" />
        <StatCard label="Completed" value={delivered.length} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Total revenue" value={formatNaira(revenue)} icon={Wallet} tone="amber" href="/partner/earnings" hint="Gross delivery value" />
        <StatCard label="Riders" value={myRiders.length} icon={Bike} href="/partner/riders" hint={`${myRiders.filter((r) => r.availability === "online").length} online now`} />
        <StatCard label="Vehicles" value={myVehicles.length} icon={Truck} href="/partner/fleet" />
        <StatCard label="Fleet utilisation" value={`${utilisation}%`} icon={Gauge} tone="info" hint={`${inUse} of ${usable} working`} />
        <StatCard label="Success rate" value={`${successRate(shipments)}%`} icon={CheckCircle2} tone="emerald" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader title="Deliveries and revenue" description="Last six months" />
          <CardBody>
            <TrendChart
              data={series}
              series={[
                { key: "delivered", name: "Delivered", color: CHART_COLORS.emerald },
                { key: "shipments", name: "Total", color: CHART_COLORS.navy },
              ]}
              height={260}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Recent activity" />
          <CardBody className="pt-3">
            {activity.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No activity yet.</p>
            ) : (
              <ul className="space-y-3">
                {activity.map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald" />
                    <div className="min-w-0 flex-1">
                      {a.href ? (
                        <Link href={a.href} className="text-sm text-ink hover:underline">
                          {a.text}
                        </Link>
                      ) : (
                        <p className="text-sm text-ink">{a.text}</p>
                      )}
                      <p className="text-xs text-muted">{formatRelative(a.at)}</p>
                    </div>
                    {a.status && <ShipmentStatusBadge status={a.status} />}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader title="Rider status" description="Who is available right now" action={<Link href="/partner/riders" className="text-[13px] font-semibold text-emerald-deep hover:underline">Manage riders</Link>} />
        <CardBody className="grid gap-4 sm:grid-cols-3">
          {(["online", "busy", "offline"] as const).map((a) => {
            const n = myRiders.filter((r) => r.availability === a && r.status === "active").length;
            return (
              <div key={a}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="capitalize text-ink-soft">{a}</span>
                  <span className="font-bold tabular">{n}</span>
                </div>
                <Progress value={myRiders.length ? (n / myRiders.length) * 100 : 0} tone={a === "online" ? "emerald" : a === "busy" ? "amber" : "navy"} />
              </div>
            );
          })}
        </CardBody>
      </Card>
    </>
  );
}
