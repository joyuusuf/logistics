"use client";

import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useShipments } from "@/hooks/use-shipments";
import { usePartnerFleet } from "@/hooks/use-partner-fleet";
import { dailySeries, monthlySeries, successRate } from "@/lib/services/selectors";
import { VEHICLE_AVAILABILITY } from "@/lib/constants";
import { Card, CardBody, CardHeader, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { PageHeader } from "@/components/shared";
import { BarsChart, CHART_COLORS, DonutChart, TrendChart } from "@/components/charts";

export default function PartnerAnalyticsPage() {
  const { partner } = useAuth();
  const shipments = useShipments({ partnerId: partner!.id });
  const { myRiders, myVehicles, utilisation } = usePartnerFleet(partner!.id);
  const monthly = React.useMemo(() => monthlySeries(shipments, 6).map((m) => ({ ...m, rate: m.delivered + m.cancelled ? Math.round((m.delivered / (m.delivered + m.cancelled)) * 100) : 0 })), [shipments]);
  const daily = React.useMemo(() => dailySeries(shipments, 21), [shipments]);
  const riderPerf = React.useMemo(
    () =>
      myRiders
        .map((r) => ({ label: r.name.split(" ")[0] + " " + (r.name.split(" ")[1]?.[0] ?? "") + ".", deliveries: shipments.filter((s) => s.riderId === r.id && s.status === "delivered").length }))
        .sort((a, b) => b.deliveries - a.deliveries)
        .slice(0, 8),
    [myRiders, shipments],
  );
  const fleetMix = (Object.keys(VEHICLE_AVAILABILITY) as (keyof typeof VEHICLE_AVAILABILITY)[]).map((k, i) => ({
    label: VEHICLE_AVAILABILITY[k].label,
    value: myVehicles.filter((v) => v.availability === k).length,
    color: [CHART_COLORS.emerald, CHART_COLORS.navy, CHART_COLORS.amber, "#A0AEC0"][i],
  }));

  return (
    <>
      <PageHeader title="Analytics" description="Revenue, volume, rider performance and fleet health." />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <Tabs defaultValue="monthly">
            <CardHeader
              title="Revenue trend"
              description="Gross delivery value"
              action={
                <TabsList>
                  <TabsTrigger value="monthly">6 months</TabsTrigger>
                  <TabsTrigger value="daily">21 days</TabsTrigger>
                </TabsList>
              }
            />
            <CardBody>
              <TabsContent value="monthly">
                <TrendChart data={monthly} series={[{ key: "revenue", name: "Revenue", color: CHART_COLORS.emerald }]} kind="currency" height={250} />
              </TabsContent>
              <TabsContent value="daily">
                <TrendChart data={daily} series={[{ key: "revenue", name: "Revenue", color: CHART_COLORS.emerald }]} kind="currency" height={250} />
              </TabsContent>
            </CardBody>
          </Tabs>
        </Card>
        <Card>
          <CardHeader title="Delivery volume" description="Delivered versus cancelled per month" />
          <CardBody>
            <BarsChart
              data={monthly}
              series={[
                { key: "delivered", name: "Delivered", color: CHART_COLORS.navy },
                { key: "cancelled", name: "Cancelled", color: CHART_COLORS.danger },
              ]}
              stacked
              height={250}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Rider performance" description="Completed deliveries per rider" />
          <CardBody>
            <BarsChart data={riderPerf} series={[{ key: "deliveries", name: "Deliveries", color: CHART_COLORS.emerald }]} layout="vertical" height={Math.max(200, riderPerf.length * 34)} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Fleet utilisation" description={`${utilisation}% of usable vehicles currently working`} />
          <CardBody>
            <DonutChart data={fleetMix} centerLabel="Vehicles" />
          </CardBody>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Delivery success rate" description={`Overall: ${successRate(shipments)}% of closed deliveries completed`} />
          <CardBody>
            <TrendChart data={monthly} series={[{ key: "rate", name: "Success rate", color: CHART_COLORS.navy }]} kind="percent" type="line" height={220} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
