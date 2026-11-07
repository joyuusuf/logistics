"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, Eye, MapPin, MoreHorizontal, Navigation, UserPlus } from "lucide-react";
import type { Role, Shipment, ShipmentFilterGroup } from "@/types";
import { useStore } from "@/lib/services/store";
import { CANCELLABLE_STATUSES, DELIVERY_TYPES, SHIPMENT_FILTERS } from "@/lib/constants";
import { matchesFilter } from "@/lib/services/selectors";
import { formatDate, formatNaira } from "@/lib/utils";
import { DataTable, type Column } from "./data-table";
import { ShipmentStatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/overlays";
import { AssignRiderDialog, ConfirmDialog } from "@/components/dialogs";

const BASE: Record<Role, string> = {
  customer: "/customer/shipments",
  rider: "/rider/deliveries",
  partner: "/partner/deliveries",
  admin: "/admin/deliveries",
};

/** Searchable, filterable shipment table used by customer, partner and admin portals. */
export function ShipmentTable({
  data,
  role,
  pageSize = 10,
  showCustomer,
  showRider,
  emptyAction,
  emptyTitle = "No shipments yet",
  emptyDescription,
  partnerId,
  filters = SHIPMENT_FILTERS,
}: {
  data: Shipment[];
  role: Role;
  pageSize?: number;
  showCustomer?: boolean;
  showRider?: boolean;
  emptyAction?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  partnerId?: string;
  filters?: { value: ShipmentFilterGroup | string; label: string }[];
}) {
  const router = useRouter();
  const users = useStore((s) => s.users);
  const riders = useStore((s) => s.riders);
  const cancel = useStore((s) => s.cancelShipment);
  const [cancelTarget, setCancelTarget] = React.useState<Shipment | null>(null);
  const [assignTarget, setAssignTarget] = React.useState<Shipment | null>(null);
  const base = BASE[role];
  const canAssign = role === "admin" || role === "partner";

  const nameOf = React.useCallback((id: string) => users.find((u) => u.id === id)?.name ?? "Unknown", [users]);
  const riderOf = React.useCallback((id?: string) => riders.find((r) => r.id === id)?.name, [riders]);

  const columns: Column<Shipment>[] = [
    {
      key: "reference",
      header: "Shipment ID",
      sortValue: (s) => s.reference,
      cell: (s) => (
        <Link href={`${base}/${s.id}`} className="font-semibold text-navy hover:underline" onClick={(e) => e.stopPropagation()}>
          {s.reference}
        </Link>
      ),
    },
    ...(showCustomer ? [{ key: "customer", header: "Customer", sortValue: (s: Shipment) => nameOf(s.customerId), cell: (s: Shipment) => <span className="text-ink">{nameOf(s.customerId)}</span>, hideBelow: "lg" as const }] : []),
    {
      key: "recipient",
      header: "Recipient",
      sortValue: (s) => s.recipient.name,
      cell: (s) => <span className="text-ink">{s.recipient.name}</span>,
    },
    {
      key: "destination",
      header: "Destination",
      cell: (s) => (
        <span className="text-ink-soft">
          {s.recipient.lga}
          <span className="text-muted">, {s.recipient.state}</span>
        </span>
      ),
      hideBelow: "lg",
    },
    ...(showRider ? [{ key: "rider", header: "Rider", cell: (s: Shipment) => <span className="text-ink-soft">{riderOf(s.riderId) ?? <span className="text-muted">Unassigned</span>}</span>, hideBelow: "xl" as const }] : []),
    { key: "date", header: "Booking date", sortValue: (s) => s.createdAt, cell: (s) => <span className="whitespace-nowrap text-ink-soft">{formatDate(s.createdAt)}</span> },
    { key: "type", header: "Delivery type", cell: (s) => <span className="text-ink-soft">{DELIVERY_TYPES[s.deliveryType].label}</span>, hideBelow: "md" },
    { key: "amount", header: "Amount", align: "right", sortValue: (s) => s.amount, cell: (s) => <span className="font-semibold text-ink tabular">{formatNaira(s.amount)}</span> },
    { key: "status", header: "Status", sortValue: (s) => s.status, cell: (s) => <ShipmentStatusBadge status={s.status} /> },
  ];

  const actions = (s: Shipment) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${s.reference}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => router.push(`${base}/${s.id}`)}>
          <Eye /> View details
        </DropdownMenuItem>
        {role === "customer" && (
          <DropdownMenuItem onSelect={() => router.push(`/customer/track?ref=${s.reference}`)}>
            <Navigation /> Track shipment
          </DropdownMenuItem>
        )}
        {canAssign && ["confirmed", "pending", "assigned"].includes(s.status) && (
          <DropdownMenuItem onSelect={() => setAssignTarget(s)}>
            <UserPlus /> {s.riderId ? "Reassign rider" : "Assign rider"}
          </DropdownMenuItem>
        )}
        {(role === "customer" || role === "admin") && CANCELLABLE_STATUSES.includes(s.status) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => setCancelTarget(s)}>
              <Ban /> Cancel shipment
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <DataTable
        data={data}
        columns={columns}
        getRowId={(s) => s.id}
        searchPlaceholder={showCustomer ? "Search reference, customer or recipient" : "Search reference, recipient or area"}
        searchFn={(s, q) =>
          s.reference.toLowerCase().includes(q) ||
          s.recipient.name.toLowerCase().includes(q) ||
          s.recipient.lga.toLowerCase().includes(q) ||
          s.recipient.state.toLowerCase().includes(q) ||
          (showCustomer ? nameOf(s.customerId).toLowerCase().includes(q) : false)
        }
        filters={filters}
        filterFn={(s, v) => (v === "unassigned" ? !s.riderId && ["pending", "confirmed"].includes(s.status) : matchesFilter(s, v as ShipmentFilterGroup))}
        defaultSort={{ key: "date", dir: "desc" }}
        pageSize={pageSize}
        onRowClick={(s) => router.push(`${base}/${s.id}`)}
        rowActions={actions}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        emptyAction={emptyAction}
        mobileCard={(s) => (
          <Link href={`${base}/${s.id}`} className="flex items-start justify-between gap-3 px-4 py-3.5 active:bg-surface">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy">{s.reference}</p>
              <p className="mt-0.5 flex items-center gap-1 truncate text-[13px] text-ink-soft">
                <MapPin className="size-3.5 shrink-0 text-muted" />
                {s.recipient.name} · {s.recipient.lga}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {formatDate(s.createdAt)} · {DELIVERY_TYPES[s.deliveryType].label}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className="text-sm font-bold text-ink tabular">{formatNaira(s.amount)}</span>
              <ShipmentStatusBadge status={s.status} />
            </div>
          </Link>
        )}
      />
      {cancelTarget && (
        <ConfirmDialog
          open={!!cancelTarget}
          onOpenChange={(o) => !o && setCancelTarget(null)}
          title={`Cancel ${cancelTarget.reference}?`}
          description="The rider will be notified and any payment refunded to the original method."
          confirmLabel="Cancel shipment"
          tone="danger"
          requireReason={role === "admin"}
          reasonPlaceholder="Why is this shipment being cancelled?"
          onConfirm={(reason) => {
            const res = cancel(cancelTarget.id, reason ?? (role === "customer" ? "Cancelled by customer" : undefined));
            if (res.ok) toast.success("Shipment cancelled");
            else toast.error(res.error);
          }}
        />
      )}
      {assignTarget && <AssignRiderDialog shipment={assignTarget} open={!!assignTarget} onOpenChange={(o) => !o && setAssignTarget(null)} partnerId={role === "partner" ? partnerId : undefined} />}
    </>
  );
}
