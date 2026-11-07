"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Bike, Clock3, Eye, MoreHorizontal, ShieldAlert, UserCheck } from "lucide-react";
import type { Rider } from "@/types";
import { useStore } from "@/lib/services/store";
import { RIDER_AVAILABILITY, VEHICLE_CATEGORIES, VERIFICATION_STATUS } from "@/lib/constants";
import { formatDate, formatRelative } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, Card, CardHeader } from "@/components/ui/primitives";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/overlays";
import { PageHeader, StatCard, StatGrid, StatusBadge } from "@/components/shared";
import { DataTable, type Column } from "@/components/tables/data-table";

export default function AdminRidersPage() {
  const router = useRouter();
  const riders = useStore((s) => s.riders);
  const partners = useStore((s) => s.partners);
  const shipments = useStore((s) => s.shipments);
  const queue = riders.filter((r) => r.verification === "under_review").sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
  const delivered = React.useCallback((id: string) => shipments.filter((s) => s.riderId === id && s.status === "delivered").length, [shipments]);

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
            <p className="text-xs text-muted">
              {VEHICLE_CATEGORIES[r.vehicleType].label} · {r.vehiclePlate}
            </p>
          </div>
        </div>
      ),
    },
    { key: "area", header: "State", sortValue: (r) => r.state, cell: (r) => <span className="text-ink-soft">{r.lga}, {r.state}</span>, hideBelow: "lg" },
    { key: "fleet", header: "Fleet", cell: (r) => <span className="text-ink-soft">{partners.find((p) => p.id === r.partnerId)?.companyName ?? "Independent"}</span>, hideBelow: "xl" },
    { key: "deliveries", header: "Delivered", align: "right", sortValue: (r) => delivered(r.id), cell: (r) => <span className="tabular">{delivered(r.id)}</span>, hideBelow: "md" },
    { key: "rating", header: "Rating", align: "right", sortValue: (r) => r.rating, cell: (r) => <span className="tabular">{r.rating ? r.rating.toFixed(1) : "—"}</span>, hideBelow: "md" },
    { key: "verification", header: "Verification", sortValue: (r) => r.verification, cell: (r) => <StatusBadge map={VERIFICATION_STATUS} value={r.verification} /> },
    { key: "status", header: "Status", cell: (r) => (r.status === "suspended" ? <Badge tone="danger">Suspended</Badge> : <StatusBadge map={RIDER_AVAILABILITY} value={r.availability} />) },
    { key: "joined", header: "Joined", sortValue: (r) => r.joinedAt, cell: (r) => <span className="text-ink-soft">{formatDate(r.joinedAt)}</span>, hideBelow: "xl" },
  ];

  return (
    <>
      <PageHeader title="Riders" description="Review applications, monitor performance and manage rider accounts." />
      <StatGrid>
        <StatCard label="Total riders" value={riders.length} icon={Bike} />
        <StatCard label="Verified" value={riders.filter((r) => r.verification === "approved").length} icon={BadgeCheck} tone="emerald" />
        <StatCard label="Awaiting review" value={queue.length} icon={Clock3} tone="amber" />
        <StatCard label="Online now" value={riders.filter((r) => r.availability === "online" && r.status === "active").length} icon={UserCheck} tone="info" />
      </StatGrid>

      {queue.length > 0 && (
        <Card className="mt-5 border-amber/40">
          <CardHeader title="Verification queue" description="Oldest applications first" />
          <ul className="mt-3 divide-y divide-line">
            {queue.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={r.name} src={r.avatarUrl} size={36} />
                  <div>
                    <p className="text-sm font-semibold text-ink">{r.name}</p>
                    <p className="text-xs text-muted">
                      {r.state} · {r.documents.filter((d) => d.status !== "not_submitted").length}/{r.documents.length} documents · applied {formatRelative(r.joinedAt)}
                    </p>
                  </div>
                </div>
                <Button asChild size="sm" variant="navy">
                  <Link href={`/admin/riders/${r.id}`}>
                    <ShieldAlert /> Review documents
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-5">
        <DataTable
          data={riders}
          columns={columns}
          getRowId={(r) => r.id}
          searchPlaceholder="Search name, phone, plate or area"
          searchFn={(r, q) => `${r.name} ${r.phone} ${r.vehiclePlate} ${r.lga} ${r.state}`.toLowerCase().includes(q)}
          filters={[{ value: "all", label: "All" }, ...Object.entries(VERIFICATION_STATUS).map(([value, s]) => ({ value, label: s.label })), { value: "suspended", label: "Suspended" }]}
          filterFn={(r, v) => (v === "suspended" ? r.status === "suspended" : r.verification === v)}
          defaultSort={{ key: "joined", dir: "desc" }}
          onRowClick={(r) => router.push(`/admin/riders/${r.id}`)}
          rowActions={(r) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${r.name}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => router.push(`/admin/riders/${r.id}`)}>
                  <Eye /> View and review
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          mobileCard={(r) => (
            <button type="button" onClick={() => router.push(`/admin/riders/${r.id}`)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <Avatar name={r.name} src={r.avatarUrl} size={36} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{r.name}</p>
                <p className="truncate text-xs text-muted">
                  {r.state} · {delivered(r.id)} delivered
                </p>
              </div>
              <StatusBadge map={VERIFICATION_STATUS} value={r.verification} />
            </button>
          )}
        />
      </div>
    </>
  );
}
