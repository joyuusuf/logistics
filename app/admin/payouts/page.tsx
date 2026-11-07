"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Banknote, CheckCircle2, Clock3, Send, XCircle } from "lucide-react";
import type { Payout } from "@/types";
import { useStore } from "@/lib/services/store";
import { riderBalance } from "@/lib/services/selectors";
import { PAYOUT_STATUS } from "@/lib/constants";
import { formatDateTime, formatNaira, formatRelative, maskAccount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, Card, CardHeader } from "@/components/ui/primitives";
import { EmptyState, PageHeader, StatCard, StatGrid, StatusBadge } from "@/components/shared";
import { DataTable, type Column } from "@/components/tables/data-table";
import { ConfirmDialog } from "@/components/dialogs";

export default function AdminPayoutsPage() {
  const payouts = useStore((s) => s.payouts);
  const riders = useStore((s) => s.riders);
  const shipments = useStore((s) => s.shipments);
  const review = useStore((s) => s.reviewPayout);
  const [rejecting, setRejecting] = React.useState<Payout | null>(null);
  const riderOf = (id: string) => riders.find((r) => r.id === id);
  const queue = payouts.filter((p) => p.status === "pending" || p.status === "approved");

  const columns: Column<Payout>[] = [
    { key: "ref", header: "Reference", cell: (p) => <span className="font-mono text-xs">{p.reference}</span> },
    {
      key: "rider",
      header: "Rider",
      sortValue: (p) => riderOf(p.riderId)?.name ?? "",
      cell: (p) => (
        <Link href={`/admin/riders/${p.riderId}`} className="text-ink hover:underline" onClick={(e) => e.stopPropagation()}>
          {riderOf(p.riderId)?.name ?? "-"}
        </Link>
      ),
    },
    { key: "bank", header: "Bank", cell: (p) => <span className="text-ink-soft">{p.bankName} {maskAccount(p.accountNumber)}</span>, hideBelow: "lg" },
    { key: "date", header: "Requested", sortValue: (p) => p.requestedAt, cell: (p) => <span className="text-ink-soft">{formatDateTime(p.requestedAt)}</span>, hideBelow: "md" },
    { key: "amount", header: "Amount", align: "right", sortValue: (p) => p.amount, cell: (p) => <span className="font-semibold tabular">{formatNaira(p.amount)}</span> },
    { key: "status", header: "Status", sortValue: (p) => p.status, cell: (p) => <StatusBadge map={PAYOUT_STATUS} value={p.status} /> },
  ];

  return (
    <>
      <PageHeader title="Payouts" description="Review rider withdrawal requests and payout history." />
      <StatGrid>
        <StatCard label="Awaiting review" value={payouts.filter((p) => p.status === "pending").length} icon={Clock3} tone="amber" />
        <StatCard label="Approved, not sent" value={payouts.filter((p) => p.status === "approved").length} icon={Send} tone="info" />
        <StatCard label="Paid out" value={formatNaira(payouts.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0))} icon={Banknote} tone="emerald" />
        <StatCard label="Rejected" value={payouts.filter((p) => p.status === "rejected").length} icon={XCircle} tone="danger" />
      </StatGrid>

      <Card className="mt-5">
        <CardHeader title="Review queue" description="Check the rider's balance before approving" />
        {queue.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="No requests waiting" description="New payout requests will appear here." />
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {queue.map((p) => {
              const r = riderOf(p.riderId);
              const bal = r ? riderBalance(r.id, shipments, payouts) : null;
              return (
                <li key={p.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={r?.name ?? "Rider"} src={r?.avatarUrl} size={40} />
                    <div className="text-sm">
                      <p className="font-semibold text-ink">
                        {r?.name} · <span className="tabular">{formatNaira(p.amount)}</span>
                      </p>
                      <p className="text-xs text-muted">
                        {p.bankName} {maskAccount(p.accountNumber)} · {p.accountName} · {formatRelative(p.requestedAt)}
                      </p>
                      {bal && <p className="text-xs text-muted">Lifetime earnings {formatNaira(bal.totalEarnings)} · already paid {formatNaira(bal.paidOut)}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge map={PAYOUT_STATUS} value={p.status} />
                    {p.status === "pending" && (
                      <>
                        <Button size="sm" variant="danger-ghost" onClick={() => setRejecting(p)}>
                          <XCircle /> Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            review(p.id, "approved");
                            toast.success("Payout approved");
                          }}
                        >
                          <CheckCircle2 /> Approve
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      onClick={() => {
                        review(p.id, "paid");
                        toast.success(`${formatNaira(p.amount)} marked as paid (simulated)`);
                      }}
                    >
                      <Send /> {p.status === "pending" ? "Approve and pay" : "Mark as paid"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <h2 className="mt-7 mb-3 text-[15px] font-bold text-ink">Payout history</h2>
      <DataTable
        data={payouts}
        columns={columns}
        getRowId={(p) => p.id}
        searchPlaceholder="Search reference or rider"
        searchFn={(p, q) => p.reference.toLowerCase().includes(q) || (riderOf(p.riderId)?.name.toLowerCase().includes(q) ?? false)}
        filters={[{ value: "all", label: "All" }, ...Object.entries(PAYOUT_STATUS).map(([value, s]) => ({ value, label: s.label }))]}
        filterFn={(p, v) => p.status === v}
        defaultSort={{ key: "date", dir: "desc" }}
        mobileCard={(p) => (
          <div className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div>
              <p className="text-sm font-semibold text-ink">{riderOf(p.riderId)?.name}</p>
              <p className="font-mono text-xs text-muted">{p.reference}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm font-bold tabular">{formatNaira(p.amount)}</span>
              <StatusBadge map={PAYOUT_STATUS} value={p.status} />
            </div>
          </div>
        )}
      />
      <ConfirmDialog
        open={!!rejecting}
        onOpenChange={(o) => !o && setRejecting(null)}
        title="Reject payout?"
        description="The amount returns to the rider's available balance."
        confirmLabel="Reject payout"
        tone="danger"
        requireReason
        reasonLabel="Reason shown to the rider"
        onConfirm={(reason) => {
          if (rejecting) review(rejecting.id, "rejected", reason);
          toast.success("Payout rejected");
        }}
      />
    </>
  );
}
