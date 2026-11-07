"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, Hourglass, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useShipments } from "@/hooks/use-shipments";
import { useStore } from "@/lib/services/store";
import { riderBalance, weeklyEarnings, weeklyTotals } from "@/lib/services/selectors";
import { PAYOUT_STATUS } from "@/lib/constants";
import { cn, formatDate, formatNaira } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { PageHeader, StatCard, StatGrid, StatusBadge } from "@/components/shared";
import { BarsChart, CHART_COLORS, TrendChart } from "@/components/charts";
import { DataTable, type Column } from "@/components/tables/data-table";

interface Entry {
  id: string;
  date: string;
  label: string;
  sub: string;
  amount: number;
  kind: "earning" | "payout";
  status?: keyof typeof PAYOUT_STATUS;
}

export default function EarningsPage() {
  const { rider } = useAuth();
  const mine = useShipments({ riderId: rider!.id });
  const all = useStore((s) => s.shipments);
  const payouts = useStore((s) => s.payouts);
  const balance = riderBalance(rider!.id, all, payouts);
  const week = React.useMemo(() => weeklyEarnings(mine), [mine]);
  const trend = React.useMemo(() => weeklyTotals(mine, 8), [mine]);
  const delivered = mine.filter((s) => s.status === "delivered");

  const entries: Entry[] = React.useMemo(
    () =>
      [
        ...delivered.map((s) => ({ id: s.id, date: s.deliveredAt ?? s.createdAt, label: `Delivery ${s.reference}`, sub: `${s.sender.lga} → ${s.recipient.lga}`, amount: s.riderEarning, kind: "earning" as const })),
        ...payouts.filter((p) => p.riderId === rider!.id).map((p) => ({ id: p.id, date: p.requestedAt, label: `Payout ${p.reference}`, sub: p.bankName, amount: -p.amount, kind: "payout" as const, status: p.status })),
      ].sort((a, b) => b.date.localeCompare(a.date)),
    [delivered, payouts, rider],
  );

  const columns: Column<Entry>[] = [
    {
      key: "label",
      header: "Transaction",
      cell: (e) => (
        <div className="flex items-center gap-3">
          <span className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-full", e.kind === "earning" ? "bg-emerald-tint text-emerald-deep" : "bg-navy/8 text-navy")}>
            {e.kind === "earning" ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-ink">{e.label}</p>
            <p className="text-xs text-muted">{e.sub}</p>
          </div>
        </div>
      ),
    },
    { key: "date", header: "Date", sortValue: (e) => e.date, cell: (e) => <span className="text-ink-soft">{formatDate(e.date)}</span>, hideBelow: "md" },
    { key: "status", header: "Status", cell: (e) => (e.status ? <StatusBadge map={PAYOUT_STATUS} value={e.status} /> : <StatusBadge map={{ done: { label: "Credited", tone: "success" } }} value="done" />), hideBelow: "md" },
    { key: "amount", header: "Amount", align: "right", sortValue: (e) => e.amount, cell: (e) => <span className={cn("font-bold tabular", e.amount > 0 ? "text-emerald-deep" : "text-ink")}>{e.amount > 0 ? "+" : "−"}{formatNaira(Math.abs(e.amount))}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Earnings"
        description="What you've earned and what's available to withdraw."
        actions={
          <Button asChild>
            <Link href="/rider/payouts">
              <Wallet /> Withdraw
            </Link>
          </Button>
        }
      />
      <StatGrid>
        <StatCard label="Total earnings" value={formatNaira(balance.totalEarnings)} icon={Wallet} tone="amber" />
        <StatCard label="Available balance" value={formatNaira(balance.available)} icon={CheckCircle2} tone="emerald" hint="Ready to withdraw" />
        <StatCard label="Pending earnings" value={formatNaira(balance.pendingEarnings + balance.inFlight)} icon={Hourglass} tone="info" hint="Active jobs and payouts in review" />
        <StatCard label="Completed deliveries" value={delivered.length} icon={Clock} />
      </StatGrid>

      <Card className="mt-5">
        <Tabs defaultValue="week">
          <CardHeader
            title="Earnings trend"
            description="Based on deliveries confirmed with PIN"
            action={
              <TabsList>
                <TabsTrigger value="week">This week</TabsTrigger>
                <TabsTrigger value="8w">8 weeks</TabsTrigger>
              </TabsList>
            }
          />
          <CardBody>
            <TabsContent value="week">
              <BarsChart data={week} series={[{ key: "earnings", name: "Earnings", color: CHART_COLORS.emerald }]} kind="currency" height={260} />
            </TabsContent>
            <TabsContent value="8w">
              <TrendChart data={trend} series={[{ key: "earnings", name: "Earnings", color: CHART_COLORS.navy }]} kind="currency" height={260} />
            </TabsContent>
          </CardBody>
        </Tabs>
      </Card>

      <div className="mt-5">
        <DataTable
          data={entries}
          columns={columns}
          getRowId={(e) => e.id}
          filters={[
            { value: "all", label: "All" },
            { value: "earning", label: "Earnings" },
            { value: "payout", label: "Payouts" },
          ]}
          filterFn={(e, v) => e.kind === v}
          defaultSort={{ key: "date", dir: "desc" }}
          emptyTitle="No transactions yet"
          mobileCard={(e) => (
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{e.label}</p>
                <p className="text-xs text-muted">{formatDate(e.date)}</p>
              </div>
              <span className={cn("text-sm font-bold tabular", e.amount > 0 ? "text-emerald-deep" : "text-ink")}>
                {e.amount > 0 ? "+" : "−"}
                {formatNaira(Math.abs(e.amount))}
              </span>
            </div>
          )}
        />
      </div>
    </>
  );
}
