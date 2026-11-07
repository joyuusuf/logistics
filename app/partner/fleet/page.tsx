"use client";

import * as React from "react";
import { toast } from "sonner";
import { CircleCheck, Gauge, MoreHorizontal, Pencil, Plus, Trash2, Truck, Wrench } from "lucide-react";
import type { Vehicle, VehicleAvailability } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/lib/services/store";
import { usePartnerFleet } from "@/hooks/use-partner-fleet";
import { VEHICLE_AVAILABILITY, VEHICLE_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/primitives";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/overlays";
import { PageHeader, StatCard, StatGrid, StatusBadge } from "@/components/shared";
import { DataTable, type Column } from "@/components/tables/data-table";
import { ConfirmDialog } from "@/components/dialogs";
import { VehicleDialog } from "@/components/dashboard/vehicle-dialog";

export default function FleetPage() {
  const { partner } = useAuth();
  const riders = useStore((s) => s.riders);
  const update = useStore((s) => s.updateVehicle);
  const remove = useStore((s) => s.removeVehicle);
  const { myVehicles, utilisation } = usePartnerFleet(partner!.id);
  const [editing, setEditing] = React.useState<Vehicle | undefined>();
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Vehicle | null>(null);

  const riderOf = (id?: string) => riders.find((r) => r.id === id);

  const columns: Column<Vehicle>[] = [
    {
      key: "vehicle",
      header: "Vehicle",
      sortValue: (v) => v.plate,
      cell: (v) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-surface text-navy">
            <Truck className="size-4" />
          </span>
          <div>
            <p className="font-semibold text-ink">{v.plate}</p>
            <p className="text-xs text-muted">
              {v.make} {v.model} · {v.year} · {v.color}
            </p>
          </div>
        </div>
      ),
    },
    { key: "cat", header: "Category", sortValue: (v) => v.category, cell: (v) => <span className="text-ink-soft">{VEHICLE_CATEGORIES[v.category].label}</span> },
    { key: "cap", header: "Capacity", align: "right", sortValue: (v) => v.capacityKg, cell: (v) => <span className="tabular">{v.capacityKg.toLocaleString()} kg</span>, hideBelow: "lg" },
    {
      key: "rider",
      header: "Assigned rider",
      cell: (v) => {
        const r = riderOf(v.assignedRiderId);
        return r ? (
          <span className="flex items-center gap-2">
            <Avatar name={r.name} src={r.avatarUrl} size={26} />
            <span className="text-ink">{r.name}</span>
          </span>
        ) : (
          <span className="text-muted">Unassigned</span>
        );
      },
      hideBelow: "md",
    },
    { key: "status", header: "Availability", sortValue: (v) => v.availability, cell: (v) => <StatusBadge map={VEHICLE_AVAILABILITY} value={v.availability} /> },
    { key: "added", header: "Added", sortValue: (v) => v.createdAt, cell: (v) => <span className="text-ink-soft">{formatDate(v.createdAt)}</span>, hideBelow: "xl" },
  ];

  const setAvailability = (v: Vehicle, a: VehicleAvailability) => {
    update(v.id, { availability: a });
    toast.success(`${v.plate} set to ${VEHICLE_AVAILABILITY[a].label.toLowerCase()}`);
  };

  return (
    <>
      <PageHeader
        title="Fleet management"
        description="Register vehicles, set availability and see who's driving what."
        actions={
          <Button
            onClick={() => {
              setEditing(undefined);
              setOpen(true);
            }}
          >
            <Plus /> Register vehicle
          </Button>
        }
      />
      <StatGrid>
        <StatCard label="Total vehicles" value={myVehicles.length} icon={Truck} />
        <StatCard label="Available" value={myVehicles.filter((v) => v.availability === "available").length} icon={CircleCheck} tone="emerald" />
        <StatCard label="In maintenance" value={myVehicles.filter((v) => v.availability === "maintenance").length} icon={Wrench} tone="amber" />
        <StatCard label="Utilisation" value={`${utilisation}%`} icon={Gauge} tone="info" />
      </StatGrid>
      <div className="mt-5">
        <DataTable
          data={myVehicles}
          columns={columns}
          getRowId={(v) => v.id}
          searchPlaceholder="Search plate, make or model"
          searchFn={(v, q) => `${v.plate} ${v.make} ${v.model}`.toLowerCase().includes(q)}
          filters={[{ value: "all", label: "All" }, ...Object.entries(VEHICLE_CATEGORIES).map(([value, c]) => ({ value, label: c.label }))]}
          filterFn={(v, f) => v.category === f}
          defaultSort={{ key: "added", dir: "desc" }}
          onRowClick={(v) => {
            setEditing(v);
            setOpen(true);
          }}
          rowActions={(v) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${v.plate}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onSelect={() => {
                    setEditing(v);
                    setOpen(true);
                  }}
                >
                  <Pencil /> Edit details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Set availability</DropdownMenuLabel>
                {(Object.keys(VEHICLE_AVAILABILITY) as VehicleAvailability[]).map((a) => (
                  <DropdownMenuItem key={a} disabled={v.availability === a} onSelect={() => setAvailability(v, a)}>
                    <span className="size-2 rounded-full bg-current" /> {VEHICLE_AVAILABILITY[a].label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onSelect={() => setDeleting(v)}>
                  <Trash2 /> Remove vehicle
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          emptyTitle="No vehicles yet"
          emptyDescription="Register your first vehicle to start assigning riders."
          emptyAction={<Button onClick={() => setOpen(true)}>Register vehicle</Button>}
          mobileCard={(v) => (
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
              onClick={() => {
                setEditing(v);
                setOpen(true);
              }}
            >
              <div className="min-w-0">
                <p className="font-semibold text-ink">{v.plate}</p>
                <p className="truncate text-xs text-muted">
                  {VEHICLE_CATEGORIES[v.category].label} · {v.make} {v.model} · {riderOf(v.assignedRiderId)?.name ?? "Unassigned"}
                </p>
              </div>
              <StatusBadge map={VEHICLE_AVAILABILITY} value={v.availability} />
            </button>
          )}
        />
      </div>
      <VehicleDialog open={open} onOpenChange={setOpen} partnerId={partner!.id} vehicle={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Remove ${deleting?.plate}?`}
        description="The vehicle will be removed from your fleet and unassigned from its rider."
        confirmLabel="Remove"
        tone="danger"
        onConfirm={() => {
          if (!deleting) return;
          const r = remove(deleting.id);
          if (r.ok) toast.success("Vehicle removed");
          else toast.error(r.error);
        }}
      />
    </>
  );
}
