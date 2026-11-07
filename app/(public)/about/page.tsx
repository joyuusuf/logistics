import type { Metadata } from "next";
import { Compass, HeartHandshake, Lightbulb, ShieldCheck } from "lucide-react";
import { CtaBand, PageHero, Reveal, Section, SectionHeading } from "@/components/marketing/sections";
import { STATS } from "@/components/marketing/data";

export const metadata: Metadata = { title: "About Us" };

const VALUES = [
  { icon: ShieldCheck, title: "Trust first", body: "Verified riders, PIN-confirmed deliveries and clear records for every package we touch." },
  { icon: Compass, title: "Local by design", body: "Landmarks, LGAs and real traffic patterns shape how we route, price and promise." },
  { icon: HeartHandshake, title: "Fair to riders", body: "Riders keep the majority of every fee and see exactly what each job pays before accepting." },
  { icon: Lightbulb, title: "Simple to use", body: "Booking a delivery should take less time than calling a dispatch rider." },
];

const MILESTONES = [
  { year: "2023", text: "Started as a dispatch desk for three Lagos e-commerce stores, with 12 riders." },
  { year: "2024", text: "Launched the customer app and PIN-confirmed delivery. Expanded to Ibadan and Abuja." },
  { year: "2025", text: "Opened the platform to logistics companies. Partner fleets now carry over 40% of volume." },
  { year: "2026", text: "Intercity delivery across 37 states and the FCT, with business accounts for SMEs." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About SwiftLogix"
        title="We are building the delivery network Nigeria deserves"
        description="SwiftLogix connects people and businesses who need things moved with the riders and logistics companies who move them, on one transparent platform."
      />
      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading align="left" eyebrow="Our story" title="From a dispatch desk to a national platform" />
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                SwiftLogix began in Ikeja with a simple frustration: small businesses were losing customers because deliveries were late, untracked and impossible to verify. Calling five dispatch riders to move one parcel was normal.
              </p>
              <p>
                We started by coordinating a handful of riders for local online stores. Every problem we fixed for them, from vague addresses to disputed deliveries, became a feature in the platform you see today.
              </p>
              <p>Today, customers, riders, fleet operators and our own operations team all work from the same source of truth, so everyone knows where every package is.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 self-start">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-xl border border-line bg-surface p-6">
                <p className="text-3xl font-extrabold text-navy tabular">{s.value}</p>
                <p className="mt-1 text-sm text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>
      <Section tone="surface">
        <SectionHeading eyebrow="What we value" title="The principles behind every delivery" />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.05}>
              <div className="h-full rounded-xl border border-line bg-white p-6">
                <v.icon className="size-6 text-emerald" />
                <h3 className="mt-4 font-bold text-navy">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{v.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>
      <Section>
        <SectionHeading eyebrow="Milestones" title="How we got here" />
        <ol className="mx-auto mt-12 max-w-2xl space-y-0">
          {MILESTONES.map((m, i) => (
            <li key={m.year} className="relative flex gap-6 pb-10 last:pb-0">
              {i < MILESTONES.length - 1 && <span className="absolute top-10 bottom-0 left-[27px] w-0.5 bg-line" />}
              <span className="relative z-10 inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-extrabold text-white">{m.year}</span>
              <p className="pt-4 text-[15px] leading-relaxed text-ink-soft">{m.text}</p>
            </li>
          ))}
        </ol>
      </Section>
      <CtaBand title="Join us in moving Nigeria forward" description="Ship with us, ride with us or bring your fleet. There is room for everyone on SwiftLogix." />
    </>
  );
}
