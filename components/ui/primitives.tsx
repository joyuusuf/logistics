"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive, Switch as SwitchPrimitive, Tabs as TabsPrimitive, Progress as ProgressPrimitive } from "radix-ui";
import { Check } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import type { Tone } from "@/lib/constants";

/* ------------------------------ Card ------------------------------ */
export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-xl border border-line bg-white shadow-card", className)} {...props} />;
}

export function CardHeader({ className, title, description, action, ...props }: Omit<React.ComponentProps<"div">, "title"> & { title?: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5", className)} {...props}>
      <div className="min-w-0">
        {title && <h3 className="text-[15px] font-bold text-ink">{title}</h3>}
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-5", className)} {...props} />;
}

/* ------------------------------ Badge ------------------------------ */
const toneClasses: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
  info: "bg-info-tint text-info ring-info/15",
  success: "bg-emerald-tint text-emerald-deep ring-emerald/20",
  warning: "bg-warning-tint text-[#a8681a] ring-warning/25",
  danger: "bg-danger-tint text-danger ring-danger/20",
  navy: "bg-navy/8 text-navy ring-navy/15",
  amber: "bg-amber-tint text-[#93630f] ring-amber/30",
};

export function Badge({ tone = "neutral", dot = true, className, children }: { tone?: Tone; dot?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", toneClasses[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

/* ------------------------------ Avatar ------------------------------ */
const avatarPalette = ["bg-navy text-white", "bg-emerald text-white", "bg-amber text-navy", "bg-info text-white", "bg-navy-soft text-white"];

export function Avatar({ name, src, size = 36, className }: { name: string; src?: string; size?: number; className?: string }) {
  const color = avatarPalette[name.length % avatarPalette.length];
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold", color, className)}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
      aria-hidden={!src}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

/* ------------------------------ Checkbox ------------------------------ */
export function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer inline-flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border border-line-strong bg-white transition-colors data-[state=checked]:border-emerald data-[state=checked]:bg-emerald data-[state=checked]:text-white",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <Check className="size-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

/* ------------------------------ Switch ------------------------------ */
export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-line-strong transition-colors data-[state=checked]:bg-emerald disabled:opacity-50", className)}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
    </SwitchPrimitive.Root>
  );
}

/* ------------------------------ Tabs ------------------------------ */
export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn("inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-surface p-1 scrollbar-thin", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-[13px] font-semibold text-muted transition-colors hover:text-ink data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Content;

/* ------------------------------ Progress ------------------------------ */
export function Progress({ value, className, tone = "emerald" }: { value: number; className?: string; tone?: "emerald" | "navy" | "amber" }) {
  const bar = { emerald: "bg-emerald", navy: "bg-navy", amber: "bg-amber" }[tone];
  return (
    <ProgressPrimitive.Root value={value} className={cn("relative h-2 w-full overflow-hidden rounded-full bg-line", className)}>
      <ProgressPrimitive.Indicator className={cn("h-full rounded-full transition-all duration-500", bar)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </ProgressPrimitive.Root>
  );
}

/* ------------------------------ Skeleton / Separator ------------------------------ */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-line/80", className)} />;
}

export function Separator({ className, vertical }: { className?: string; vertical?: boolean }) {
  return <div role="separator" className={cn(vertical ? "w-px self-stretch bg-line" : "h-px w-full bg-line", className)} />;
}

/* ------------------------------ Description list ------------------------------ */
export function DetailRow({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 py-2.5 text-sm", className)}>
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-ink">{children}</dd>
    </div>
  );
}
