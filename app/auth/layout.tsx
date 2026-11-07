import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/branding/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] xl:grid-cols-[520px_1fr]">
      <aside className="relative hidden overflow-hidden bg-navy p-10 text-white lg:flex lg:flex-col">
        <div className="absolute inset-0 opacity-[0.06] map-grid" aria-hidden />
        <div className="absolute -right-28 -bottom-28 size-96 rounded-full bg-emerald/25 blur-3xl" aria-hidden />
        <div className="relative">
          <Logo variant="white" showTagline />
        </div>
        <div className="relative mt-auto">
          <h2 className="text-3xl leading-tight font-extrabold tracking-tight">Smart Logistics. Seamless Deliveries.</h2>
          <p className="mt-4 max-w-sm text-white/70">One account to book, track and manage deliveries across Nigeria, whether you send, ride or run a fleet.</p>
          <ul className="mt-8 space-y-3">
            {["Verified riders and PIN-confirmed drop-offs", "Transparent pricing before you pay", "Live status from pickup to doorstep"].map((t) => (
              <li key={t} className="flex items-center gap-3 text-sm text-white/85">
                <CheckCircle2 className="size-5 text-emerald" /> {t}
              </li>
            ))}
          </ul>
          <figure className="mt-12 rounded-xl border border-white/10 bg-white/5 p-5">
            <blockquote className="text-sm leading-relaxed text-white/85">“Same-day completion went from about 70% to almost every order. Customers stopped calling to ask where things are.”</blockquote>
            <figcaption className="mt-3 text-xs text-white/55">Ifeoma N. · Founder, Ìfé Skincare, Lagos</figcaption>
          </figure>
        </div>
      </aside>
      <div className="flex flex-col">
        <header className="flex h-16 items-center justify-between px-5 sm:px-8 lg:justify-end">
          <span className="lg:hidden">
            <Logo size="sm" />
          </span>
          <Link href="/" className="text-sm font-semibold text-muted hover:text-ink">
            Back to website
          </Link>
        </header>
        <main className="flex flex-1 items-start justify-center px-5 pt-4 pb-16 sm:px-8 lg:items-center">
          <div className="w-full max-w-[560px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
