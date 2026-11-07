"use client";

import * as React from "react";
import Link from "next/link";
import { subDays } from "date-fns";
import { Activity, BadgeCheck, Bike, Building2, CheckCircle2, Package, Users, Wallet } from "lucide-react";
import { useStore } from "@/lib/services/store";
import { dailySeries, isActive, monthlySeries, pctChange, statusDistribution } from "@/lib/services/selectors";
import { TRANSACTION_STATUS } from "@/lib/constants";
import { formatNaira, formatRelative } from "@/lib/utils";
import { Card, CardBody, CardHeader, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { FadeIn, PageHeader, ShipmentStatusBadge, StatCard, StatusBadge } from "@/components/shared";
import { BarsChart, CHART_COLORS, DonutChart, TrendChart } from "@/components/charts";
import { ROLE_LABEL } from "@/components/navigation/config";

export default function AdminOverview() {
  const shipments = useStore((s) => s.shipments);
  const users = useStore((s) => s.users);
  const riders = useStore((s) => s.riders);
  const partners = useStore((s) => s.partners);
  const transactions = useStore((s) => s.transactions);
  const logs = useStore((s) => s.auditLogs);

  const revenue = transactions.filter((t) => t.status === "successful").reduce((s, t) => s + t.amount, 0);
  const now = new Date();
  const last30 = shipments.filter((s) => new Date(s.createdAt) > subDays(now, 30));
  const prev30 = shipments.filter((s) => new Date(s.createdAt) > subDays(now, 60) && new Date(s.createdAt) <= subDays(now, 30));
  const rev30 = last30.filter((s) => s.paymentStatus === "paid").reduce((a, s) => a + s.amount, 0);
  const revPrev = prev30.filter((s) => s.paymentStatus === "paid").reduce((a, s) => a + s.amount, 0);
  const customers = users.filter((u) => u.role === "customer");
  const pendingVerification = riders.filter((r) => r.verification === "under_review").length + partners.filter((p) => p.verification === "under_review").length;

  const monthly = React.useMemo(() => monthlySeries(shipments, 6), [shipments]);
  const daily = React.useMemo(() => dailySeries(shipments, 14), [shipments]);
  const dist = React.useMemo(() => statusDistribution(shipments), [shipments]);

  const registrations = React.useMemo(
    () =>
      [...users]
        .filter((u) => u.role !== "admin")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 6),
    [users],
  );

  const userHref = (id: string, role: string) => {
    if (role === "customer") return `/admin/customers/${id}`;
    if (role === "rider") return `/admin/riders/${riders.find((r) => r.userId === id)?.id ?? ""}`;
    return `/admin/partners/${partners.find((p) => p.userId === id)?.id ?? ""}`;
  };

  return (
    <>
      <PageHeader title="Platform overview" description="Everything happening across SwiftLogix right now." />
      <FadeIn>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard label="Total revenue" value={formatNaira(revenue)} icon={Wallet} tone="emerald" delta={pctChange(rev30, revPrev)} hint="vs previous 30 days" href="/admin/payments" />
          <StatCard label="Total shipments" value={shipments.length} icon={Package} delta={pctChange(last30.length, prev30.length)} hint="last 30 days" href="/admin/deliveries" />
          <StatCard label="Active deliveries" value={shipments.filter(isActive).length} icon={Activity} tone="info" href="/admin/deliveries" />
          <StatCard label="Completed deliveries" value={shipments.filter((s) => s.status === "delivered").length} icon={CheckCircle2} tone="emerald" />
          <StatCard label="Registered customers" value={customers.length} icon={Users} href="/admin/customers" />
          <StatCard label="Registered riders" value={riders.length} icon={Bike} href="/admin/riders" />
          <StatCard label="Logistics companies" value={partners.length} icon={Building2} href="/admin/partners" />
          <StatCard label="Pending verification" value={pendingVerification} icon={BadgeCheck} tone="amber" href="/admin/riders" hint="Riders and partners" />
        </div>
      </FadeIn>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <Card>
          <Tabs defaultValue="monthly">
            <CardHeader
              title="Revenue analytics"
              description="Paid delivery value"
              action={
                <TabsList>
                  <TabsTrigger value="monthly">6 months</TabsTrigger>
                  <TabsTrigger value="daily">14 days</TabsTrigger>
                </TabsList>
              }
            />
            <CardBody>
              <TabsContent value="monthly">
                <TrendChart data={monthly} series={[{ key: "revenue", name: "Revenue", color: CHART_COLORS.emerald }]} kind="currency" height={270} />
              </TabsContent>
              <TabsContent value="daily">
                <TrendChart data={daily} series={[{ key: "revenue", name: "Revenue", color: CHART_COLORS.emerald }]} kind="currency" height={270} />
              </TabsContent>
            </CardBody>
          </Tabs>
        </Card>
        <Card>
          <CardHeader title="Delivery status" description="All shipments" />
          <CardBody>
            <DonutChart data={dist.map((d) => ({ label: d.label, value: d.value, color: d.color }))} centerLabel="Shipments" />
          </CardBody>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader title="Delivery volume" description="Daily bookings, last 14 days" />
          <CardBody>
            <BarsChart
              data={daily}
              series={[
                { key: "delivered", name: "Delivered", color: CHART_COLORS.emerald },
                { key: "shipments", name: "Booked", color: CHART_COLORS.navy },
              ]}
              height={250}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Operational activity" action={<Link href="/admin/audit-logs" className="text-[13px] font-semibold text-emerald-deep hover:underline">Audit logs</Link>} />
          <CardBody className="pt-3">
            <ul className="space-y-3.5">
              {logs.slice(0, 7).map((l) => (
                <li key={l.id} className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-navy" />
                  <div className="min-w-0 text-sm">
                    <p className="text-ink">
                      <span className="font-semibold">{l.actorName}</span> {l.action.toLowerCase()} <span className="font-semibold">{l.target}</span>
                    </p>
                    <p className="text-xs text-muted">{formatRelative(l.at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader title="Recent deliveries" action={<Link href="/admin/deliveries" className="text-[13px] font-semibold text-emerald-deep hover:underline">View all</Link>} />
          <CardBody className="pt-3">
            <ul className="divide-y divide-line">
              {shipments.slice(0, 6).map((s) => (
                <li key={s.id}>
                  <Link href={`/admin/deliveries/${s.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-emerald-deep">
                    <span className="min-w-0 text-sm">
                      <span className="block font-semibold">{s.reference}</span>
                      <span className="block truncate text-xs text-muted">
                        {s.sender.lga} → {s.recipient.lga} · {formatRelative(s.createdAt)}
                      </span>
                    </span>
                    <ShipmentStatusBadge status={s.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Recent transactions" action={<Link href="/admin/payments" className="text-[13px] font-semibold text-emerald-deep hover:underline">View all</Link>} />
          <CardBody className="pt-3">
            <ul className="divide-y divide-line">
              {transactions.slice(0, 6).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block font-mono text-xs text-ink">{t.reference}</span>
                    <span className="block text-xs text-muted">{formatRelative(t.createdAt)}</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-sm font-bold tabular">{formatNaira(t.amount)}</span>
                    <StatusBadge map={TRANSACTION_STATUS} value={t.status} />
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Recent registrations" />
          <CardBody className="pt-3">
            <ul className="divide-y divide-line">
              {registrations.map((u) => (
                <li key={u.id}>
                  <Link href={userHref(u.id, u.role)} className="flex items-center justify-between gap-3 py-2.5 hover:text-emerald-deep">
                    <span className="min-w-0 text-sm">
                      <span className="block truncate font-semibold">{u.name}</span>
                      <span className="block text-xs text-muted">
                        {ROLE_LABEL[u.role]} · {u.state}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted">{formatRelative(u.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
