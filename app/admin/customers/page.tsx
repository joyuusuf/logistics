"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, Eye, MoreHorizontal, RotateCcw, UserCheck, UserPlus, Users, UserX } from "lucide-react";
import { subDays } from "date-fns";
import type { User } from "@/types";
import { useStore } from "@/lib/services/store";
import { formatDate, formatNaira, formatPhone } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, Badge } from "@/components/ui/primitives";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/overlays";
import { PageHeader, StatCard, StatGrid } from "@/components/shared";
import { DataTable, type Column } from "@/components/tables/data-table";
import { ConfirmDialog } from "@/components/dialogs";

export default function AdminCustomersPage() {
  const router = useRouter();
  const users = useStore((s) => s.users);
  const shipments = useStore((s) => s.shipments);
  const setStatus = useStore((s) => s.setUserStatus);
  const [target, setTarget] = React.useState<User | null>(null);
  const customers = React.useMemo(() => users.filter((u) => u.role === "customer"), [users]);

  const statsFor = React.useCallback(
    (id: string) => {
      const mine = shipments.filter((s) => s.customerId === id);
      return { count: mine.length, spent: mine.filter((s) => s.paymentStatus === "paid").reduce((a, s) => a + s.amount, 0) };
    },
    [shipments],
  );

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Customer",
      sortValue: (u) => u.name,
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} src={u.avatarUrl} size={34} />
          <div className="min-w-0">
            <p className="font-semibold text-ink">{u.name}</p>
            <p className="truncate text-xs text-muted">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "phone", header: "Phone", cell: (u) => <span className="text-ink-soft">{formatPhone(u.phone)}</span>, hideBelow: "xl" },
    { key: "loc", header: "Location", sortValue: (u) => u.state, cell: (u) => <span className="text-ink-soft">{u.city}, {u.state}</span>, hideBelow: "lg" },
    { key: "shipments", header: "Shipments", align: "right", sortValue: (u) => statsFor(u.id).count, cell: (u) => <span className="tabular">{statsFor(u.id).count}</span> },
    { key: "spent", header: "Total spent", align: "right", sortValue: (u) => statsFor(u.id).spent, cell: (u) => <span className="font-semibold tabular">{formatNaira(statsFor(u.id).spent)}</span>, hideBelow: "md" },
    { key: "joined", header: "Joined", sortValue: (u) => u.createdAt, cell: (u) => <span className="text-ink-soft">{formatDate(u.createdAt)}</span>, hideBelow: "lg" },
    { key: "status", header: "Status", cell: (u) => (u.status === "active" ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Suspended</Badge>) },
  ];

  return (
    <>
      <PageHeader title="Customers" description="People and businesses booking deliveries on SwiftLogix." />
      <StatGrid>
        <StatCard label="Total customers" value={customers.length} icon={Users} />
        <StatCard label="Active" value={customers.filter((c) => c.status === "active").length} icon={UserCheck} tone="emerald" />
        <StatCard label="New this month" value={customers.filter((c) => new Date(c.createdAt) > subDays(new Date(), 30)).length} icon={UserPlus} tone="info" />
        <StatCard label="Suspended" value={customers.filter((c) => c.status === "suspended").length} icon={UserX} tone="danger" />
      </StatGrid>
      <div className="mt-5">
        <DataTable
          data={customers}
          columns={columns}
          getRowId={(u) => u.id}
          searchPlaceholder="Search name, email or phone"
          searchFn={(u, q) => `${u.name} ${u.email} ${u.phone} ${u.city} ${u.state}`.toLowerCase().includes(q)}
          filters={[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "suspended", label: "Suspended" },
            { value: "Lagos", label: "Lagos" },
            { value: "FCT", label: "Abuja" },
            { value: "Oyo", label: "Oyo" },
          ]}
          filterFn={(u, v) => (v === "active" || v === "suspended" ? u.status === v : u.state === v)}
          defaultSort={{ key: "joined", dir: "desc" }}
          onRowClick={(u) => router.push(`/admin/customers/${u.id}`)}
          rowActions={(u) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${u.name}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => router.push(`/admin/customers/${u.id}`)}>
                  <Eye /> View profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {u.status === "active" ? (
                  <DropdownMenuItem destructive onSelect={() => setTarget(u)}>
                    <Ban /> Suspend account
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onSelect={() => {
                      setStatus(u.id, "active");
                      toast.success(`${u.name} reactivated`);
                    }}
                  >
                    <RotateCcw /> Reactivate account
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          mobileCard={(u) => (
            <button type="button" onClick={() => router.push(`/admin/customers/${u.id}`)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <Avatar name={u.name} size={36} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{u.name}</p>
                <p className="truncate text-xs text-muted">
                  {u.state} · {statsFor(u.id).count} shipments
                </p>
              </div>
              {u.status === "active" ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Suspended</Badge>}
            </button>
          )}
        />
      </div>
      <ConfirmDialog
        open={!!target}
        onOpenChange={(o) => !o && setTarget(null)}
        title={`Suspend ${target?.name}?`}
        description="They won't be able to sign in or book deliveries until reactivated."
        confirmLabel="Suspend"
        tone="danger"
        requireReason
        onConfirm={() => {
          if (target) setStatus(target.id, "suspended");
          toast.success("Account suspended");
        }}
      />
    </>
  );
}
