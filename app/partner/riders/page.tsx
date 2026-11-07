"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Ban, BadgeCheck, Bike, Eye, MoreHorizontal, Plus, RotateCcw, Truck, UserCheck, Users } from "lucide-react";
import type { Rider } from "@/types";
import { email, nigerianPhone, plateNumber } from "@/lib/validations";
import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/lib/services/store";
import { usePartnerFleet } from "@/hooks/use-partner-fleet";
import { RIDER_AVAILABILITY, VEHICLE_CATEGORIES, VERIFICATION_STATUS } from "@/lib/constants";
import { sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect } from "@/components/ui/input";
import { Avatar, Badge } from "@/components/ui/primitives";
import { Dialog, DialogContent, DialogFooter, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/overlays";
import { PageHeader, StatCard, StatGrid, StatusBadge } from "@/components/shared";
import { DataTable, type Column } from "@/components/tables/data-table";
import { LgaInput, StateSelect } from "@/components/forms";
import { ConfirmDialog } from "@/components/dialogs";
import { RiderProfileContent } from "@/components/dashboard/rider-profile";
import { AssignVehicleControl } from "@/components/dashboard/assign-vehicle";

const addSchema = z.object({
  name: z.string().trim().min(3, "Enter the rider's full name"),
  email,
  phone: nigerianPhone,
  address: z.string().trim().min(8, "Enter a full address"),
  state: z.string().min(1, "Select a state"),
  lga: z.string().trim().min(2, "Enter an LGA"),
  vehicleType: z.enum(["motorcycle", "tricycle", "car", "van", "pickup_truck", "truck"]),
  vehiclePlate: plateNumber,
});
type AddValues = z.infer<typeof addSchema>;

function AddRiderDialog({ open, onOpenChange, partnerId, defaultState }: { open: boolean; onOpenChange: (o: boolean) => void; partnerId: string; defaultState: string }) {
  const addRider = useStore((s) => s.partnerAddRider);
  const empty: AddValues = { name: "", email: "", phone: "", address: "", state: defaultState, lga: "", vehicleType: "motorcycle", vehiclePlate: "" };
  const { register, control, handleSubmit, reset, watch, setError, formState } = useForm<AddValues>({ resolver: zodResolver(addSchema), defaultValues: empty });
  const { errors, isSubmitting } = formState;
  const state = watch("state");
  React.useEffect(() => {
    if (open) reset(empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Add a rider" description="The rider gets an invite to finish onboarding and upload documents." size="lg">
        <form
          noValidate
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={handleSubmit(async (v) => {
            await sleep(500);
            const res = addRider(partnerId, v);
            if (!res.ok) {
              setError("email", { message: res.error });
              return;
            }
            toast.success(`${v.name} added. Invite sent (demo password: demo1234).`);
            onOpenChange(false);
          })}
        >
          <Field label="Full name" htmlFor="r-name" error={errors.name?.message}>
            <Input id="r-name" {...register("name")} aria-invalid={!!errors.name} />
          </Field>
          <Field label="Email" htmlFor="r-email" error={errors.email?.message}>
            <Input id="r-email" type="email" {...register("email")} aria-invalid={!!errors.email} />
          </Field>
          <Field label="Phone number" htmlFor="r-phone" error={errors.phone?.message}>
            <Input id="r-phone" type="tel" {...register("phone")} aria-invalid={!!errors.phone} />
          </Field>
          <Field label="Residential address" htmlFor="r-addr" error={errors.address?.message}>
            <Input id="r-addr" {...register("address")} aria-invalid={!!errors.address} />
          </Field>
          <Field label="State" htmlFor="r-state" error={errors.state?.message}>
            <Controller control={control} name="state" render={({ field }) => <StateSelect id="r-state" value={field.value} onChange={field.onChange} invalid={!!errors.state} />} />
          </Field>
          <Field label="LGA" htmlFor="r-lga" error={errors.lga?.message}>
            <Controller control={control} name="lga" render={({ field }) => <LgaInput id="r-lga" state={state} value={field.value} onChange={field.onChange} invalid={!!errors.lga} />} />
          </Field>
          <Field label="Vehicle type" htmlFor="r-vt">
            <NativeSelect id="r-vt" {...register("vehicleType")}>
              {Object.entries(VEHICLE_CATEGORIES).map(([k, c]) => (
                <option key={k} value={k}>
                  {c.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Vehicle registration" htmlFor="r-plate" error={errors.vehiclePlate?.message}>
            <Input id="r-plate" {...register("vehiclePlate")} aria-invalid={!!errors.vehiclePlate} className="uppercase" placeholder="LND-123AA" />
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Add rider
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PartnerRidersPage() {
  const { partner } = useAuth();
  const shipments = useStore((s) => s.shipments);
  const review = useStore((s) => s.reviewRider);
  const setStatus = useStore((s) => s.setRiderStatus);
  const { myRiders } = usePartnerFleet(partner!.id);
  const vehicles = useStore((s) => s.vehicles);
  const [addOpen, setAddOpen] = React.useState(false);
  const [viewId, setViewId] = React.useState<string | null>(null);
  const [suspend, setSuspend] = React.useState<Rider | null>(null);
  const viewing = myRiders.find((r) => r.id === viewId);

  const deliveredCount = (id: string) => shipments.filter((s) => s.riderId === id && s.status === "delivered").length;

  const columns: Column<Rider>[] = [
    {
      key: "name",
      header: "Rider",
      sortValue: (r) => r.name,
      cell: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.name} src={r.avatarUrl} size={34} />
          <div className="min-w-0">
            <p className="font-semibold text-ink">{r.name}</p>
            <p className="text-xs text-muted">{r.phone}</p>
          </div>
        </div>
      ),
    },
    { key: "area", header: "Area", cell: (r) => <span className="text-ink-soft">{r.lga}, {r.state}</span>, hideBelow: "lg" },
    { key: "vehicle", header: "Vehicle", cell: (r) => <span className="text-ink-soft">{vehicles.find((v) => v.id === r.vehicleId)?.plate ?? <span className="text-muted">None</span>}</span>, hideBelow: "md" },
    { key: "deliveries", header: "Deliveries", align: "right", sortValue: (r) => deliveredCount(r.id), cell: (r) => <span className="tabular">{deliveredCount(r.id)}</span>, hideBelow: "md" },
    { key: "verification", header: "Verification", sortValue: (r) => r.verification, cell: (r) => <StatusBadge map={VERIFICATION_STATUS} value={r.verification} /> },
    { key: "status", header: "Status", cell: (r) => (r.status === "suspended" ? <Badge tone="danger">Suspended</Badge> : <StatusBadge map={RIDER_AVAILABILITY} value={r.availability} />) },
  ];

  return (
    <>
      <PageHeader
        title="Riders"
        description="Riders in your fleet, their documents, vehicles and activity."
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus /> Add rider
          </Button>
        }
      />
      <StatGrid>
        <StatCard label="Total riders" value={myRiders.length} icon={Users} />
        <StatCard label="Online now" value={myRiders.filter((r) => r.availability === "online").length} icon={Bike} tone="emerald" />
        <StatCard label="Awaiting verification" value={myRiders.filter((r) => r.verification === "under_review" || r.verification === "not_submitted").length} icon={BadgeCheck} tone="amber" />
        <StatCard label="Suspended" value={myRiders.filter((r) => r.status === "suspended").length} icon={Ban} tone="danger" />
      </StatGrid>
      <div className="mt-5">
        <DataTable
          data={myRiders}
          columns={columns}
          getRowId={(r) => r.id}
          searchPlaceholder="Search riders"
          searchFn={(r, q) => `${r.name} ${r.phone} ${r.lga}`.toLowerCase().includes(q)}
          filters={[
            { value: "all", label: "All" },
            { value: "online", label: "Online" },
            { value: "busy", label: "Busy" },
            { value: "offline", label: "Offline" },
            { value: "review", label: "Needs review" },
          ]}
          filterFn={(r, v) => (v === "review" ? r.verification === "under_review" || r.verification === "not_submitted" : r.availability === v)}
          defaultSort={{ key: "deliveries", dir: "desc" }}
          onRowClick={(r) => setViewId(r.id)}
          rowActions={(r) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${r.name}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => setViewId(r.id)}>
                  <Eye /> View profile
                </DropdownMenuItem>
                {r.verification === "under_review" && (
                  <DropdownMenuItem
                    onSelect={() => {
                      review(r.id, "approved");
                      toast.success(`${r.name} verified`);
                    }}
                  >
                    <UserCheck /> Verify rider
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {r.status === "active" ? (
                  <DropdownMenuItem destructive onSelect={() => setSuspend(r)}>
                    <Ban /> Suspend rider
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onSelect={() => {
                      setStatus(r.id, "active");
                      toast.success(`${r.name} reactivated`);
                    }}
                  >
                    <RotateCcw /> Reactivate
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          emptyTitle="No riders yet"
          emptyDescription="Add riders to your fleet to start assigning deliveries."
          emptyAction={<Button onClick={() => setAddOpen(true)}>Add rider</Button>}
          mobileCard={(r) => (
            <button type="button" onClick={() => setViewId(r.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <Avatar name={r.name} src={r.avatarUrl} size={38} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{r.name}</p>
                <p className="truncate text-xs text-muted">
                  {r.lga} · {deliveredCount(r.id)} deliveries
                </p>
              </div>
              <StatusBadge map={VERIFICATION_STATUS} value={r.verification} />
            </button>
          )}
        />
      </div>

      <AddRiderDialog open={addOpen} onOpenChange={setAddOpen} partnerId={partner!.id} defaultState={partner!.operatingStates[0] ?? ""} />

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewId(null)}>
        {viewing && (
          <DialogContent title="Rider profile" size="xl">
            <div className="mb-5 flex flex-col gap-3 rounded-lg bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
              <AssignVehicleControl rider={viewing} partnerId={partner!.id} />
              <div className="flex flex-wrap gap-2">
                {viewing.verification === "under_review" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      review(viewing.id, "approved");
                      toast.success(`${viewing.name} verified`);
                    }}
                  >
                    <UserCheck /> Verify rider
                  </Button>
                )}
                {viewing.status === "active" ? (
                  <Button size="sm" variant="danger-ghost" onClick={() => setSuspend(viewing)}>
                    <Ban /> Suspend
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setStatus(viewing.id, "active");
                      toast.success("Rider reactivated");
                    }}
                  >
                    <RotateCcw /> Reactivate
                  </Button>
                )}
              </div>
            </div>
            <RiderProfileContent rider={viewing} linkBase="/partner/deliveries" />
          </DialogContent>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!suspend}
        onOpenChange={(o) => !o && setSuspend(null)}
        title={`Suspend ${suspend?.name}?`}
        description="They will be set offline and won't receive new deliveries until reactivated."
        confirmLabel="Suspend rider"
        tone="danger"
        requireReason
        reasonPlaceholder="e.g. Repeated late deliveries"
        onConfirm={() => {
          if (suspend) setStatus(suspend.id, "suspended");
          toast.success("Rider suspended");
        }}
      />
    </>
  );
}
