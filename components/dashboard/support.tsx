"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, LifeBuoy, Mail, MessageSquare, Phone, Plus, Send } from "lucide-react";
import type { SupportTicket } from "@/types";
import { ticketSchema } from "@/lib/validations";
import { useStore } from "@/lib/services/store";
import { useAuth } from "@/hooks/use-auth";
import { TICKET_PRIORITY, TICKET_STATUS } from "@/lib/constants";
import { cn, formatDateTime, formatRelative, sleep, titleCase } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Card, CardBody, CardHeader } from "@/components/ui/primitives";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/overlays";
import { EmptyState, PageHeader, StatusBadge } from "@/components/shared";

type Values = z.infer<typeof ticketSchema>;

export function NewTicketDialog({ open, onOpenChange, defaultShipment }: { open: boolean; onOpenChange: (o: boolean) => void; defaultShipment?: string }) {
  const { user } = useAuth();
  const create = useStore((s) => s.createTicket);
  const { register, handleSubmit, reset, formState } = useForm<Values>({ resolver: zodResolver(ticketSchema), defaultValues: { subject: "", category: "delivery", priority: "medium", shipmentRef: defaultShipment ?? "", message: "" } });
  const { errors, isSubmitting } = formState;
  React.useEffect(() => {
    if (open) reset({ subject: "", category: "delivery", priority: "medium", shipmentRef: defaultShipment ?? "", message: "" });
  }, [open, defaultShipment, reset]);
  const onSubmit = async (v: Values) => {
    await sleep(500);
    const res = create({ ...v, shipmentRef: v.shipmentRef || undefined, userId: user!.id });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Ticket ${res.data.reference} created. We'll reply shortly.`);
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Contact support" description="Our team typically replies within 2 hours." size="lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject" htmlFor="t-subject" error={errors.subject?.message} className="sm:col-span-2">
            <Input id="t-subject" {...register("subject")} aria-invalid={!!errors.subject} placeholder="Short summary of the issue" />
          </Field>
          <Field label="Category" htmlFor="t-cat">
            <NativeSelect id="t-cat" {...register("category")}>
              {["delivery", "payment", "account", "technical", "other"].map((c) => (
                <option key={c} value={c}>
                  {titleCase(c)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Priority" htmlFor="t-pri">
            <NativeSelect id="t-pri" {...register("priority")}>
              {Object.entries(TICKET_PRIORITY).map(([k, p]) => (
                <option key={k} value={k}>
                  {p.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Shipment reference" htmlFor="t-ref" optional className="sm:col-span-2">
            <Input id="t-ref" {...register("shipmentRef")} placeholder="SLX-XXXXXX" className="uppercase" />
          </Field>
          <Field label="Message" htmlFor="t-msg" error={errors.message?.message} className="sm:col-span-2">
            <Textarea id="t-msg" rows={5} {...register("message")} aria-invalid={!!errors.message} placeholder="Tell us what happened and how we can help." />
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Submit ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TicketThread({ ticket, staff, onBack }: { ticket: SupportTicket; staff?: boolean; onBack?: () => void }) {
  const reply = useStore((s) => s.replyTicket);
  const setStatus = useStore((s) => s.setTicketStatus);
  const [body, setBody] = React.useState("");
  const closed = ticket.status === "closed";
  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5">
        <div className="min-w-0">
          {onBack && (
            <button type="button" onClick={onBack} className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink lg:hidden">
              <ArrowLeft className="size-3.5" /> All tickets
            </button>
          )}
          <p className="text-xs text-muted">
            {ticket.reference} · {titleCase(ticket.category)}
            {ticket.shipmentRef && ` · ${ticket.shipmentRef}`}
          </p>
          <h2 className="mt-0.5 font-bold text-navy">{ticket.subject}</h2>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge map={TICKET_PRIORITY} value={ticket.priority} />
          {staff ? (
            <NativeSelect
              value={ticket.status}
              onChange={(e) => {
                setStatus(ticket.id, e.target.value as SupportTicket["status"]);
                toast.success("Ticket status updated");
              }}
              className="h-8 w-36 text-[13px]"
              aria-label="Ticket status"
            >
              {Object.entries(TICKET_STATUS).map(([k, s]) => (
                <option key={k} value={k}>
                  {s.label}
                </option>
              ))}
            </NativeSelect>
          ) : (
            <StatusBadge map={TICKET_STATUS} value={ticket.status} />
          )}
        </div>
      </div>
      <ul className="flex-1 space-y-4 overflow-y-auto p-5 scrollbar-thin">
        {ticket.messages.map((m) => (
          <li key={m.id} className={cn("flex", m.fromStaff !== !!staff ? "justify-start" : "justify-end")}>
            <div className={cn("max-w-[85%] rounded-xl px-4 py-3 text-sm", m.fromStaff !== !!staff ? "bg-surface text-ink" : "bg-navy text-white")}>
              <p className={cn("text-xs font-semibold", m.fromStaff !== !!staff ? "text-muted" : "text-white/60")}>{m.author}</p>
              <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
              <p className={cn("mt-1.5 text-[11px]", m.fromStaff !== !!staff ? "text-muted" : "text-white/50")}>{formatDateTime(m.at)}</p>
            </div>
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2 border-t border-line p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim().length < 2) return;
          reply(ticket.id, body.trim(), !!staff);
          setBody("");
          toast.success("Reply sent");
        }}
      >
        <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder={closed ? "This ticket is closed" : "Write a reply…"} disabled={closed} aria-label="Reply" />
        <Button type="submit" disabled={closed || body.trim().length < 2} aria-label="Send reply">
          <Send />
        </Button>
      </form>
    </Card>
  );
}

export function TicketList({ tickets, activeId, onSelect, showOwner }: { tickets: SupportTicket[]; activeId?: string; onSelect: (t: SupportTicket) => void; showOwner?: (t: SupportTicket) => string }) {
  return (
    <ul className="divide-y divide-line">
      {tickets.map((t) => (
        <li key={t.id}>
          <button type="button" onClick={() => onSelect(t)} className={cn("w-full px-4 py-3.5 text-left hover:bg-surface/70", activeId === t.id && "bg-emerald-tint/40")}>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold text-ink">{t.subject}</span>
              <StatusBadge map={TICKET_STATUS} value={t.status} />
            </div>
            <p className="mt-0.5 truncate text-xs text-muted">
              {t.reference} · {showOwner ? `${showOwner(t)} · ` : ""}
              {formatRelative(t.updatedAt)}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function CustomerSupportView({ defaultShipment }: { defaultShipment?: string }) {
  const { user } = useAuth();
  const all = useStore((s) => s.tickets);
  const tickets = React.useMemo(() => all.filter((t) => t.userId === user?.id), [all, user?.id]);
  const [activeId, setActiveId] = React.useState<string | undefined>();
  const [open, setOpen] = React.useState(!!defaultShipment);
  const active = tickets.find((t) => t.id === activeId);

  return (
    <>
      <PageHeader
        title="Support"
        description="Get help with deliveries, payments or your account."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus /> New ticket
          </Button>
        }
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Phone, title: "Call us", body: "+234 700 794 3856", href: "tel:+2347007943856" },
          { icon: Mail, title: "Email", body: "support@swiftlogix.ng", href: "mailto:support@swiftlogix.ng" },
          { icon: MessageSquare, title: "WhatsApp", body: "+234 913 000 4455", href: "#" },
        ].map((c) => (
          <a key={c.title} href={c.href} className="flex items-center gap-3 rounded-xl border border-line bg-white p-4 shadow-card hover:shadow-raised">
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-emerald-tint text-emerald-deep">
              <c.icon className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-bold text-navy">{c.title}</span>
              <span className="block text-[13px] text-muted">{c.body}</span>
            </span>
          </a>
        ))}
      </div>
      {tickets.length === 0 ? (
        <Card>
          <EmptyState icon={LifeBuoy} title="No support tickets" description="If something goes wrong with a delivery, open a ticket and we'll sort it out." action={<Button onClick={() => setOpen(true)}>Open a ticket</Button>} />
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
          <Card className={cn("overflow-hidden", active && "hidden lg:block")}>
            <CardHeader title="Your tickets" className="pb-3" />
            <TicketList tickets={tickets} activeId={activeId} onSelect={(t) => setActiveId(t.id)} />
          </Card>
          <div className={cn("min-h-[420px]", !active && "hidden lg:block")}>
            {active ? (
              <TicketThread ticket={active} onBack={() => setActiveId(undefined)} />
            ) : (
              <Card className="flex h-full items-center justify-center">
                <CardBody>
                  <EmptyState icon={MessageSquare} title="Select a ticket" description="Choose a ticket to read the conversation and reply." />
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      )}
      <NewTicketDialog open={open} onOpenChange={setOpen} defaultShipment={defaultShipment} />
    </>
  );
}
