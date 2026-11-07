"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Mail, MapPin, Menu, Phone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/branding/logo";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/overlays";
import { PUBLIC_NAV } from "@/components/navigation/config";
import { useAuth } from "@/hooks/use-auth";
import { useHydrated } from "@/hooks/use-hydrated";

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const hydrated = useHydrated();
  const { user } = useAuth();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  React.useEffect(() => setOpen(false), [pathname]);

  const nav = PUBLIC_NAV.filter((n) => n.label !== "How It Works");

  return (
    <header className={cn("sticky top-0 z-40 transition-all", scrolled ? "border-b border-line bg-white/90 backdrop-blur" : "bg-white")}>
      <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {nav.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={cn("rounded-md px-3 py-2 text-sm font-semibold transition-colors", active ? "text-navy" : "text-ink-soft hover:text-navy")}>
                {n.label}
                {active && <span className="mx-auto mt-0.5 block h-0.5 w-4 rounded-full bg-emerald" />}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          {hydrated && user ? (
            <Button asChild>
              <Link href={`/${user.role}`}>
                Go to dashboard <ArrowRight />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>
        <button type="button" className="ml-auto rounded-md p-2 text-ink lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="size-6" />
        </button>
      </div>
      <Sheet open={open} onOpenChange={setOpen} side="right" title="Menu" className="max-w-[340px] bg-white">
        <div className="flex h-[68px] items-center justify-between border-b border-line px-5">
          <Logo size="sm" />
          <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1.5 text-muted" aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4" aria-label="Mobile">
          {PUBLIC_NAV.map((n) => (
            <Link key={n.href} href={n.href} className={cn("rounded-lg px-3 py-3 text-[15px] font-semibold", pathname === n.href ? "bg-emerald-tint text-emerald-deep" : "text-ink hover:bg-surface")}>
              {n.label}
            </Link>
          ))}
          <Link href="/contact" className="rounded-lg px-3 py-3 text-[15px] font-semibold text-ink hover:bg-surface">
            Contact
          </Link>
        </nav>
        <div className="space-y-2 border-t border-line p-4">
          {hydrated && user ? (
            <Button asChild className="w-full" size="lg">
              <Link href={`/${user.role}`}>Go to dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild className="w-full" size="lg">
                <Link href="/auth/register">Get Started</Link>
              </Button>
              <Button asChild variant="secondary" className="w-full" size="lg">
                <Link href="/auth/login">Login</Link>
              </Button>
            </>
          )}
        </div>
      </Sheet>
    </header>
  );
}

const FOOTER_LINKS = [
  {
    title: "Services",
    links: [
      { label: "Same-day delivery", href: "/services#same-day" },
      { label: "Express delivery", href: "/services#express" },
      { label: "Business logistics", href: "/services#business" },
      { label: "Intercity delivery", href: "/services#intercity" },
      { label: "Bulk shipments", href: "/services#bulk" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Pricing", href: "/pricing" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Get involved",
    links: [
      { label: "Become a rider", href: "/auth/register/rider" },
      { label: "Become a partner", href: "/auth/register/partner" },
      { label: "Track a shipment", href: "/track" },
      { label: "Login", href: "/auth/login" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="bg-navy-deep text-white">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Logo variant="white" showTagline />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
              SwiftLogix connects customers, riders and logistics companies on one platform to book, move and track deliveries across Nigeria.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-white/70">
              <li className="flex items-center gap-2.5">
                <MapPin className="size-4 text-emerald" /> 14 Allen Avenue, Ikeja, Lagos
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 text-emerald" /> +234 700 794 3856
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 text-emerald" /> hello@swiftlogix.ng
              </li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {FOOTER_LINKS.map((col) => (
              <div key={col.title}>
                <p className="text-xs font-bold tracking-[0.12em] text-white/40 uppercase">{col.title}</p>
                <ul className="mt-4 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-sm text-white/75 hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col-reverse items-start justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-white/45">© {new Date().getFullYear()} SwiftLogix Technologies Ltd. Frontend demonstration build.</p>
          <div className="flex items-center gap-2">
            {[
              { short: "X", label: "X (Twitter)" },
              { short: "IG", label: "Instagram" },
              { short: "in", label: "LinkedIn" },
              { short: "f", label: "Facebook" },
            ].map((s) => (
              <a key={s.label} href="#" onClick={(e) => e.preventDefault()} className="inline-flex size-9 items-center justify-center rounded-full bg-white/5 text-xs font-bold text-white/60 hover:bg-white/10 hover:text-white" aria-label={`${s.label} (demo link)`}>
                {s.short}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
