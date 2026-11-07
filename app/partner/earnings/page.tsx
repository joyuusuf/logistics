"use client";

import * as React from "react";
import { endOfWeek, format, startOfWeek, subWeeks } from "date-fns";
import { Building, Percent, Receipt, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useShipments } from "@/hooks/use-shipments";
import { monthlySeries } from "@/lib/services/selectors";
import { formatNaira } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/primitives";
import { PageHeader, StatCard, StatGrid, StatusBadge } from "@/components/shared";
import { BarsChart, CHART_COLORS } from "@/components/charts";
import { DataTable, type Column } from "@/components/tables/data-table";
import { PLATFORM_FEE_PCT, partnerNet } from "@/components/dashboard/partner-banner";

interface Settlement {
  id: string;
  period: string;
  deliveries: number;
  gross: number;
  net: number;
  status: "paid" | "processing" | "open";
}

export default function PartnerEarningsPage() {
  const { partner } = useAuth();
  const shipments = useShipments({ partnerId: partner!.id });
  const delivered = shipments.filter((s) => s.status === "delivered");
  const gross = delivered.reduce((s, x) => s + x.amount, 0);
  const riderPay = delivered.reduce((s, x) => s + x.riderEarning, 0);
  const fee = (gross * PLATFORM_FEE_PCT) / 100;
  const net = delivered.reduce((s, x) => s + partnerNet(x.amount, x.riderEarning), 0);

  const monthly = React.useMemo(
    () =>
      monthlySeries(delivered, 6).map((m) => ({
        ...m,
        net: Math.round(m.revenue * (1 - PLATFORM_FEE_PCT / 100) - m.revenue * 0.7),
      })),
    [delivered],
  );

  const settlements: Settlement[] = React.useMemo(() => {
    const now = new Date();
    return Array.from({ length: 10 }, (_, i) => {
      const start = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      const end = endOfWeek(start, { weekStartsOn: 1 });
      const inWeek = delivered.filter((s) => s.deliveredAt && new Date(s.deliveredAt) >= start && new Date(s.deliveredAt) <= end);
      return {
        id: start.toISOString(),
        period: `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`,
        deliveries: inWeek.length,
        gross: inWeek.reduce((s, x) => s + x.amount, 0),
        net: inWeek.reduce((s, x) => s + partnerNet(x.amount, x.riderEarning), 0),
        status: i === 0 ? "open" : i === 1 ? "processing" : "paid",
      } as Settlement;
    }).filter((s) => s.deliveries > 0 || s.status !== "paid");
  }, [delivered]);

  const columns: Column<Settlement>[] = [
    { key: "period", header: "Settlement period", cell: (s) => <span className="font-semibold text-ink">{s.period}</span> },
    { key: "deliveries", header: "Deliveries", align: "right", cell: (s) => <span className="tabular">{s.deliveries}</span> },
    { key: "gross", header: "Gross", align: "right", cell: (s) => <span className="tabular">{formatNaira(s.gross)}</span>, hideBelow: "md" },
    { key: "net", header: "Your earnings", align: "right", cell: (s) => <span className="font-bold text-emerald-deep tabular">{formatNaira(s.net)}</span> },
    {
      key: "status",
      header: "Status",
      cell: (s) => (
        <StatusBadge
          map={{ paid: { label: "Paid", tone: "success" }, processing: { label: "Processing", tone: "info" }, open: { label: "Current week", tone: "warning" } }}
          value={s.status}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Earnings" description="Weekly settlements for deliveries completed by your riders." />
      <StatGrid>
        <StatCard label="Gross delivery value" value={formatNaira(gross)} icon={Receipt} />
        <StatCard label="Rider payouts" value={formatNaira(riderPay)} icon={Wallet} tone="info" hint="70% of each delivery" />
        <StatCard label="Platform fee" value={formatNaira(fee)} icon={Percent} tone="amber" hint={`${PLATFORM_FEE_PCT}% commission`} />
        <StatCard label="Your earnings" value={formatNaira(net)} icon={Building} tone="emerald" />
      </StatGrid>
      <Card className="mt-5">
        <CardHeader title="Monthly earnings" description="Your share after rider pay and platform fee" />
        <CardBody>
          <BarsChart data={monthly} series={[{ key: "net", name: "Your earnings", color: CHART_COLORS.emerald }]} kind="currency" height={260} />
        </CardBody>
      </Card>
      <div className="mt-5">
        <DataTable data={settlements} columns={columns} getRowId={(s) => s.id} emptyTitle="No settlements yet" pageSize={8} />
      </div>
    </>
  );
}
