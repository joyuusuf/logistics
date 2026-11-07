import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHero, Section } from "@/components/marketing/sections";
import { ContactForm } from "@/components/marketing/contact-form";

export const metadata: Metadata = { title: "Contact" };

const OFFICES = [
  { city: "Lagos (HQ)", address: "14 Allen Avenue, Ikeja, Lagos" },
  { city: "Ibadan", address: "18 Bodija Market Road, Bodija, Ibadan" },
  { city: "Abuja", address: "12 Aminu Kano Crescent, Wuse 2, Abuja" },
];

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact" title="We are here to help" description="Questions about a delivery, a business account or partnering with us? Send a message and the right team will get back to you within one business day." />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-6">
            {[
              { icon: Phone, label: "Phone", value: "+234 700 794 3856" },
              { icon: Mail, label: "Email", value: "hello@swiftlogix.ng" },
              { icon: Clock, label: "Support hours", value: "Monday to Saturday, 7am to 10pm WAT" },
            ].map((c) => (
              <div key={c.label} className="flex gap-4">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-tint text-emerald-deep">
                  <c.icon className="size-5" />
                </span>
                <div>
                  <p className="text-sm text-muted">{c.label}</p>
                  <p className="font-semibold text-navy">{c.value}</p>
                </div>
              </div>
            ))}
            <div className="rounded-xl border border-line bg-surface p-5">
              <p className="text-sm font-bold text-navy">Our offices</p>
              <ul className="mt-3 space-y-3">
                {OFFICES.map((o) => (
                  <li key={o.city} className="flex gap-3 text-sm">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-emerald" />
                    <span>
                      <span className="block font-semibold text-ink">{o.city}</span>
                      <span className="text-muted">{o.address}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <ContactForm />
        </div>
      </Section>
    </>
  );
}
