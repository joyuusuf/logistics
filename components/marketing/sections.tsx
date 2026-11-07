"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, Check, ChevronDown, Mail, PackageSearch, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FAQS, HOW_IT_WORKS, SERVICES, TESTIMONIALS } from "./data";

export function Section({ id, className, children, tone = "white" }: { id?: string; className?: string; children: React.ReactNode; tone?: "white" | "surface" | "navy" }) {
  return (
    <section id={id} className={cn("py-16 sm:py-24", tone === "surface" && "bg-surface", tone === "navy" && "bg-navy text-white", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, description, align = "center", inverted }: { eyebrow?: string; title: string; description?: string; align?: "center" | "left"; inverted?: boolean }) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && <p className={cn("text-xs font-bold tracking-[0.16em] uppercase", inverted ? "text-amber" : "text-emerald-deep")}>{eyebrow}</p>}
      <h2 className={cn("mt-3 text-[28px] leading-tight font-extrabold tracking-[-0.025em] sm:text-4xl", inverted ? "text-white" : "text-navy")}>{title}</h2>
      {description && <p className={cn("mt-4 text-base leading-relaxed", inverted ? "text-white/70" : "text-muted")}>{description}</p>}
    </div>
  );
}

export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

export function ServiceGrid({ detailed }: { detailed?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {SERVICES.map((s, i) => (
        <Reveal key={s.id} delay={i * 0.05}>
          <div id={detailed ? s.id : undefined} className="group h-full scroll-mt-28 rounded-xl border border-line bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-emerald/40 hover:shadow-raised">
            <div className="flex items-start justify-between">
              <span className="inline-flex size-11 items-center justify-center rounded-lg bg-navy text-white transition-colors group-hover:bg-emerald">
                <s.icon className="size-5" />
              </span>
              <span className="text-xs font-semibold text-muted">
                From <span className="text-navy">{s.from}</span>
              </span>
            </div>
            <h3 className="mt-5 text-lg font-bold text-navy">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.summary}</p>
            {detailed && (
              <ul className="mt-4 space-y-2">
                {s.details.map((d) => (
                  <li key={d} className="flex items-center gap-2 text-sm text-ink-soft">
                    <Check className="size-4 text-emerald" />
                    {d}
                  </li>
                ))}
              </ul>
            )}
            <Link href="/auth/register" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-emerald-deep">
              Book now <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export function HowItWorksSteps() {
  return (
    <ol className="relative grid gap-6 lg:grid-cols-5 lg:gap-4">
      <span className="absolute top-6 right-[10%] left-[10%] hidden h-0.5 bg-gradient-to-r from-navy/10 via-emerald/50 to-navy/10 lg:block" aria-hidden />
      {HOW_IT_WORKS.map((step, i) => (
        <Reveal key={step.title} delay={i * 0.06}>
          <li className="relative flex gap-4 lg:flex-col lg:items-center lg:text-center">
            <span className={cn("relative z-10 inline-flex size-12 shrink-0 items-center justify-center rounded-full text-base font-extrabold ring-8 ring-white", i === 4 ? "bg-emerald text-white" : "bg-navy text-white")}>{i + 1}</span>
            <div>
              <h3 className="text-base font-bold text-navy lg:mt-4">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
            </div>
          </li>
        </Reveal>
      ))}
    </ol>
  );
}

export function TrackForm({ size = "md", className, inverted }: { size?: "md" | "lg"; className?: string; inverted?: boolean }) {
  const router = useRouter();
  const [ref, setRef] = React.useState("");
  const [error, setError] = React.useState<string>();
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const value = ref.trim().toUpperCase();
        if (!/^SLX-[A-Z0-9]{6}$/.test(value)) {
          setError("Enter a reference like SLX-7K4QPM");
          return;
        }
        router.push(`/track?ref=${encodeURIComponent(value)}`);
      }}
    >
      <div className={cn("flex flex-col gap-2 sm:flex-row", size === "lg" && "sm:gap-3")}>
        <div className="relative flex-1">
          <PackageSearch className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" />
          <Input
            value={ref}
            onChange={(e) => {
              setRef(e.target.value);
              setError(undefined);
            }}
            placeholder="Enter tracking number, e.g. SLX-7K4QPM"
            className={cn("pl-11 uppercase placeholder:normal-case", size === "lg" ? "h-13 text-base" : "h-12")}
            aria-label="Tracking number"
            aria-invalid={!!error}
          />
        </div>
        <Button type="submit" size="lg" className={cn(size === "lg" && "h-13 px-7")}>
          Track shipment
        </Button>
      </div>
      {error && <p className={cn("mt-2 text-sm font-medium", inverted ? "text-amber" : "text-danger")}>{error}</p>}
    </form>
  );
}

export function Testimonials() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {TESTIMONIALS.map((t, i) => (
        <Reveal key={t.name} delay={i * 0.06}>
          <figure className="flex h-full flex-col rounded-xl border border-line bg-white p-6">
            <Quote className="size-7 text-emerald/40" />
            <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-ink">“{t.quote}”</blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
                {t.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(-2)
                  .join("")}
              </span>
              <span>
                <span className="block text-sm font-bold text-navy">{t.name}</span>
                <span className="block text-xs text-muted">
                  {t.role} · {t.city}
                </span>
              </span>
            </figcaption>
          </figure>
        </Reveal>
      ))}
    </div>
  );
}

export function FaqList() {
  const [open, setOpen] = React.useState<number | null>(0);
  return (
    <div className="divide-y divide-line rounded-xl border border-line bg-white">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q}>
            <h3>
              <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold text-navy sm:px-6">
                {f.q}
                <ChevronDown className={cn("size-5 shrink-0 text-muted transition-transform", isOpen && "rotate-180 text-emerald")} />
              </button>
            </h3>
            {isOpen && <p className="-mt-1 px-5 pb-5 text-sm leading-relaxed text-muted sm:px-6">{f.a}</p>}
          </div>
        );
      })}
    </div>
  );
}

export function Newsletter() {
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  return (
    <div className="grid items-center gap-8 rounded-2xl border border-line bg-surface p-6 sm:p-10 lg:grid-cols-2">
      <div>
        <span className="inline-flex size-11 items-center justify-center rounded-lg bg-emerald-tint text-emerald-deep">
          <Mail className="size-5" />
        </span>
        <h3 className="mt-4 text-2xl font-extrabold tracking-tight text-navy">Logistics tips, straight to your inbox</h3>
        <p className="mt-2 text-sm text-muted">A short monthly note on new routes, pricing updates and practical advice for growing businesses. No spam.</p>
      </div>
      {done ? (
        <p className="flex items-center gap-2 rounded-lg bg-white p-4 text-sm font-semibold text-emerald-deep ring-1 ring-line">
          <Check className="size-5" /> You are subscribed. Check {email} for a welcome note.
        </p>
      ) : (
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!/^\S+@\S+\.\S+$/.test(email)) {
              toast.error("Enter a valid email address");
              return;
            }
            setBusy(true);
            await new Promise((r) => setTimeout(r, 600));
            setBusy(false);
            setDone(true);
            toast.success("Subscribed (demo)");
          }}
        >
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="h-12 bg-white" aria-label="Email address" />
          <Button type="submit" size="lg" loading={busy}>
            Subscribe
          </Button>
        </form>
      )}
    </div>
  );
}

export function CtaBand({ title = "Ready to move what matters?", description = "Create a free account and book your first delivery in under two minutes." }: { title?: string; description?: string }) {
  return (
    <Section>
      <div className="relative overflow-hidden rounded-2xl bg-navy px-6 py-12 sm:px-12 sm:py-16">
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-emerald/20 blur-3xl" aria-hidden />
        <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{title}</h2>
            <p className="mt-3 text-white/70">{description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/auth/register">
                Get Started <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="light">
              <Link href="/contact">Talk to sales</Link>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}

export function PageHero({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-surface">
      <div className="absolute inset-0 map-grid opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <p className="text-xs font-bold tracking-[0.16em] text-emerald-deep uppercase">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl leading-[1.08] font-extrabold tracking-[-0.03em] text-navy sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{description}</p>
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
