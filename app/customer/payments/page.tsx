"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, CreditCard, Download, Printer, Receipt, RotateCcw, Wallet, XCircle } from "lucide-react";
import type { Transaction } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/lib/services/store";
import { PAYMENT_METHODS, TRANSACTION_STATUS } from "@/lib/constants";
import { receiptHtml } from "@/lib/services/receipt";
import { downloadTextFile, formatDate, formatDateTime, formatNaira } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, DetailRow } from "@/components/ui/primitives";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/overlays";
import { PageHeader, StatCard, StatGrid, StatusBadge } from "@/components/shared";
import { DataTable, type Column } from "@/components/tables/data-table";

export default function PaymentsPage() {
  const { user } = useAuth();
  const all = useStore((s) => s.transactions);
  const shipments = useStore((s) => s.shipments);
  const retry = useStore((s) => s.retryPayment);
  const tx = React.useMemo(() => all.filter((t) => t.customerId === user?.id), [all, user?.id]);
  const [receipt, setReceipt] = React.useState<Transaction | null>(null);

  const spent = tx.filter((t) => t.status === "successful").reduce((s, t) => s + t.amount, 0);
  const refunded = tx.filter((t) => t.status === "refunded").reduce((s, t) => s + t.amount, 0);
  const shipmentOf = (t: Transaction) => shipments.find((s) => s.id === t.shipmentId);

  const download = (t: Transaction) => {
    downloadTextFile(`SwiftLogix-receipt-${t.reference}.html`, receiptHtml(t, shipmentOf(t), user), "text/html");
    toast.success("Receipt downloaded");
  };
  const print = (t: Transaction) => {
    const w = window.open("", "_blank", "width=640,height=800");
    if (!w) {
      toast.error("Allow pop-ups to print the receipt");
      return;
    }
    w.document.write(receiptHtml(t, shipmentOf(t), user));
    w.document.close();
    w.focus();
    w.print();
  };

  const columns: Column<Transaction>[] = [
    { key: "ref", header: "Reference", cell: (t) => <span className="font-mono text-xs text-ink">{t.reference}</span> },
    {
      key: "shipment",
      header: "Shipment",
      cell: (t) => {
        const s = shipmentOf(t);
        return s ? (
          <Link href={`/customer/shipments/${s.id}`} className="font-semibold text-navy hover:underline" onClick={(e) => e.stopPropagation()}>
            {s.reference}
          </Link>
        ) : (
          "-"
        );
      },
    },
    { key: "date", header: "Date", sortValue: (t) => t.createdAt, cell: (t) => <span className="text-ink-soft">{formatDate(t.createdAt)}</span> },
    { key: "method", header: "Method", cell: (t) => <span className="text-ink-soft">{PAYMENT_METHODS[t.method]}</span>, hideBelow: "md" },
    { key: "amount", header: "Amount", align: "right", sortValue: (t) => t.amount, cell: (t) => <span className="font-semibold tabular">{formatNaira(t.amount)}</span> },
    { key: "status", header: "Status", cell: (t) => <StatusBadge map={TRANSACTION_STATUS} value={t.status} /> },
  ];

  return (
    <>
      <PageHeader title="Payments" description="Your transaction history and receipts." breadcrumbs={[{ label: "Overview", href: "/customer" }, { label: "Payments" }]} />
      <StatGrid>
        <StatCard label="Total spent" value={formatNaira(spent)} icon={Wallet} tone="emerald" />
        <StatCard label="Successful payments" value={tx.filter((t) => t.status === "successful").length} icon={CheckCircle2} />
        <StatCard label="Refunded" value={formatNaira(refunded)} icon={RotateCcw} tone="info" />
        <StatCard label="Failed attempts" value={tx.filter((t) => t.status === "failed").length} icon={XCircle} tone="danger" />
      </StatGrid>
      <div className="mt-5">
        <DataTable
          data={tx}
          columns={columns}
          getRowId={(t) => t.id}
          searchPlaceholder="Search by reference"
          searchFn={(t, q) => t.reference.toLowerCase().includes(q) || (shipmentOf(t)?.reference.toLowerCase().includes(q) ?? false)}
          filters={[{ value: "all", label: "All" }, ...Object.entries(TRANSACTION_STATUS).map(([value, s]) => ({ value, label: s.label }))]}
          filterFn={(t, v) => t.status === v}
          defaultSort={{ key: "date", dir: "desc" }}
          onRowClick={setReceipt}
          rowActions={(t) => (
            <Button variant="ghost" size="sm" onClick={() => setReceipt(t)}>
              <Receipt /> Receipt
            </Button>
          )}
          emptyTitle="No transactions yet"
          emptyDescription="Payments for your deliveries will appear here."
          mobileCard={(t) => (
            <button type="button" onClick={() => setReceipt(t)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left">
              <div className="min-w-0">
                <p className="font-mono text-xs text-ink">{t.reference}</p>
                <p className="text-xs text-muted">
                  {formatDate(t.createdAt)} · {PAYMENT_METHODS[t.method]}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-bold tabular">{formatNaira(t.amount)}</span>
                <StatusBadge map={TRANSACTION_STATUS} value={t.status} />
              </div>
            </button>
          )}
        />
      </div>
      <Dialog open={!!receipt} onOpenChange={(o) => !o && setReceipt(null)}>
        {receipt && (
          <DialogContent title="Payment receipt" description={receipt.reference} size="sm">
            <div className="rounded-lg bg-surface p-4 text-center">
              <CreditCard className="mx-auto size-6 text-navy" />
              <p className="mt-2 text-3xl font-extrabold text-navy tabular">{formatNaira(receipt.amount)}</p>
              <div className="mt-2">
                <StatusBadge map={TRANSACTION_STATUS} value={receipt.status} />
              </div>
            </div>
            <dl className="mt-4 divide-y divide-line">
              <DetailRow label="Date">{formatDateTime(receipt.createdAt)}</DetailRow>
              <DetailRow label="Method">{PAYMENT_METHODS[receipt.method]}</DetailRow>
              <DetailRow label="Shipment">{shipmentOf(receipt)?.reference ?? "-"}</DetailRow>
              {shipmentOf(receipt) && (
                <DetailRow label="Route">
                  {shipmentOf(receipt)!.sender.lga} → {shipmentOf(receipt)!.recipient.lga}
                </DetailRow>
              )}
            </dl>
            <DialogFooter>
              {(receipt.status === "failed" || receipt.status === "pending") && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    const res = retry(receipt.id);
                    if (res.ok) {
                      toast.success("Payment successful");
                      setReceipt(null);
                    } else toast.error(res.error);
                  }}
                >
                  <RotateCcw /> Retry payment
                </Button>
              )}
              <Button variant="secondary" onClick={() => print(receipt)}>
                <Printer /> Print
              </Button>
              <Button onClick={() => download(receipt)}>
                <Download /> Download receipt
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
