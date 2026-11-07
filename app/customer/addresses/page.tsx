"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Home, MapPin, MoreHorizontal, Pencil, Plus, Star, Trash2 } from "lucide-react";
import type { SavedAddress } from "@/types";
import { addressSchema } from "@/lib/validations";
import { useStore } from "@/lib/services/store";
import { useAuth } from "@/hooks/use-auth";
import { formatPhone, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Badge, Card, Checkbox } from "@/components/ui/primitives";
import { Dialog, DialogContent, DialogFooter, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/overlays";
import { EmptyState, PageHeader } from "@/components/shared";
import { LgaInput, StateSelect } from "@/components/forms";
import { ConfirmDialog } from "@/components/dialogs";

type Values = z.infer<typeof addressSchema>;

function AddressDialog({ open, onOpenChange, address }: { open: boolean; onOpenChange: (o: boolean) => void; address?: SavedAddress }) {
  const { user } = useAuth();
  const save = useStore((s) => s.saveAddress);
  const empty: Values = { label: "", name: user?.name ?? "", phone: user?.phone ?? "", address: "", state: user?.state ?? "", lga: "", landmark: "", isDefault: false };
  const { register, control, handleSubmit, reset, watch, setValue, formState } = useForm<Values>({ resolver: zodResolver(addressSchema), defaultValues: empty });
  const { errors, isSubmitting } = formState;
  const state = watch("state");

  React.useEffect(() => {
    if (open) reset(address ? { ...address, landmark: address.landmark ?? "" } : empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, address]);

  const onSubmit = async (v: Values) => {
    await sleep(400);
    save({ ...v, id: address?.id, customerId: user!.id });
    toast.success(address ? "Address updated" : "Address added");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={address ? "Edit address" : "Add an address"} description="Saved addresses make booking faster." size="lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
          <Field label="Label" htmlFor="a-label" error={errors.label?.message} hint="e.g. Home, Office, Shop">
            <Input id="a-label" {...register("label")} aria-invalid={!!errors.label} />
          </Field>
          <Field label="Contact name" htmlFor="a-name" error={errors.name?.message}>
            <Input id="a-name" {...register("name")} aria-invalid={!!errors.name} />
          </Field>
          <Field label="Phone number" htmlFor="a-phone" error={errors.phone?.message}>
            <Input id="a-phone" type="tel" {...register("phone")} aria-invalid={!!errors.phone} />
          </Field>
          <Field label="Street address" htmlFor="a-address" error={errors.address?.message}>
            <Input id="a-address" {...register("address")} aria-invalid={!!errors.address} />
          </Field>
          <Field label="State" htmlFor="a-state" error={errors.state?.message}>
            <Controller
              control={control}
              name="state"
              render={({ field }) => (
                <StateSelect
                  id="a-state"
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    setValue("lga", "");
                  }}
                  invalid={!!errors.state}
                />
              )}
            />
          </Field>
          <Field label="LGA" htmlFor="a-lga" error={errors.lga?.message}>
            <Controller control={control} name="lga" render={({ field }) => <LgaInput id="a-lga" state={state} value={field.value} onChange={field.onChange} invalid={!!errors.lga} />} />
          </Field>
          <Field label="Landmark" htmlFor="a-landmark" optional className="sm:col-span-2">
            <Input id="a-landmark" {...register("landmark")} />
          </Field>
          <label className="flex items-center gap-2.5 text-sm text-ink sm:col-span-2">
            <Controller control={control} name="isDefault" render={({ field }) => <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} />} />
            Use as my default pickup address
          </label>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {address ? "Save changes" : "Add address"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AddressesPage() {
  const { user } = useAuth();
  const all = useStore((s) => s.addresses);
  const remove = useStore((s) => s.deleteAddress);
  const setDefault = useStore((s) => s.setDefaultAddress);
  const addresses = React.useMemo(() => all.filter((a) => a.customerId === user?.id).sort((a, b) => Number(b.isDefault) - Number(a.isDefault)), [all, user?.id]);
  const [editing, setEditing] = React.useState<SavedAddress | undefined>();
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<SavedAddress | null>(null);

  return (
    <>
      <PageHeader
        title="Saved addresses"
        description="Pickup and drop-off locations you use often."
        breadcrumbs={[{ label: "Overview", href: "/customer" }, { label: "Saved addresses" }]}
        actions={
          <Button
            onClick={() => {
              setEditing(undefined);
              setOpen(true);
            }}
          >
            <Plus /> Add address
          </Button>
        }
      />
      {addresses.length === 0 ? (
        <Card>
          <EmptyState icon={MapPin} title="No saved addresses" description="Save your home, office or shop to book faster." action={<Button onClick={() => setOpen(true)}>Add your first address</Button>} />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {addresses.map((a) => (
            <Card key={a.id} className={a.isDefault ? "border-emerald/50 ring-1 ring-emerald/20" : undefined}>
              <div className="flex items-start justify-between gap-3 p-5">
                <div className="flex min-w-0 gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface text-navy">
                    <Home className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-bold text-navy">
                      {a.label} {a.isDefault && <Badge tone="success">Default pickup</Badge>}
                    </p>
                    <p className="mt-1 text-sm text-ink">{a.address}</p>
                    <p className="text-sm text-muted">
                      {a.lga}, {a.state}
                    </p>
                    {a.landmark && <p className="mt-1 text-xs text-muted">Landmark: {a.landmark}</p>}
                    <p className="mt-2 text-xs text-ink-soft">
                      {a.name} · {formatPhone(a.phone)}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${a.label}`}>
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onSelect={() => {
                        setEditing(a);
                        setOpen(true);
                      }}
                    >
                      <Pencil /> Edit
                    </DropdownMenuItem>
                    {!a.isDefault && (
                      <DropdownMenuItem
                        onSelect={() => {
                          setDefault(a.id);
                          toast.success(`${a.label} is now your default pickup address`);
                        }}
                      >
                        <Star /> Set as default pickup
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem destructive onSelect={() => setDeleting(a)}>
                      <Trash2 /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}
      <AddressDialog open={open} onOpenChange={setOpen} address={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete "${deleting?.label}"?`}
        description="This address will be removed from your saved list."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => {
          if (deleting) remove(deleting.id);
          toast.success("Address deleted");
        }}
      />
    </>
  );
}
