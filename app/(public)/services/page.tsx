import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CtaBand, PageHero, Section, SectionHeading, ServiceGrid } from "@/components/marketing/sections";
import { VEHICLE_CATEGORIES } from "@/lib/constants";

export const metadata: Metadata = { title: "Services" };

export default function ServicesPage() {
  return (
    <>
      <PageHero eyebrow="Services" title="Six ways to move anything, anywhere in Nigeria" description="Whether it is one document across Lagos or a pallet from Kano to Port Harcourt, there is a SwiftLogix service built for it.">
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/auth/register">
              Book a delivery <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/pricing">See pricing</Link>
          </Button>
        </div>
      </PageHero>
      <Section>
        <ServiceGrid detailed />
      </Section>
      <Section tone="surface">
        <SectionHeading eyebrow="Our fleet" title="The right vehicle for every load" description="Riders and partner fleets cover everything from envelopes to full truckloads. We match your package to a vehicle that can carry it." />
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(VEHICLE_CATEGORIES).map(([key, v]) => (
            <div key={key} className="rounded-xl border border-line bg-white p-5 text-center">
              <p className="font-bold text-navy">{v.label}</p>
              <p className="mt-1 text-xs text-muted">Up to {v.capacityKg.toLocaleString()} kg</p>
            </div>
          ))}
        </div>
      </Section>
      <CtaBand />
    </>
  );
}
