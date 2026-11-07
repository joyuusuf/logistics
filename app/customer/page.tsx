"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, MapPin, Package, PackagePlus, Truck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useShipments } from "@/hooks/use-shipments";
import { useStore } from "@/lib/services/store";
import { isActive, monthlySeries, shipmentStats } from "@/lib/services/selectors";
import { TRANSACTION_STATUS } from "@/lib/constants";
import { formatDate, formatNaira, formatRelative } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/primitives";
import { EmptyState, FadeIn, PageHeader, ShipmentStatusBadge, StatCard, StatGrid, StatusBadge } from "@/components/shared";
import { BarsChart, CHART_COLORS } from "@/components/charts";
import { DeliveryProgress } from "@/components/tracking";

export default function CustomerOverview() {
  const { user } = useAuth();
  const shipments = useShipments({ customerId: user!.id });
  const transactions = useStore((s) => s.transactions);
  const stats = shipmentStats(shipments);
  const series = React.useMemo(() => monthlySeries(shipments, 6), [shipments]);
  const active = shipments.filter(isActive);
  const myTx = transactions.filter((t) => t.customerId === user!.id).slice(0, 5);
  const firstName = user!.name.split(" ")[0];

  return (
    <>
      <PageHeader
        title={`Good day, ${firstName}`}
        description="Here's what's happening with your deliveries."
        actions={
          <Button asChild>
            <Link href="/customer/book">
              <PackagePlus /> Book a delivery
            </Link>
          </Button>
        }
      />
      <FadeIn>
        <StatGrid>
          <StatCard label="Total shipments" value={stats.total} icon={Package} href="/customer/shipments" />
          <StatCard label="Active deliveries" value={stats.active} icon={Truck} tone="info" href="/customer/shipments" />
          <StatCard label="Completed" value={stats.delivered} icon={CheckCircle2} tone="emerald" />
          <StatCard label="Pending" value={stats.pending} icon={Clock} tone="amber" hint="Awaiting a rider" />
        </StatGrid>
      </FadeIn>

      {active.length > 0 && (
        <FadeIn delay={0.05} className="mt-5">
          <Card className="overflow-hidden">
            <CardHeader title="On the move" description={`${active.length} ${active.length === 1 ? "delivery is" : "deliveries are"} in progress`} />
            <ul className="mt-3 divide-y divide-line">
              {active.slice(0, 3).map((s) => (
                <li key={s.id}>
                  <Link href={`/customer/shipments/${s.id}`} className="grid gap-3 px-5 py-4 hover:bg-surface/60 md:grid-cols-[1fr_1.3fr_auto] md:items-center">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy">{s.reference}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-muted">
                        <MapPin className="size-3" /> {s.sender.lga} → {s.recipient.lga}
                      </p>
                    </div>
                    <DeliveryProgress shipment={s} />
                    <ShipmentStatusBadge status={s.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </FadeIn>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader title="Monthly delivery activity" description="Shipments you booked over the last six months" />
          <CardBody>
            <BarsChart
              data={series}
              series={[
                { key: "delivered", name: "Delivered", color: CHART_COLORS.emerald },
                { key: "cancelled", name: "Cancelled", color: CHART_COLORS.danger },
              ]}
              stacked
              height={250}
            />
          </CardBody>
        </Card>
        <Card className="flex flex-col">
          <CardHeader
            title="Recent transactions"
            action={
              <Link href="/customer/payments" className="text-[13px] font-semibold text-emerald-deep hover:underline">
                View all
              </Link>
            }
          />
          <CardBody className="flex-1">
            {myTx.length === 0 ? (
              <EmptyState title="No payments yet" description="Payments for your deliveries will appear here." className="py-6" />
            ) : (
              <ul className="divide-y divide-line">
                {myTx.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-ink">{t.reference}</p>
                      <p className="text-xs text-muted">{formatRelative(t.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-ink tabular">{formatNaira(t.amount)}</p>
                      <StatusBadge map={TRANSACTION_STATUS} value={t.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader
          title="Recent shipments"
          action={
            <Link href="/customer/shipments" className="inline-flex items-center gap-1 text-[13px] font-semibold text-emerald-deep hover:underline">
              All shipments <ArrowRight className="size-3.5" />
            </Link>
          }
        />
        <CardBody className="pt-3">
          {shipments.length === 0 ? (
            <EmptyState
              icon={Package}
              title="You haven't booked a delivery yet"
              description="It takes about two minutes. We'll match you with a verified rider."
              action={
                <Button asChild>
                  <Link href="/customer/book">Book your first delivery</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {shipments.slice(0, 6).map((s) => (
                <li key={s.id}>
                  <Link href={`/customer/shipments/${s.id}`} className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-3 hover:bg-surface/70">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="hidden size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-navy sm:inline-flex">
                        <Package className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">
                          {s.reference} <span className="font-normal text-muted">to {s.recipient.name}</span>
                        </p>
                        <p className="truncate text-xs text-muted">
                          {s.recipient.lga}, {s.recipient.state} · {formatDate(s.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="hidden text-sm font-semibold text-ink tabular sm:inline">{formatNaira(s.amount)}</span>
                      <ShipmentStatusBadge status={s.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-xl bg-navy p-6 text-white sm:flex-row sm:items-center">
        <div>
          <p className="text-lg font-bold">Sending something today?</p>
          <p className="text-sm text-white/65">Same-day delivery is available until 3pm in Lagos, Abuja and Ibadan.</p>
        </div>
        <Button asChild variant="amber">
          <Link href="/customer/book">
            Book a delivery <ArrowRight />
          </Link>
        </Button>
      </div>
    </>
  );
}
