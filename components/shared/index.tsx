"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, ChevronRight, Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, Card, Skeleton } from "@/components/ui/primitives";
import { SHIPMENT_STATUS, type Tone } from "@/lib/constants";
import type { ShipmentStatus } from "@/types";

/* ------------------------------ Status badges ------------------------------ */
export function ShipmentStatusBadge({ status, className }: { status: ShipmentStatus; className?: string }) {
  const s = SHIPMENT_STATUS[status];
  return (
    <Badge tone={s.tone} className={className}>
      {s.label}
    </Badge>
  );
}

export function StatusBadge<K extends string>({ map, value, className }: { map: Record<K, { label: string; tone: Tone }>; value: K; className?: string }) {
  const s = map[value];
  return (
    <Badge tone={s?.tone ?? "neutral"} className={className}>
      {s?.label ?? value}
    </Badge>
  );
}

/* ------------------------------ Page header ------------------------------ */
export interface Crumb {
  label: string;
  href?: string;
}

export function PageHeader({ title, description, actions, breadcrumbs, className }: { title: string; description?: React.ReactNode; actions?: React.ReactNode; breadcrumbs?: Crumb[]; className?: string }) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1 text-xs font-medium text-muted">
            {breadcrumbs.map((c, i) => (
              <span key={c.label} className="inline-flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3" />}
                {c.href ? (
                  <Link href={c.href} className="hover:text-ink">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-ink-soft">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-ink sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ------------------------------ Stat card ------------------------------ */
export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  hint,
  tone = "navy",
  href,
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  delta?: number;
  hint?: string;
  tone?: "navy" | "emerald" | "amber" | "danger" | "info";
  href?: string;
}) {
  const toneBg = {
    navy: "bg-navy/6 text-navy",
    emerald: "bg-emerald-tint text-emerald-deep",
    amber: "bg-amber-tint text-[#93630f]",
    danger: "bg-danger-tint text-danger",
    info: "bg-info-tint text-info",
  }[tone];
  const body = (
    <Card className={cn("group h-full p-4 transition-shadow sm:p-5", href && "hover:shadow-raised")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <span className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-lg", toneBg)}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2 text-xl font-extrabold tracking-[-0.02em] text-ink tabular sm:text-2xl">{value}</p>
      {(delta !== undefined || hint) && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
          {delta !== undefined && (
            <span className={cn("inline-flex items-center gap-0.5 font-semibold", delta >= 0 ? "text-emerald-deep" : "text-danger")}>
              {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {Math.abs(delta)}%
            </span>
          )}
          {hint && <span className="text-muted">{hint}</span>}
        </div>
      )}
    </Card>
  );
  return href ? (
    <Link href={href} className="block rounded-xl">
      {body}
    </Link>
  ) : (
    body
  );
}

export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4", className)}>{children}</div>;
}

/* ------------------------------ Empty / loading ------------------------------ */
export function EmptyState({ icon: Icon = Inbox, title, description, action, className }: { icon?: LucideIcon; title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      <span className="mb-3 inline-flex size-12 items-center justify-center rounded-full bg-surface text-muted ring-1 ring-line">
        <Icon className="size-5" />
      </span>
      <p className="text-sm font-bold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}

export function NotFoundCard({ title, description, href, cta }: { title: string; description: string; href: string; cta: string }) {
  return (
    <Card>
      <EmptyState
        title={title}
        description={description}
        action={
          <Link href={href} className="text-sm font-semibold text-emerald-deep hover:underline">
            {cta}
          </Link>
        }
      />
    </Card>
  );
}

/* ------------------------------ Motion ------------------------------ */
export function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[15px] font-bold text-ink">{children}</h2>
      {action}
    </div>
  );
}
