"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, Clock, CreditCard, Landmark, MoreHorizontal, RotateCcw, Undo2, Wallet, XCircle } from "lucide-react";
import type { Transaction } from "@/types";
import { useStore } from "@/lib/services/store";
import { PAYMENT_METHODS, TRANSACTION_STATUS } from "@/lib/constants";
import { formatDateTime, formatNaira } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/overlays";
import { PageHeader, StatCard, StatusBadge } from "@/components/shared";
import { DataTable, type Column } from "@/components/tables/data-table";
import { ConfirmDialog } from "@/components/dialogs";

export default function AdminPaymentsPage() {
  const transactions = useStore((s) => s.transactions);
  const shipments = useStore((s) => s.shipments);
  const users = useStore((s) => s.users);
  const pricing = useStore((s) => s.pricing);
  const refund = useStore((s) => s.refundTransaction);
  const retry = useStore((s) => s.retryPayment);
  const [refundTarget, setRefundTarget] = React.useState<Transaction | null>(null);

  const sum = (status: Transaction["status"]) => transactions.filter((t) => t.status === status).reduce((a, t) => a + t.amount, 0);
  const successful = sum("successful");
  const platformRevenue = shipments.filter((s) => s.status === "delivered").reduce((a, s) => a + (s.amount - s.riderEarning), 0);
  const shipmentOf = (t: Transaction) => shipments.find((s) => s.id === t.shipmentId);
  const customerOf = (t: Transaction) => users.find((u) => u.id === t.customerId);

  const columns: Column<Transaction>[] = [
    { key: "ref", header: "Reference", cell: (t) => <span className="font-mono text-xs text-ink">{t.reference}</span> },
    { key: "customer", header: "Customer", sortValue: (t) => customerOf(t)?.name ?? "", cell: (t) => <span className="text-ink">{customerOf(t)?.name ?? "-"}</span> },
    {
      key: "shipment",
      header: "Shipment",
      cell: (t) =>
        shipmentOf(t) ? (
          <Link href={`/admin/deliveries/${t.shipmentId}`} className="font-semibold text-navy hover:underline" onClick={(e) => e.stopPropagation()}>
            {shipmentOf(t)!.reference}
          </Link>
        ) : (
          "-"
        ),
      hideBelow: "lg",
    },
    { key: "method", header: "Method", cell: (t) => <span className="text-ink-soft">{PAYMENT_METHODS[t.method]}</span>, hideBelow: "xl" },
    { key: "date", header: "Date", sortValue: (t) => t.createdAt, cell: (t) => <span className="whitespace-nowrap text-ink-soft">{formatDateTime(t.createdAt)}</span>, hideBelow: "md" },
    { key: "amount", header: "Amount", align: "right", sortValue: (t) => t.amount, cell: (t) => <span className="font-semibold tabular">{formatNaira(t.amount)}</span> },
    { key: "status", header: "Status", sortValue: (t) => t.status, cell: (t) => <StatusBadge map={TRANSACTION_STATUS} value={t.status} /> },
  ];

  return (
    <>
      <PageHeader title="Payments" description="Customer payments, refunds and platform revenue." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total transactions" value={transactions.length} icon={CreditCard} />
        <StatCard label="Successful" value={formatNaira(successful)} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Pending" value={transactions.filter((t) => t.status === "pending").length} icon={Clock} tone="amber" />
        <StatCard label="Failed" value={transactions.filter((t) => t.status === "failed").length} icon={XCircle} tone="danger" />
        <StatCard label="Refunds" value={formatNaira(sum("refunded"))} icon={Undo2} tone="info" />
        <StatCard label="Platform revenue" value={formatNaira(platformRevenue)} icon={Wallet} tone="emerald" hint={`After ${pricing.riderSharePct}% rider share`} />
      </div>
      <div className="mt-5">
        <DataTable
          data={transactions}
          columns={columns}
          getRowId={(t) => t.id}
          pageSize={12}
          searchPlaceholder="Search reference or customer"
          searchFn={(t, q) => t.reference.toLowerCase().includes(q) || (customerOf(t)?.name.toLowerCase().includes(q) ?? false) || (shipmentOf(t)?.reference.toLowerCase().includes(q) ?? false)}
          filters={[{ value: "all", label: "All" }, ...Object.entries(TRANSACTION_STATUS).map(([value, s]) => ({ value, label: s.label }))]}
          filterFn={(t, v) => t.status === v}
          defaultSort={{ key: "date", dir: "desc" }}
          rowActions={(t) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${t.reference}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem disabled={t.status !== "successful"} onSelect={() => setRefundTarget(t)}>
                  <Undo2 /> Issue refund
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={t.status !== "pending" && t.status !== "failed"}
                  onSelect={() => {
                    const r = retry(t.id);
                    if (r.ok) toast.success("Payment marked successful");
                    else toast.error(r.error);
                  }}
                >
                  <RotateCcw /> Re-verify payment
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!shipmentOf(t)} onSelect={() => window.location.assign(`/admin/deliveries/${t.shipmentId}`)}>
                  <Landmark /> Open shipment
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          mobileCard={(t) => (
            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <p className="font-mono text-xs text-ink">{t.reference}</p>
                <p className="truncate text-xs text-muted">{customerOf(t)?.name}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-bold tabular">{formatNaira(t.amount)}</span>
                <StatusBadge map={TRANSACTION_STATUS} value={t.status} />
              </div>
            </div>
          )}
        />
      </div>
      <ConfirmDialog
        open={!!refundTarget}
        onOpenChange={(o) => !o && setRefundTarget(null)}
        title={`Refund ${refundTarget ? formatNaira(refundTarget.amount) : ""}?`}
        description="The customer is notified and the shipment payment status changes to refunded. Simulated, no money moves."
        confirmLabel="Issue refund"
        tone="danger"
        requireReason
        onConfirm={() => {
          if (!refundTarget) return;
          const r = refund(refundTarget.id);
          if (r.ok) toast.success("Refund issued");
          else toast.error(r.error);
        }}
      />
    </>
  );
}
