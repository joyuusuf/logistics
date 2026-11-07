"use client";

import { Download } from "lucide-react";
import type { AuditLog } from "@/types";
import { useStore } from "@/lib/services/store";
import { ROLE_LABEL } from "@/components/navigation/config";
import { downloadTextFile, formatDateTime, titleCase, toCsv } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, Badge } from "@/components/ui/primitives";
import { PageHeader } from "@/components/shared";
import { DataTable, type Column } from "@/components/tables/data-table";

const CATEGORIES: AuditLog["category"][] = ["shipment", "user", "rider", "partner", "payment", "payout", "pricing", "fleet", "auth", "settings"];

export default function AuditLogsPage() {
  const logs = useStore((s) => s.auditLogs);

  const columns: Column<AuditLog>[] = [
    { key: "at", header: "Time", sortValue: (l) => l.at, cell: (l) => <span className="whitespace-nowrap text-ink-soft">{formatDateTime(l.at)}</span> },
    {
      key: "actor",
      header: "Actor",
      sortValue: (l) => l.actorName,
      cell: (l) => (
        <span className="flex items-center gap-2">
          <Avatar name={l.actorName} size={26} />
          <span>
            <span className="block font-semibold text-ink">{l.actorName}</span>
            <span className="block text-xs text-muted">{l.actorRole === "system" ? "System" : ROLE_LABEL[l.actorRole]}</span>
          </span>
        </span>
      ),
    },
    { key: "action", header: "Action", cell: (l) => <span className="text-ink">{l.action}</span> },
    { key: "target", header: "Target", cell: (l) => <span className="font-medium text-ink-soft">{l.target}</span>, hideBelow: "md" },
    { key: "cat", header: "Category", sortValue: (l) => l.category, cell: (l) => <Badge tone="neutral" dot={false}>{titleCase(l.category)}</Badge>, hideBelow: "lg" },
  ];

  return (
    <>
      <PageHeader
        title="Audit logs"
        description="A record of sensitive actions taken by admins, partners and the system."
        actions={
          <Button
            variant="secondary"
            onClick={() => downloadTextFile("swiftlogix-audit-log.csv", toCsv(logs.map((l) => ({ Time: formatDateTime(l.at), Actor: l.actorName, Role: l.actorRole, Action: l.action, Target: l.target, Category: l.category }))), "text/csv")}
          >
            <Download /> Export
          </Button>
        }
      />
      <DataTable
        data={logs}
        columns={columns}
        getRowId={(l) => l.id}
        pageSize={15}
        searchPlaceholder="Search actor, action or target"
        searchFn={(l, q) => `${l.actorName} ${l.action} ${l.target}`.toLowerCase().includes(q)}
        filters={[{ value: "all", label: "All" }, ...CATEGORIES.map((c) => ({ value: c, label: titleCase(c) }))]}
        filterFn={(l, v) => l.category === v}
        defaultSort={{ key: "at", dir: "desc" }}
        emptyTitle="No audit events yet"
        mobileCard={(l) => (
          <div className="px-4 py-3">
            <p className="text-sm text-ink">
              <span className="font-semibold">{l.actorName}</span> · {l.action}
            </p>
            <p className="text-xs text-muted">
              {l.target} · {formatDateTime(l.at)}
            </p>
          </div>
        )}
      />
    </>
  );
}
