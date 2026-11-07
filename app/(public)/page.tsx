import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bike,
  Building2,
  Check,
  FileText,
  Headphones,
  MapPinned,
  Navigation,
  Receipt,
  ShieldCheck,
  Timer,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { CtaBand, FaqList, HowItWorksSteps, Newsletter, Reveal, Section, SectionHeading, ServiceGrid, Testimonials, TrackForm } from "@/components/marketing/sections";
import { STATS } from "@/components/marketing/data";

const TRUST = [
  { icon: Zap, title: "Fast delivery", body: "Riders dispatched in minutes" },
  { icon: ShieldCheck, title: "Secure handling", body: "Verified riders, PIN drop-offs" },
  { icon: Navigation, title: "Real-time tracking", body: "Every status, every step" },
  { icon: Headphones, title: "Reliable support", body: "Humans on call, 7am to 10pm" },
];

const WHY = [
  { icon: ShieldCheck, title: "Every rider is verified", body: "Licence, NIN and vehicle papers are reviewed before a rider can accept a single job." },
  { icon: Receipt, title: "Transparent pricing", body: "See the exact breakdown of distance, weight and speed before you pay. No surprises at drop-off." },
  { icon: MapPinned, title: "Built for Nigerian roads", body: "Landmark-based addresses, LGA-level routing and riders who know the shortcuts." },
  { icon: Timer, title: "On time, or we make it right", body: "If a guaranteed delivery runs late, we credit your account automatically." },
];

const BUSINESS = [
  { icon: Users, title: "Team accounts", body: "Give staff access with their own logins and keep every booking under one company." },
  { icon: FileText, title: "Monthly invoicing", body: "Consolidated invoices with VAT, ready for your accountant." },
  { icon: BarChart3, title: "Delivery analytics", body: "Spend, volume and success rates across branches and time periods." },
  { icon: Truck, title: "Fleet on demand", body: "From a single bike to a 10-tonne truck, without owning a single vehicle." },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-y-0 right-0 hidden w-[44%] bg-surface lg:block" aria-hidden />
        <div className="absolute inset-y-0 right-0 hidden w-[44%] map-grid opacity-70 lg:block" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:px-8 lg:pt-20 lg:pb-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink-soft shadow-card">
              <span className="size-1.5 rounded-full bg-emerald" /> Now delivering in Lagos, Ibadan, Abuja, Port Harcourt and Kano
            </span>
            <h1 className="mt-6 text-[40px] leading-[1.04] font-extrabold tracking-[-0.035em] text-navy sm:text-6xl">
              Move What Matters, <span className="text-emerald">Effortlessly.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">Book deliveries, track shipments in real time and enjoy seamless logistics services across Nigeria.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="px-7">
                <Link href="/auth/register">
                  Get Started <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/services">Explore Our Services</Link>
              </Button>
            </div>
            <dl className="mt-12 grid max-w-xl grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label}>
                  <dt className="text-xs whitespace-nowrap text-muted">{s.label}</dt>
                  <dd className="text-xl font-extrabold text-navy tabular">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="px-2 sm:px-8 lg:px-0">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-line px-4 sm:px-6 lg:grid-cols-4 lg:divide-x lg:px-8">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-center gap-3 py-6 lg:justify-center lg:px-4">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-tint text-emerald-deep">
                <t.icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-navy">{t.title}</p>
                <p className="text-xs text-muted">{t.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <Section tone="surface">
        <SectionHeading eyebrow="Our services" title="Delivery options for every kind of package" description="From one urgent document to a van full of stock, choose the speed and vehicle that fits." />
        <div className="mt-12">
          <ServiceGrid />
        </div>
      </Section>

      {/* How it works */}
      <Section>
        <SectionHeading eyebrow="How it works" title="Five simple steps from booking to doorstep" />
        <div className="mt-14">
          <HowItWorksSteps />
        </div>
      </Section>

      {/* Why choose */}
      <Section tone="surface">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading align="left" eyebrow="Why SwiftLogix" title="Logistics you can actually rely on" description="We built SwiftLogix around the problems Nigerian businesses and individuals face every day: unreliable riders, unclear pricing and no proof of delivery." />
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {WHY.map((w) => (
                <Reveal key={w.title}>
                  <w.icon className="size-6 text-emerald" />
                  <h3 className="mt-3 font-bold text-navy">{w.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{w.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
          <Reveal>
            <div className="rounded-2xl border border-line bg-white p-6 shadow-raised sm:p-8">
              <p className="text-sm font-bold text-navy">This month across SwiftLogix</p>
              <div className="mt-6 space-y-5">
                {[
                  { label: "Deliveries completed on time", value: 98.4 },
                  { label: "Riders rated 4.5 stars or higher", value: 91 },
                  { label: "Support tickets resolved within 2 hours", value: 87 },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-soft">{m.label}</span>
                      <span className="font-bold text-navy tabular">{m.value}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-line">
                      <div className="h-full rounded-full bg-emerald" style={{ width: `${m.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3 border-t border-line pt-6 text-center">
                {[
                  { v: "26 min", l: "Avg. pickup time" },
                  { v: "4.8★", l: "Customer rating" },
                  { v: "₦0", l: "Hidden fees" },
                ].map((x) => (
                  <div key={x.l}>
                    <p className="text-lg font-extrabold text-navy">{x.v}</p>
                    <p className="text-xs text-muted">{x.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Businesses */}
      <Section tone="navy">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <SectionHeading align="left" inverted eyebrow="For businesses" title="Ship more without hiring a dispatch team" description="E-commerce stores, pharmacies, restaurants and distributors use SwiftLogix to run deliveries at scale." />
            <Button asChild size="lg" variant="amber" className="mt-8">
              <Link href="/contact">
                Talk to our business team <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {BUSINESS.map((b, i) => (
              <Reveal key={b.title} delay={i * 0.05}>
                <div className="h-full rounded-xl border border-white/10 bg-white/5 p-6">
                  <b.icon className="size-6 text-emerald" />
                  <h3 className="mt-4 font-bold text-white">{b.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/65">{b.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* Partner + rider */}
      <Section>
        <div className="grid gap-5 lg:grid-cols-2">
          {[
            {
              icon: Building2,
              eyebrow: "Become a delivery partner",
              title: "Put your fleet to work",
              body: "Logistics companies get a steady flow of delivery requests, tools to manage vehicles and riders, and weekly settlements.",
              points: ["Fleet and rider management", "Assign jobs to your own riders", "Weekly payouts and analytics"],
              href: "/auth/register/partner",
              cta: "Register your company",
              dark: true,
            },
            {
              icon: Bike,
              eyebrow: "Become a rider",
              title: "Earn on your own schedule",
              body: "Go online when it suits you, accept jobs near you and keep 70% of every delivery fee. Cash out to any Nigerian bank.",
              points: ["Flexible hours", "Transparent earnings per job", "Fast payouts"],
              href: "/auth/register/rider",
              cta: "Apply to ride",
              dark: false,
            },
          ].map((c) => (
            <Reveal key={c.title}>
              <div className={c.dark ? "h-full rounded-2xl bg-navy-deep p-8 text-white sm:p-10" : "h-full rounded-2xl border border-emerald/30 bg-emerald-tint/50 p-8 sm:p-10"}>
                <span className={c.dark ? "inline-flex size-12 items-center justify-center rounded-xl bg-white/10 text-emerald" : "inline-flex size-12 items-center justify-center rounded-xl bg-emerald text-white"}>
                  <c.icon className="size-6" />
                </span>
                <p className={c.dark ? "mt-6 text-xs font-bold tracking-[0.16em] text-amber uppercase" : "mt-6 text-xs font-bold tracking-[0.16em] text-emerald-deep uppercase"}>{c.eyebrow}</p>
                <h3 className={c.dark ? "mt-2 text-2xl font-extrabold" : "mt-2 text-2xl font-extrabold text-navy"}>{c.title}</h3>
                <p className={c.dark ? "mt-3 text-white/70" : "mt-3 text-muted"}>{c.body}</p>
                <ul className="mt-6 space-y-2">
                  {c.points.map((p) => (
                    <li key={p} className={c.dark ? "flex items-center gap-2 text-sm text-white/85" : "flex items-center gap-2 text-sm text-ink"}>
                      <Check className="size-4 text-emerald" /> {p}
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg" variant={c.dark ? "primary" : "navy"} className="mt-8">
                  <Link href={c.href}>
                    {c.cta} <ArrowRight />
                  </Link>
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Tracking CTA */}
      <Section tone="surface">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-xl bg-navy text-white">
            <Navigation className="size-6" />
          </span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">Where is my package?</h2>
          <p className="mt-3 text-muted">Enter the tracking number from your confirmation message to see its live status. No account needed.</p>
          <TrackForm size="lg" className="mt-8 text-left" />
        </div>
      </Section>

      {/* Testimonials */}
      <Section>
        <SectionHeading eyebrow="Testimonials" title="Trusted by businesses across Nigeria" />
        <div className="mt-12">
          <Testimonials />
        </div>
      </Section>

      {/* FAQ */}
      <Section tone="surface">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <SectionHeading align="left" eyebrow="FAQs" title="Questions, answered" description="Can't find what you're looking for? Our support team is one message away." />
            <Button asChild variant="secondary" className="mt-6">
              <Link href="/contact">Contact support</Link>
            </Button>
          </div>
          <FaqList />
        </div>
      </Section>

      {/* Newsletter */}
      <Section>
        <Newsletter />
      </Section>

      <CtaBand />
    </>
  );
}
