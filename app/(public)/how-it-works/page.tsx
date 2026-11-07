import type { Metadata } from "next";
import { Bike, Building2, Package, ShieldCheck } from "lucide-react";
import { CtaBand, FaqList, HowItWorksSteps, PageHero, Section, SectionHeading } from "@/components/marketing/sections";

export const metadata: Metadata = { title: "How It Works" };

const ROLES = [
  {
    icon: Package,
    title: "For customers",
    steps: ["Book with pickup, drop-off and package details", "Pay securely and get a shipment reference", "Share the delivery PIN with your recipient", "Track every step until it is delivered"],
  },
  {
    icon: Bike,
    title: "For riders",
    steps: ["Apply and upload your documents", "Go online and accept jobs near you", "Pick up, deliver and collect the recipient's PIN", "Withdraw your earnings to your bank"],
  },
  {
    icon: Building2,
    title: "For logistics partners",
    steps: ["Register your company with CAC details", "Add vehicles and riders to your fleet", "Accept delivery requests in your coverage area", "Assign riders and receive weekly settlements"],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero eyebrow="How it works" title="Simple for you. Accountable at every step." description="Here is exactly what happens between the moment you book and the moment your package is handed over." />
      <Section>
        <HowItWorksSteps />
      </Section>
      <Section tone="surface">
        <SectionHeading eyebrow="One platform, three sides" title="Everyone sees the same truth" />
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {ROLES.map((r) => (
            <div key={r.title} className="rounded-xl border border-line bg-white p-6">
              <span className="inline-flex size-11 items-center justify-center rounded-lg bg-navy text-white">
                <r.icon className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-navy">{r.title}</h3>
              <ol className="mt-4 space-y-3">
                {r.steps.map((s, i) => (
                  <li key={s} className="flex gap-3 text-sm text-ink-soft">
                    <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-tint text-xs font-bold text-emerald-deep">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </Section>
      <Section>
        <div className="grid items-center gap-10 rounded-2xl bg-navy p-8 text-white sm:p-12 lg:grid-cols-2">
          <div>
            <ShieldCheck className="size-10 text-emerald" />
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight">PIN-confirmed delivery</h2>
            <p className="mt-3 text-white/70">
              Every booking generates a private four-digit PIN. Riders cannot complete a delivery until the recipient shares the correct code, so every handover is verified and recorded.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            {["4", "8", "2", "7"].map((d, i) => (
              <span key={i} className="inline-flex size-16 items-center justify-center rounded-xl bg-white text-3xl font-extrabold text-navy shadow-pop sm:size-20">
                {d}
              </span>
            ))}
          </div>
        </div>
      </Section>
      <Section tone="surface">
        <div className="mx-auto max-w-3xl">
          <SectionHeading eyebrow="FAQs" title="Common questions" />
          <div className="mt-10">
            <FaqList />
          </div>
        </div>
      </Section>
      <CtaBand />
    </>
  );
}
