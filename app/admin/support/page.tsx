"use client";

import * as React from "react";
import { LifeBuoy, MessageSquare } from "lucide-react";
import { useStore } from "@/lib/services/store";
import { TICKET_STATUS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/primitives";
import { EmptyState, PageHeader, StatCard, StatGrid } from "@/components/shared";
import { TicketList, TicketThread } from "@/components/dashboard/support";
import { ROLE_LABEL } from "@/components/navigation/config";

export default function AdminSupportPage() {
  const tickets = useStore((s) => s.tickets);
  const users = useStore((s) => s.users);
  const [filter, setFilter] = React.useState<string>("open");
  const [activeId, setActiveId] = React.useState<string>();
  const list = React.useMemo(() => [...tickets].filter((t) => filter === "all" || t.status === filter).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [tickets, filter]);
  const active = tickets.find((t) => t.id === activeId);
  const owner = (userId: string) => {
    const u = users.find((x) => x.id === userId);
    return u ? `${u.name} (${ROLE_LABEL[u.role]})` : "Unknown";
  };

  return (
    <>
      <PageHeader title="Support tickets" description="Respond to customers, riders and partners." />
      <StatGrid>
        {(Object.keys(TICKET_STATUS) as (keyof typeof TICKET_STATUS)[]).map((k) => (
          <StatCard key={k} label={TICKET_STATUS[k].label} value={tickets.filter((t) => t.status === k).length} icon={k === "open" ? LifeBuoy : MessageSquare} tone={k === "open" ? "amber" : k === "in_progress" ? "info" : k === "resolved" ? "emerald" : "navy"} />
        ))}
      </StatGrid>
      <div className="mt-5 grid gap-5 lg:grid-cols-[360px_1fr]">
        <Card className={cn("overflow-hidden", active && "hidden lg:block")}>
          <div className="flex gap-1.5 overflow-x-auto border-b border-line p-3 scrollbar-thin">
            {["open", "in_progress", "resolved", "closed", "all"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn("shrink-0 rounded-full border px-3 py-1 text-[13px] font-semibold", filter === f ? "border-navy bg-navy text-white" : "border-line text-ink-soft")}
              >
                {f === "all" ? "All" : TICKET_STATUS[f as keyof typeof TICKET_STATUS].label}
              </button>
            ))}
          </div>
          {list.length === 0 ? <EmptyState title="No tickets here" description="Nothing in this queue." /> : <TicketList tickets={list} activeId={activeId} onSelect={(t) => setActiveId(t.id)} showOwner={(t) => owner(t.userId)} />}
        </Card>
        <div className={cn("min-h-[460px]", !active && "hidden lg:block")}>
          {active ? (
            <div className="space-y-3">
              <p className="text-xs text-muted">From {owner(active.userId)}</p>
              <TicketThread ticket={active} staff onBack={() => setActiveId(undefined)} />
            </div>
          ) : (
            <Card className="flex h-full items-center justify-center">
              <CardBody>
                <EmptyState icon={MessageSquare} title="Select a ticket" description="Pick a ticket to reply or change its status." />
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
