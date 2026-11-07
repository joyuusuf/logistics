"use client";

import { useRouter } from "next/navigation";
import type { Shipment } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useShipments } from "@/hooks/use-shipments";
import { formatDate, formatDateTime, formatNaira } from "@/lib/utils";
import { PageHeader, ShipmentStatusBadge, StatCard, StatGrid } from "@/components/shared";
import { DataTable, type Column } from "@/components/tables/data-table";
import { CheckCircle2, Navigation, Wallet, XCircle } from "lucide-react";

export default function DeliveryHistoryPage() {
  const router = useRouter();
  const { rider } = useAuth();
  const mine = useShipments({ riderId: rider!.id });
  const history = mine.filter((s) => s.status === "delivered" || s.status === "cancelled");
  const delivered = history.filter((s) => s.status === "delivered");

  const columns: Column<Shipment>[] = [
    { key: "ref", header: "Reference", sortValue: (s) => s.reference, cell: (s) => <span className="font-semibold text-navy">{s.reference}</span> },
    { key: "route", header: "Route", cell: (s) => <span className="text-ink-soft">{s.sender.lga} → {s.recipient.lga}</span> },
    { key: "date", header: "Completed", sortValue: (s) => s.deliveredAt ?? s.createdAt, cell: (s) => <span className="text-ink-soft">{formatDateTime(s.deliveredAt ?? s.createdAt)}</span>, hideBelow: "md" },
    { key: "km", header: "Distance", align: "right", sortValue: (s) => s.distanceKm, cell: (s) => <span className="tabular">{s.distanceKm} km</span>, hideBelow: "lg" },
    { key: "earn", header: "Earned", align: "right", sortValue: (s) => (s.status === "delivered" ? s.riderEarning : 0), cell: (s) => <span className="font-semibold text-emerald-deep tabular">{s.status === "delivered" ? formatNaira(s.riderEarning) : "—"}</span> },
    { key: "status", header: "Status", cell: (s) => <ShipmentStatusBadge status={s.status} /> },
  ];

  return (
    <>
      <PageHeader title="Delivery history" description="Every delivery you've completed or that was cancelled." />
      <StatGrid>
        <StatCard label="Completed" value={delivered.length} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Cancelled" value={history.length - delivered.length} icon={XCircle} tone="danger" />
        <StatCard label="Distance covered" value={`${delivered.reduce((s, x) => s + x.distanceKm, 0).toLocaleString()} km`} icon={Navigation} />
        <StatCard label="Earned" value={formatNaira(delivered.reduce((s, x) => s + x.riderEarning, 0))} icon={Wallet} tone="amber" />
      </StatGrid>
      <div className="mt-5">
        <DataTable
          data={history}
          columns={columns}
          getRowId={(s) => s.id}
          searchPlaceholder="Search reference or area"
          searchFn={(s, q) => s.reference.toLowerCase().includes(q) || s.recipient.lga.toLowerCase().includes(q) || s.sender.lga.toLowerCase().includes(q)}
          filters={[
            { value: "all", label: "All" },
            { value: "delivered", label: "Delivered" },
            { value: "cancelled", label: "Cancelled" },
          ]}
          filterFn={(s, v) => s.status === v}
          defaultSort={{ key: "date", dir: "desc" }}
          onRowClick={(s) => router.push(`/rider/deliveries/${s.id}`)}
          emptyTitle="No completed deliveries yet"
          emptyDescription="Completed deliveries will be listed here."
          mobileCard={(s) => (
            <button type="button" onClick={() => router.push(`/rider/deliveries/${s.id}`)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-navy">{s.reference}</p>
                <p className="truncate text-xs text-muted">
                  {s.sender.lga} → {s.recipient.lga} · {formatDate(s.deliveredAt ?? s.createdAt)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-bold text-emerald-deep tabular">{s.status === "delivered" ? formatNaira(s.riderEarning) : "—"}</span>
                <ShipmentStatusBadge status={s.status} />
              </div>
            </button>
          )}
        />
      </div>
    </>
  );
}
