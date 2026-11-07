"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Building2, Clock3, Truck } from "lucide-react";
import type { Partner } from "@/types";
import { useStore } from "@/lib/services/store";
import { successRate } from "@/lib/services/selectors";
import { VERIFICATION_STATUS } from "@/lib/constants";
import { formatDate, formatNaira } from "@/lib/utils";
import { Badge } from "@/components/ui/primitives";
import { PageHeader, StatCard, StatGrid, StatusBadge } from "@/components/shared";
import { DataTable, type Column } from "@/components/tables/data-table";

export default function AdminPartnersPage() {
  const router = useRouter();
  const partners = useStore((s) => s.partners);
  const shipments = useStore((s) => s.shipments);
  const riders = useStore((s) => s.riders);
  const vehicles = useStore((s) => s.vehicles);

  const perf = React.useCallback(
    (id: string) => {
      const mine = shipments.filter((s) => s.partnerId === id);
      return { count: mine.filter((s) => s.status === "delivered").length, revenue: mine.filter((s) => s.status === "delivered").reduce((a, s) => a + s.amount, 0), rate: successRate(mine) };
    },
    [shipments],
  );

  const columns: Column<Partner>[] = [
    {
      key: "name",
      header: "Company",
      sortValue: (p) => p.companyName,
      cell: (p) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-navy text-white">
            <Building2 className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-ink">{p.companyName}</p>
            <p className="text-xs text-muted">{p.cacNumber}</p>
          </div>
        </div>
      ),
    },
    { key: "states", header: "Coverage", cell: (p) => <span className="text-ink-soft">{p.operatingStates.slice(0, 3).join(", ")}{p.operatingStates.length > 3 ? ` +${p.operatingStates.length - 3}` : ""}</span>, hideBelow: "lg" },
    { key: "fleet", header: "Riders / vehicles", cell: (p) => <span className="tabular text-ink-soft">{riders.filter((r) => r.partnerId === p.id).length} / {vehicles.filter((v) => v.partnerId === p.id).length}</span>, hideBelow: "md" },
    { key: "delivered", header: "Delivered", align: "right", sortValue: (p) => perf(p.id).count, cell: (p) => <span className="tabular">{perf(p.id).count}</span>, hideBelow: "md" },
    { key: "revenue", header: "Revenue", align: "right", sortValue: (p) => perf(p.id).revenue, cell: (p) => <span className="font-semibold tabular">{formatNaira(perf(p.id).revenue)}</span>, hideBelow: "lg" },
    { key: "verification", header: "Verification", cell: (p) => <StatusBadge map={VERIFICATION_STATUS} value={p.verification} /> },
    { key: "status", header: "Status", cell: (p) => (p.status === "active" ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Suspended</Badge>), hideBelow: "md" },
    { key: "joined", header: "Applied", sortValue: (p) => p.joinedAt, cell: (p) => <span className="text-ink-soft">{formatDate(p.joinedAt)}</span>, hideBelow: "xl" },
  ];

  return (
    <>
      <PageHeader title="Logistics partners" description="Review applications and monitor partner fleets." />
      <StatGrid>
        <StatCard label="Partners" value={partners.length} icon={Building2} />
        <StatCard label="Approved" value={partners.filter((p) => p.verification === "approved").length} icon={BadgeCheck} tone="emerald" />
        <StatCard label="Awaiting review" value={partners.filter((p) => p.verification === "under_review").length} icon={Clock3} tone="amber" />
        <StatCard label="Partner vehicles" value={vehicles.length} icon={Truck} tone="info" />
      </StatGrid>
      <div className="mt-5">
        <DataTable
          data={partners}
          columns={columns}
          getRowId={(p) => p.id}
          searchPlaceholder="Search company or CAC number"
          searchFn={(p, q) => `${p.companyName} ${p.cacNumber} ${p.operatingStates.join(" ")}`.toLowerCase().includes(q)}
          filters={[{ value: "all", label: "All" }, { value: "under_review", label: "Applications" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" }, { value: "suspended", label: "Suspended" }]}
          filterFn={(p, v) => (v === "suspended" ? p.status === "suspended" : p.verification === v)}
          defaultSort={{ key: "joined", dir: "desc" }}
          onRowClick={(p) => router.push(`/admin/partners/${p.id}`)}
          mobileCard={(p) => (
            <button type="button" onClick={() => router.push(`/admin/partners/${p.id}`)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left">
              <div className="min-w-0">
                <p className="font-semibold text-ink">{p.companyName}</p>
                <p className="truncate text-xs text-muted">
                  {p.operatingStates.join(", ")} · {perf(p.id).count} delivered
                </p>
              </div>
              <StatusBadge map={VERIFICATION_STATUS} value={p.verification} />
            </button>
          )}
        />
      </div>
    </>
  );
}
