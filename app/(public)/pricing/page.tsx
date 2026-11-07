import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CtaBand, PageHero, Section, SectionHeading } from "@/components/marketing/sections";
import { PriceEstimator } from "@/components/marketing/price-estimator";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pricing" };

const PLANS = [
  {
    name: "Pay as you go",
    price: "From ₦1,500",
    note: "per delivery",
    description: "For individuals and occasional senders.",
    features: ["All delivery speeds", "Real-time tracking", "PIN-confirmed delivery", "Card, transfer and USSD payments"],
    cta: "Create free account",
    href: "/auth/register/customer",
  },
  {
    name: "Business",
    price: "Save up to 15%",
    note: "on volume above 100/month",
    description: "For stores, pharmacies and restaurants shipping daily.",
    features: ["Everything in Pay as you go", "Team logins and saved addresses", "Monthly invoicing with VAT", "Delivery reports and exports", "Priority support"],
    cta: "Talk to sales",
    href: "/contact",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    note: "dedicated fleet options",
    description: "For distributors and national brands.",
    features: ["Dedicated vans and trucks", "Intercity contracts", "API access (coming soon)", "Account manager and SLAs"],
    cta: "Contact us",
    href: "/contact",
  },
];

export default function PricingPage() {
  return (
    <>
      <PageHero eyebrow="Pricing" title="Clear prices, calculated in the open" description="Your price depends on distance, weight and how fast you need it. Try the estimator below. Every fee is shown before you pay." />
      <Section>
        <PriceEstimator />
      </Section>
      <Section tone="surface">
        <SectionHeading eyebrow="Plans" title="Choose how you want to ship" />
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.name} className={cn("flex flex-col rounded-2xl border p-7", p.featured ? "border-navy bg-navy text-white shadow-pop" : "border-line bg-white")}>
              {p.featured && <span className="mb-4 inline-flex w-fit rounded-full bg-amber px-2.5 py-0.5 text-xs font-bold text-navy">Most popular</span>}
              <h3 className={cn("text-lg font-bold", p.featured ? "text-white" : "text-navy")}>{p.name}</h3>
              <p className={cn("mt-1 text-sm", p.featured ? "text-white/65" : "text-muted")}>{p.description}</p>
              <p className="mt-6 text-3xl font-extrabold tracking-tight">{p.price}</p>
              <p className={cn("text-sm", p.featured ? "text-white/60" : "text-muted")}>{p.note}</p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" variant={p.featured ? "primary" : "secondary"} className="mt-8">
                <Link href={p.href}>{p.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </Section>
      <CtaBand />
    </>
  );
}
