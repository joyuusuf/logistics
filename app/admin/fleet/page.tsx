"use client";

import * as React from "react";
import Link from "next/link";
import { CircleCheck, Gauge, Truck, Wrench } from "lucide-react";
import type { Vehicle } from "@/types";
import { useStore } from "@/lib/services/store";
import { VEHICLE_AVAILABILITY, VEHICLE_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/primitives";
import { PageHeader, StatCard, StatGrid, StatusBadge } from "@/components/shared";
import { BarsChart, CHART_COLORS } from "@/components/charts";
import { DataTable, type Column } from "@/components/tables/data-table";

export default function AdminFleetPage() {
  const vehicles = useStore((s) => s.vehicles);
  const partners = useStore((s) => s.partners);
  const riders = useStore((s) => s.riders);
  const inUse = vehicles.filter((v) => v.availability === "in_use" || riders.find((r) => r.id === v.assignedRiderId)?.availability === "busy").length;
  const usable = vehicles.filter((v) => v.availability !== "inactive").length;
  const byCategory = (Object.keys(VEHICLE_CATEGORIES) as (keyof typeof VEHICLE_CATEGORIES)[]).map((k) => ({ label: VEHICLE_CATEGORIES[k].label, count: vehicles.filter((v) => v.category === k).length }));

  const columns: Column<Vehicle>[] = [
    { key: "plate", header: "Vehicle", sortValue: (v) => v.plate, cell: (v) => <span><span className="font-semibold text-ink">{v.plate}</span><span className="block text-xs text-muted">{v.make} {v.model} · {v.year}</span></span> },
    { key: "cat", header: "Category", sortValue: (v) => v.category, cell: (v) => <span className="text-ink-soft">{VEHICLE_CATEGORIES[v.category].label}</span> },
    {
      key: "partner",
      header: "Partner",
      sortValue: (v) => partners.find((p) => p.id === v.partnerId)?.companyName ?? "",
      cell: (v) => (
        <Link href={`/admin/partners/${v.partnerId}`} className="text-ink-soft hover:text-navy hover:underline" onClick={(e) => e.stopPropagation()}>
          {partners.find((p) => p.id === v.partnerId)?.companyName ?? "-"}
        </Link>
      ),
      hideBelow: "md",
    },
    { key: "rider", header: "Rider", cell: (v) => <span className="text-ink-soft">{riders.find((r) => r.id === v.assignedRiderId)?.name ?? <span className="text-muted">Unassigned</span>}</span>, hideBelow: "lg" },
    { key: "status", header: "Availability", sortValue: (v) => v.availability, cell: (v) => <StatusBadge map={VEHICLE_AVAILABILITY} value={v.availability} /> },
    { key: "added", header: "Registered", sortValue: (v) => v.createdAt, cell: (v) => <span className="text-ink-soft">{formatDate(v.createdAt)}</span>, hideBelow: "xl" },
  ];

  return (
    <>
      <PageHeader title="Fleet" description="Every vehicle registered by logistics partners." />
      <StatGrid>
        <StatCard label="Vehicles" value={vehicles.length} icon={Truck} />
        <StatCard label="Available" value={vehicles.filter((v) => v.availability === "available").length} icon={CircleCheck} tone="emerald" />
        <StatCard label="Maintenance" value={vehicles.filter((v) => v.availability === "maintenance").length} icon={Wrench} tone="amber" />
        <StatCard label="Utilisation" value={`${usable ? Math.round((inUse / usable) * 100) : 0}%`} icon={Gauge} tone="info" />
      </StatGrid>
      <Card className="mt-5">
        <CardHeader title="Fleet mix" description="Vehicles by category" />
        <CardBody>
          <BarsChart data={byCategory} series={[{ key: "count", name: "Vehicles", color: CHART_COLORS.navy }]} height={220} />
        </CardBody>
      </Card>
      <div className="mt-5">
        <DataTable
          data={vehicles}
          columns={columns}
          getRowId={(v) => v.id}
          searchPlaceholder="Search plate, make or partner"
          searchFn={(v, q) => `${v.plate} ${v.make} ${v.model} ${partners.find((p) => p.id === v.partnerId)?.companyName ?? ""}`.toLowerCase().includes(q)}
          filters={[{ value: "all", label: "All" }, ...Object.entries(VEHICLE_AVAILABILITY).map(([value, a]) => ({ value, label: a.label }))]}
          filterFn={(v, f) => v.availability === f}
          defaultSort={{ key: "added", dir: "desc" }}
          mobileCard={(v) => (
            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <p className="font-semibold text-ink">{v.plate}</p>
                <p className="truncate text-xs text-muted">
                  {VEHICLE_CATEGORIES[v.category].label} · {partners.find((p) => p.id === v.partnerId)?.companyName}
                </p>
              </div>
              <StatusBadge map={VEHICLE_AVAILABILITY} value={v.availability} />
            </div>
          )}
        />
      </div>
    </>
  );
}
