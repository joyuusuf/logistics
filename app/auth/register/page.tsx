import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bike, Building2, Package } from "lucide-react";

export const metadata: Metadata = { title: "Create an account" };

const TYPES = [
  { href: "/auth/register/customer", icon: Package, title: "Customer", body: "Send packages and track deliveries for yourself or your business.", time: "1 minute" },
  { href: "/auth/register/rider", icon: Bike, title: "Rider", body: "Deliver with your motorcycle, tricycle, car or van and earn per delivery.", time: "5 minutes" },
  { href: "/auth/register/partner", icon: Building2, title: "Logistics company", body: "Bring your fleet and riders to receive and fulfil delivery requests.", time: "8 minutes" },
];

export default function RegisterChooserPage() {
  return (
    <div>
      <h1 className="text-[28px] font-extrabold tracking-tight text-navy">Create your account</h1>
      <p className="mt-1.5 text-sm text-muted">How will you use SwiftLogix?</p>
      <div className="mt-7 space-y-3">
        {TYPES.map((t) => (
          <Link key={t.href} href={t.href} className="group flex items-center gap-4 rounded-xl border border-line bg-white p-4 transition-all hover:border-emerald/50 hover:shadow-raised sm:p-5">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-navy text-white transition-colors group-hover:bg-emerald">
              <t.icon className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-navy">{t.title}</span>
              <span className="block text-sm text-muted">{t.body}</span>
              <span className="mt-1 block text-xs font-semibold text-emerald-deep">Takes about {t.time}</span>
            </span>
            <ArrowRight className="size-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-emerald" />
          </Link>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-emerald-deep hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
