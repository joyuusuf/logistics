"use client";

import * as React from "react";
import { format, startOfMonth, subMonths } from "date-fns";
import { Download } from "lucide-react";
import { useStore } from "@/lib/services/store";
import { monthlySeries, successRate } from "@/lib/services/selectors";
import { downloadTextFile, formatNaira, toCsv } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { Card, CardBody, CardHeader, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { PageHeader } from "@/components/shared";
import { BarsChart, CHART_COLORS, TrendChart } from "@/components/charts";

function ReportTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-line bg-surface/70">
            {headers.map((h, i) => (
              <th key={h} className={`px-4 py-2.5 text-xs font-semibold text-muted ${i > 0 ? "text-right" : "text-left"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className={`px-4 py-2.5 ${j > 0 ? "text-right tabular" : "font-semibold text-ink"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminReportsPage() {
  const shipments = useStore((s) => s.shipments);
  const users = useStore((s) => s.users);
  const riders = useStore((s) => s.riders);
  const partners = useStore((s) => s.partners);
  const [months, setMonths] = React.useState(6);
  const [tab, setTab] = React.useState("revenue");

  const monthly = React.useMemo(() => monthlySeries(shipments, months), [shipments, months]);
  const growth = React.useMemo(() => {
    const now = new Date();
    return Array.from({ length: months }, (_, i) => {
      const start = startOfMonth(subMonths(now, months - 1 - i));
      const end = startOfMonth(subMonths(now, months - 2 - i));
      const customers = users.filter((u) => u.role === "customer");
      return {
        label: format(start, "MMM"),
        newCustomers: customers.filter((u) => new Date(u.createdAt) >= start && (i === months - 1 || new Date(u.createdAt) < end)).length,
        total: customers.filter((u) => i === months - 1 || new Date(u.createdAt) < end).length,
      };
    });
  }, [users, months]);
  const riderPerf = React.useMemo(
    () =>
      riders
        .filter((r) => r.verification === "approved")
        .map((r) => {
          const mine = shipments.filter((s) => s.riderId === r.id);
          const done = mine.filter((s) => s.status === "delivered");
          return { name: r.name, state: r.state, delivered: done.length, rate: successRate(mine), earned: done.reduce((a, s) => a + s.riderEarning, 0), rating: r.rating };
        })
        .sort((a, b) => b.delivered - a.delivered),
    [riders, shipments],
  );
  const partnerPerf = React.useMemo(
    () =>
      partners
        .filter((p) => p.verification === "approved")
        .map((p) => {
          const mine = shipments.filter((s) => s.partnerId === p.id);
          const done = mine.filter((s) => s.status === "delivered");
          return { name: p.companyName, delivered: done.length, rate: successRate(mine), revenue: done.reduce((a, s) => a + s.amount, 0), riders: riders.filter((r) => r.partnerId === p.id).length };
        })
        .sort((a, b) => b.revenue - a.revenue),
    [partners, shipments, riders],
  );

  const exportCurrent = () => {
    const data: Record<string, Record<string, string | number>[]> = {
      revenue: monthly.map((m) => ({ Month: m.label, Revenue: m.revenue, Shipments: m.shipments })),
      deliveries: monthly.map((m) => ({ Month: m.label, Booked: m.shipments, Delivered: m.delivered, Cancelled: m.cancelled })),
      riders: riderPerf.map((r) => ({ Rider: r.name, State: r.state, Delivered: r.delivered, "Success rate %": r.rate, Earned: r.earned, Rating: r.rating })),
      customers: growth.map((g) => ({ Month: g.label, "New customers": g.newCustomers, "Total customers": g.total })),
      partners: partnerPerf.map((p) => ({ Partner: p.name, Delivered: p.delivered, "Success rate %": p.rate, Revenue: p.revenue, Riders: p.riders })),
    };
    downloadTextFile(`swiftlogix-${tab}-report.csv`, toCsv(data[tab]), "text/csv");
  };

  return (
    <>
      <PageHeader
        title="Reports"
        description="Revenue, delivery, rider, customer and partner performance."
        actions={
          <>
            <NativeSelect value={months} onChange={(e) => setMonths(Number(e.target.value))} className="h-10 w-40" aria-label="Period">
              <option value={3}>Last 3 months</option>
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
            </NativeSelect>
            <Button variant="secondary" onClick={exportCurrent}>
              <Download /> Export CSV
            </Button>
          </>
        }
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="riders">Rider performance</TabsTrigger>
          <TabsTrigger value="customers">Customer growth</TabsTrigger>
          <TabsTrigger value="partners">Partner performance</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-5">
          <Card>
            <CardHeader title="Revenue report" description={`${formatNaira(monthly.reduce((a, m) => a + m.revenue, 0))} paid delivery value over ${months} months`} />
            <CardBody>
              <TrendChart data={monthly} series={[{ key: "revenue", name: "Revenue", color: CHART_COLORS.emerald }]} kind="currency" height={280} />
            </CardBody>
          </Card>
          <Card>
            <ReportTable headers={["Month", "Shipments", "Revenue", "Avg. order"]} rows={monthly.map((m) => [m.label, m.shipments, formatNaira(m.revenue), formatNaira(m.shipments ? m.revenue / m.shipments : 0)])} />
          </Card>
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-5">
          <Card>
            <CardHeader title="Delivery report" description={`Success rate ${successRate(shipments)}% across all closed deliveries`} />
            <CardBody>
              <BarsChart
                data={monthly}
                series={[
                  { key: "delivered", name: "Delivered", color: CHART_COLORS.emerald },
                  { key: "cancelled", name: "Cancelled", color: CHART_COLORS.danger },
                ]}
                stacked
                height={280}
              />
            </CardBody>
          </Card>
          <Card>
            <ReportTable headers={["Month", "Booked", "Delivered", "Cancelled", "Success"]} rows={monthly.map((m) => [m.label, m.shipments, m.delivered, m.cancelled, `${m.delivered + m.cancelled ? Math.round((m.delivered / (m.delivered + m.cancelled)) * 100) : 0}%`])} />
          </Card>
        </TabsContent>

        <TabsContent value="riders" className="space-y-5">
          <Card>
            <CardHeader title="Top riders" description="By completed deliveries" />
            <CardBody>
              <BarsChart data={riderPerf.slice(0, 10).map((r) => ({ label: r.name, delivered: r.delivered }))} series={[{ key: "delivered", name: "Delivered", color: CHART_COLORS.navy }]} layout="vertical" height={360} />
            </CardBody>
          </Card>
          <Card>
            <ReportTable headers={["Rider", "State", "Delivered", "Success", "Earned", "Rating"]} rows={riderPerf.map((r) => [r.name, r.state, r.delivered, `${r.rate}%`, formatNaira(r.earned), r.rating.toFixed(1)])} />
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-5">
          <Card>
            <CardHeader title="Customer growth" description="New sign-ups and cumulative customers" />
            <CardBody>
              <TrendChart
                data={growth}
                series={[
                  { key: "total", name: "Total customers", color: CHART_COLORS.navy },
                  { key: "newCustomers", name: "New customers", color: CHART_COLORS.emerald },
                ]}
                height={280}
              />
            </CardBody>
          </Card>
          <Card>
            <ReportTable headers={["Month", "New customers", "Total customers"]} rows={growth.map((g) => [g.label, g.newCustomers, g.total])} />
          </Card>
        </TabsContent>

        <TabsContent value="partners" className="space-y-5">
          <Card>
            <CardHeader title="Partner revenue" description="Gross delivery value handled by each partner" />
            <CardBody>
              <BarsChart data={partnerPerf.map((p) => ({ label: p.name, revenue: p.revenue }))} series={[{ key: "revenue", name: "Revenue", color: CHART_COLORS.emerald }]} kind="currency" layout="vertical" height={Math.max(200, partnerPerf.length * 48)} />
            </CardBody>
          </Card>
          <Card>
            <ReportTable headers={["Partner", "Riders", "Delivered", "Success", "Revenue"]} rows={partnerPerf.map((p) => [p.name, p.riders, p.delivered, `${p.rate}%`, formatNaira(p.revenue)])} />
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
