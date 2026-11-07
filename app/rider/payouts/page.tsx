"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Banknote, Landmark, Pencil, Plus, Wallet } from "lucide-react";
import type { Payout } from "@/types";
import { bankSchema } from "@/lib/validations";
import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/lib/services/store";
import { riderBalance } from "@/lib/services/selectors";
import { NIGERIAN_BANKS, PAYOUT_STATUS } from "@/lib/constants";
import { formatDate, formatDateTime, formatNaira, maskAccount, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect } from "@/components/ui/input";
import { Card, CardBody, CardHeader } from "@/components/ui/primitives";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/overlays";
import { EmptyState, PageHeader, StatusBadge } from "@/components/shared";
import { DataTable, type Column } from "@/components/tables/data-table";

type BankValues = z.infer<typeof bankSchema>;

function BankDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { rider } = useAuth();
  const update = useStore((s) => s.updateRiderBank);
  const { register, handleSubmit, reset, formState } = useForm<BankValues>({ resolver: zodResolver(bankSchema), defaultValues: rider!.bank ?? { bankName: "", accountNumber: "", accountName: rider!.name.toUpperCase() } });
  const { errors, isSubmitting } = formState;
  React.useEffect(() => {
    if (open) reset(rider!.bank ?? { bankName: "", accountNumber: "", accountName: rider!.name.toUpperCase() });
  }, [open, rider, reset]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={rider!.bank ? "Update bank account" : "Add bank account"} description="Payouts are sent to this account." size="sm">
        <form
          noValidate
          className="space-y-4"
          onSubmit={handleSubmit(async (v) => {
            await sleep(600);
            update(rider!.id, { ...v, accountName: v.accountName.toUpperCase() });
            toast.success("Bank account saved");
            onOpenChange(false);
          })}
        >
          <Field label="Bank" htmlFor="b-bank" error={errors.bankName?.message}>
            <NativeSelect id="b-bank" {...register("bankName")} aria-invalid={!!errors.bankName}>
              <option value="">Select bank</option>
              {NIGERIAN_BANKS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Account number" htmlFor="b-acct" error={errors.accountNumber?.message} hint="10-digit NUBAN">
            <Input id="b-acct" inputMode="numeric" maxLength={10} {...register("accountNumber")} aria-invalid={!!errors.accountNumber} className="tabular" />
          </Field>
          <Field label="Account name" htmlFor="b-name" error={errors.accountName?.message} hint="Must match your registered name">
            <Input id="b-name" {...register("accountName")} aria-invalid={!!errors.accountName} className="uppercase" />
          </Field>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Save account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RequestDialog({ open, onOpenChange, available }: { open: boolean; onOpenChange: (o: boolean) => void; available: number }) {
  const { rider } = useAuth();
  const request = useStore((s) => s.requestPayout);
  const [amount, setAmount] = React.useState("");
  const [error, setError] = React.useState<string>();
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => {
    if (open) {
      setAmount(String(Math.floor(available)));
      setError(undefined);
    }
  }, [open, available]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value < 1000) {
      setError("The minimum payout is ₦1,000.");
      return;
    }
    if (value > available) {
      setError(`You can withdraw up to ${formatNaira(available)}.`);
      return;
    }
    setBusy(true);
    await sleep(700);
    const res = request(rider!.id, value, available);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast.success(`Payout of ${formatNaira(value)} requested`);
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Request a payout" description={`Available: ${formatNaira(available)}`} size="sm">
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Amount (₦)" htmlFor="po-amount" error={error}>
            <Input id="po-amount" type="number" inputMode="numeric" min={1000} value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={!!error} className="h-12 text-lg font-bold tabular" />
          </Field>
          <div className="flex flex-wrap gap-2">
            {[5000, 10000, 20000].filter((v) => v <= available).map((v) => (
              <Button key={v} type="button" size="sm" variant="secondary" onClick={() => setAmount(String(v))}>
                {formatNaira(v)}
              </Button>
            ))}
            <Button type="button" size="sm" variant="secondary" onClick={() => setAmount(String(Math.floor(available)))}>
              Max
            </Button>
          </div>
          {rider!.bank && (
            <div className="flex items-center gap-3 rounded-lg bg-surface p-3 text-sm">
              <Landmark className="size-5 text-navy" />
              <span>
                To <span className="font-semibold">{rider!.bank.bankName}</span> {maskAccount(rider!.bank.accountNumber)}
              </span>
            </div>
          )}
          <p className="text-xs text-muted">Payouts are reviewed by SwiftLogix and usually arrive within 24 hours. This is a simulation; no money moves.</p>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              Request payout
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PayoutsPage() {
  const { rider } = useAuth();
  const shipments = useStore((s) => s.shipments);
  const allPayouts = useStore((s) => s.payouts);
  const payouts = React.useMemo(() => allPayouts.filter((p) => p.riderId === rider!.id), [allPayouts, rider]);
  const balance = riderBalance(rider!.id, shipments, allPayouts);
  const [bankOpen, setBankOpen] = React.useState(false);
  const [reqOpen, setReqOpen] = React.useState(false);

  const columns: Column<Payout>[] = [
    { key: "ref", header: "Reference", cell: (p) => <span className="font-mono text-xs">{p.reference}</span> },
    { key: "date", header: "Requested", sortValue: (p) => p.requestedAt, cell: (p) => <span className="text-ink-soft">{formatDateTime(p.requestedAt)}</span> },
    { key: "bank", header: "Bank", cell: (p) => <span className="text-ink-soft">{p.bankName} {maskAccount(p.accountNumber)}</span>, hideBelow: "lg" },
    { key: "amount", header: "Amount", align: "right", sortValue: (p) => p.amount, cell: (p) => <span className="font-semibold tabular">{formatNaira(p.amount)}</span> },
    { key: "status", header: "Status", cell: (p) => <StatusBadge map={PAYOUT_STATUS} value={p.status} /> },
  ];

  return (
    <>
      <PageHeader title="Payouts" description="Withdraw your earnings to your bank account." />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card className="overflow-hidden">
          <div className="bg-navy p-6 text-white">
            <p className="text-xs font-semibold tracking-wide text-white/60 uppercase">Available to withdraw</p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight tabular">{formatNaira(balance.available)}</p>
            <p className="mt-1 text-sm text-white/60">{formatNaira(balance.inFlight)} in payouts under review</p>
            <Button className="mt-5" size="lg" variant="amber" onClick={() => setReqOpen(true)} disabled={!rider!.bank || balance.available < 1000}>
              <Banknote /> Request payout
            </Button>
            {!rider!.bank && <p className="mt-2 text-xs text-white/60">Add a bank account to withdraw.</p>}
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Bank account"
            action={
              rider!.bank && (
                <Button variant="ghost" size="sm" onClick={() => setBankOpen(true)}>
                  <Pencil /> Edit
                </Button>
              )
            }
          />
          <CardBody>
            {rider!.bank ? (
              <div className="flex items-center gap-3">
                <span className="inline-flex size-12 items-center justify-center rounded-xl bg-surface text-navy">
                  <Landmark className="size-6" />
                </span>
                <div>
                  <p className="font-bold text-ink">{rider!.bank.bankName}</p>
                  <p className="font-mono text-sm text-ink-soft">{rider!.bank.accountNumber}</p>
                  <p className="text-xs text-muted">{rider!.bank.accountName}</p>
                </div>
              </div>
            ) : (
              <EmptyState icon={Wallet} title="No bank account" description="Add the account you'd like payouts sent to." action={<Button onClick={() => setBankOpen(true)}><Plus /> Add bank account</Button>} className="py-4" />
            )}
          </CardBody>
        </Card>
      </div>
      <div className="mt-5">
        <DataTable
          data={payouts}
          columns={columns}
          getRowId={(p) => p.id}
          filters={[{ value: "all", label: "All" }, ...Object.entries(PAYOUT_STATUS).map(([value, s]) => ({ value, label: s.label }))]}
          filterFn={(p, v) => p.status === v}
          defaultSort={{ key: "date", dir: "desc" }}
          emptyTitle="No payouts yet"
          emptyDescription="Your payout history will appear here."
          mobileCard={(p) => (
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-mono text-xs">{p.reference}</p>
                <p className="text-xs text-muted">{formatDate(p.requestedAt)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-bold tabular">{formatNaira(p.amount)}</span>
                <StatusBadge map={PAYOUT_STATUS} value={p.status} />
              </div>
            </div>
          )}
        />
      </div>
      <BankDialog open={bankOpen} onOpenChange={setBankOpen} />
      <RequestDialog open={reqOpen} onOpenChange={setReqOpen} available={balance.available} />
    </>
  );
}
