"use client";

import * as React from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import type { Shipment } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useShipments } from "@/hooks/use-shipments";
import { useStore } from "@/lib/services/store";
import { formatDate, formatNaira, downloadTextFile, toCsv } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader, ShipmentStatusBadge } from "@/components/shared";
import { DataTable, type Column } from "@/components/tables/data-table";
import { PLATFORM_FEE_PCT, partnerNet } from "@/components/dashboard/partner-banner";

export default function PartnerTransactionsPage() {
  const { partner } = useAuth();
  const shipments = useShipments({ partnerId: partner!.id });
  const riders = useStore((s) => s.riders);
  const rows = shipments.filter((s) => s.status === "delivered" || s.status === "cancelled");
  const riderName = (id?: string) => riders.find((r) => r.id === id)?.name ?? "-";

  const columns: Column<Shipment>[] = [
    {
      key: "ref",
      header: "Shipment",
      sortValue: (s) => s.reference,
      cell: (s) => (
        <Link href={`/partner/deliveries/${s.id}`} className="font-semibold text-navy hover:underline" onClick={(e) => e.stopPropagation()}>
          {s.reference}
        </Link>
      ),
    },
    { key: "date", header: "Date", sortValue: (s) => s.deliveredAt ?? s.createdAt, cell: (s) => <span className="text-ink-soft">{formatDate(s.deliveredAt ?? s.createdAt)}</span> },
    { key: "rider", header: "Rider", cell: (s) => <span className="text-ink-soft">{riderName(s.riderId)}</span>, hideBelow: "lg" },
    { key: "gross", header: "Gross", align: "right", sortValue: (s) => s.amount, cell: (s) => <span className="tabular">{formatNaira(s.amount)}</span> },
    { key: "fee", header: "Fees and rider pay", align: "right", cell: (s) => <span className="text-muted tabular">−{formatNaira(s.status === "delivered" ? s.riderEarning + (s.amount * PLATFORM_FEE_PCT) / 100 : 0)}</span>, hideBelow: "md" },
    { key: "net", header: "Net", align: "right", sortValue: (s) => (s.status === "delivered" ? partnerNet(s.amount, s.riderEarning) : 0), cell: (s) => <span className="font-bold text-emerald-deep tabular">{s.status === "delivered" ? formatNaira(partnerNet(s.amount, s.riderEarning)) : "—"}</span> },
    { key: "status", header: "Status", cell: (s) => <ShipmentStatusBadge status={s.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Per-delivery breakdown of what your company earned."
        actions={
          <Button
            variant="secondary"
            disabled={!rows.length}
            onClick={() =>
              downloadTextFile(
                "partner-transactions.csv",
                toCsv(rows.map((s) => ({ Reference: s.reference, Date: formatDate(s.deliveredAt ?? s.createdAt), Rider: riderName(s.riderId), Gross: s.amount, Net: s.status === "delivered" ? partnerNet(s.amount, s.riderEarning) : 0, Status: s.status }))),
                "text/csv",
              )
            }
          >
            <Download /> Export CSV
          </Button>
        }
      />
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(s) => s.id}
        searchPlaceholder="Search reference or rider"
        searchFn={(s, q) => s.reference.toLowerCase().includes(q) || riderName(s.riderId).toLowerCase().includes(q)}
        filters={[
          { value: "all", label: "All" },
          { value: "delivered", label: "Delivered" },
          { value: "cancelled", label: "Cancelled" },
        ]}
        filterFn={(s, v) => s.status === v}
        defaultSort={{ key: "date", dir: "desc" }}
        emptyTitle="No transactions yet"
        mobileCard={(s) => (
          <Link href={`/partner/deliveries/${s.id}`} className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div>
              <p className="text-sm font-semibold text-navy">{s.reference}</p>
              <p className="text-xs text-muted">{formatDate(s.deliveredAt ?? s.createdAt)}</p>
            </div>
            <span className="text-sm font-bold text-emerald-deep tabular">{s.status === "delivered" ? formatNaira(partnerNet(s.amount, s.riderEarning)) : "—"}</span>
          </Link>
        )}
      />
    </>
  );
}
