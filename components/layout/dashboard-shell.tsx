"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bell,
  CheckCheck,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Menu,
  Package,
  RefreshCw,
  Search,
  Settings,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import type { Role } from "@/types";
import { cn, formatRelative } from "@/lib/utils";
import { NAVIGATION, ROLE_LABEL, type NavItem } from "@/components/navigation/config";
import { Logo, LogoMark } from "@/components/branding/logo";
import { Avatar, Badge } from "@/components/ui/primitives";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, Popover, PopoverContent, PopoverTrigger, Sheet } from "@/components/ui/overlays";
import { PageSkeleton } from "@/components/shared";
import { useHydrated } from "@/hooks/use-hydrated";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { useStore } from "@/lib/services/store";
import { RIDER_AVAILABILITY } from "@/lib/constants";
import type { RiderAvailability } from "@/types";

const SHIPMENT_PATH: Record<Role, string> = {
  customer: "/customer/shipments",
  rider: "/rider/deliveries",
  partner: "/partner/deliveries",
  admin: "/admin/deliveries",
};

function isActivePath(pathname: string, href: string, role: Role) {
  if (href === `/${role}`) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* ------------------------------ Sidebar ------------------------------ */
function SidebarNav({ role, collapsed, onNavigate }: { role: Role; collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 scrollbar-thin" aria-label={`${ROLE_LABEL[role]} navigation`}>
      {NAVIGATION[role].map((section, si) => (
        <div key={si}>
          {section.title && !collapsed && <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-[0.08em] text-white/40 uppercase">{section.title}</p>}
          {section.title && collapsed && <div className="mx-3 mb-2 h-px bg-white/10" />}
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActivePath(pathname, item.href, role);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex h-10 items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium transition-colors",
                      active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    {active && <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full bg-emerald" />}
                    <item.icon className={cn("size-[18px] shrink-0", active ? "text-emerald" : "text-white/55 group-hover:text-white/80")} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className={cn("border-t border-white/10 p-3", collapsed && "flex justify-center")}>
      <div className={cn("flex items-center gap-3 rounded-lg bg-white/5 p-2.5", collapsed && "bg-transparent p-0")}>
        <Avatar name={user.name} src={user.avatarUrl} size={34} />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-white/50">{ROLE_LABEL[user.role]}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Search ------------------------------ */
function GlobalSearch({ role, userId, riderId, partnerId }: { role: Role; userId: string; riderId?: string; partnerId?: string }) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const shipments = useStore((s) => s.shipments);
  const users = useStore((s) => s.users);
  const riders = useStore((s) => s.riders);
  const partners = useStore((s) => s.partners);

  const results = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    const scoped = shipments.filter((s) => {
      if (role === "customer") return s.customerId === userId;
      if (role === "rider") return s.riderId === riderId;
      if (role === "partner") return s.partnerId === partnerId;
      return true;
    });
    const out: { id: string; label: string; sub: string; href: string; kind: "shipment" | "person" }[] = scoped
      .filter((s) => s.reference.toLowerCase().includes(term) || s.recipient.name.toLowerCase().includes(term) || s.recipient.lga.toLowerCase().includes(term))
      .slice(0, 6)
      .map((s) => ({ id: s.id, label: s.reference, sub: `${s.recipient.name} · ${s.recipient.lga}`, href: `${SHIPMENT_PATH[role]}/${s.id}`, kind: "shipment" }));
    if (role === "admin") {
      users
        .filter((u) => u.role === "customer" && (u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)))
        .slice(0, 3)
        .forEach((u) => out.push({ id: u.id, label: u.name, sub: `Customer · ${u.email}`, href: `/admin/customers/${u.id}`, kind: "person" }));
      riders
        .filter((r) => r.name.toLowerCase().includes(term))
        .slice(0, 3)
        .forEach((r) => out.push({ id: r.id, label: r.name, sub: `Rider · ${r.state}`, href: `/admin/riders/${r.id}`, kind: "person" }));
      partners
        .filter((p) => p.companyName.toLowerCase().includes(term))
        .slice(0, 3)
        .forEach((p) => out.push({ id: p.id, label: p.companyName, sub: "Logistics partner", href: `/admin/partners/${p.id}`, kind: "person" }));
    }
    if (role === "partner") {
      riders
        .filter((r) => r.partnerId === partnerId && r.name.toLowerCase().includes(term))
        .slice(0, 3)
        .forEach((r) => out.push({ id: r.id, label: r.name, sub: "Rider in your fleet", href: `/partner/riders?q=${encodeURIComponent(r.name)}`, kind: "person" }));
    }
    return out;
  }, [q, shipments, users, riders, partners, role, userId, riderId, partnerId]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  return (
    <Popover open={open && q.trim().length >= 2} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) go(results[0].href);
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder={role === "admin" ? "Search shipments, customers, riders…" : "Search by shipment reference or recipient"}
            className="h-9 border-line bg-surface pl-9"
            aria-label="Search"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-1.5" onOpenAutoFocus={(e) => e.preventDefault()}>
        {results.length === 0 ? (
          <p className="px-3 py-6 text-center text-[13px] text-muted">No results for “{q}”</p>
        ) : (
          <ul>
            {results.map((r) => (
              <li key={r.kind + r.id}>
                <button type="button" onClick={() => go(r.href)} className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left hover:bg-surface">
                  <span className="inline-flex size-8 items-center justify-center rounded-md bg-surface text-navy">{r.kind === "shipment" ? <Package className="size-4" /> : <Users className="size-4" />}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-ink">{r.label}</span>
                    <span className="block truncate text-xs text-muted">{r.sub}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------ Notifications ------------------------------ */
function NotificationBell({ role }: { role: Role }) {
  const router = useRouter();
  const { items, unread, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="relative inline-flex size-9 items-center justify-center rounded-lg text-ink-soft hover:bg-surface hover:text-ink" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <Bell className="size-[18px]" />
          {unread > 0 && <span className="absolute top-1 right-1 inline-flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-white">{unread > 9 ? "9+" : unread}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(92vw,380px)] p-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-sm font-bold text-ink">Notifications</p>
          {unread > 0 && (
            <button type="button" onClick={() => markAllRead()} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-deep hover:underline">
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          )}
        </div>
        <ul className="max-h-[360px] divide-y divide-line overflow-y-auto scrollbar-thin">
          {items.length === 0 && <li className="px-4 py-10 text-center text-[13px] text-muted">You are all caught up.</li>}
          {items.slice(0, 8).map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => {
                  markRead(n.id);
                  if (n.href) {
                    setOpen(false);
                    router.push(n.href);
                  }
                }}
                className={cn("flex w-full gap-3 px-4 py-3 text-left hover:bg-surface", !n.read && "bg-emerald-tint/30")}
              >
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-emerald")} />
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-ink">{n.title}</span>
                  <span className="line-clamp-2 block text-xs text-muted">{n.body}</span>
                  <span className="mt-1 block text-[11px] text-muted/80">{formatRelative(n.createdAt)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-line p-2">
          <Link href={`/${role}/notifications`} onClick={() => setOpen(false)} className="block rounded-md py-2 text-center text-[13px] font-semibold text-navy hover:bg-surface">
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------ Rider availability ------------------------------ */
export function AvailabilityControl({ compact }: { compact?: boolean }) {
  const { rider } = useAuth();
  const setAvailability = useStore((s) => s.setAvailability);
  if (!rider) return null;
  const verified = rider.verification === "approved";
  const current = RIDER_AVAILABILITY[rider.availability];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn("inline-flex h-9 items-center gap-2 rounded-full border border-line bg-white px-3 text-[13px] font-semibold text-ink hover:border-line-strong", compact && "px-2.5")}
          aria-label={`Availability: ${current.label}`}
        >
          <span className={cn("size-2.5 rounded-full", current.dot, rider.availability === "online" && "ring-4 ring-emerald/20")} />
          {current.label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel>Set your availability</DropdownMenuLabel>
        {(Object.keys(RIDER_AVAILABILITY) as RiderAvailability[]).map((a) => (
          <DropdownMenuItem
            key={a}
            disabled={!verified && a !== "offline"}
            onSelect={() => {
              setAvailability(rider.id, a);
              toast.success(`You are now ${RIDER_AVAILABILITY[a].label.toLowerCase()}`);
            }}
          >
            <span className={cn("size-2.5 rounded-full", RIDER_AVAILABILITY[a].dot)} />
            <span className="flex-1">{RIDER_AVAILABILITY[a].label}</span>
            {rider.availability === a && <span className="text-xs text-emerald-deep">Current</span>}
          </DropdownMenuItem>
        ))}
        {!verified && <p className="px-2.5 pt-1 pb-2 text-xs text-muted">Complete verification to go online.</p>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ------------------------------ User menu ------------------------------ */
function UserMenu({ role }: { role: Role }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  if (!user) return null;
  const profileHref = role === "admin" ? "/admin/settings" : `/${role}/profile`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="flex items-center gap-2 rounded-full p-0.5 pr-0.5 hover:bg-surface sm:pr-2" aria-label="Account menu">
          <Avatar name={user.name} src={user.avatarUrl} size={32} />
          <span className="hidden text-left sm:block">
            <span className="block max-w-[140px] truncate text-[13px] leading-tight font-semibold text-ink">{user.name}</span>
            <span className="block text-[11px] leading-tight text-muted">{ROLE_LABEL[role]}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-[13px] font-semibold text-ink">{user.name}</span>
          <span className="block truncate text-xs text-muted">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push(profileHref)}>
          <UserIcon /> {role === "partner" ? "Company profile" : "Profile"}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push(`/${role}/settings`)}>
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            logout();
            router.push("/auth/login");
          }}
        >
          <RefreshCw /> Switch demo account
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          destructive
          onSelect={() => {
            logout();
            toast.success("You have been signed out");
            router.push("/");
          }}
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ------------------------------ Mobile bottom bar ------------------------------ */
function MobileTabBar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items: NavItem[] = NAVIGATION[role].flatMap((s) => s.items).filter((i) => i.mobile).slice(0, 5);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Quick navigation">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = isActivePath(pathname, item.href, role);
          return (
            <li key={item.href}>
              <Link href={item.href} className={cn("flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold", active ? "text-emerald-deep" : "text-muted")} aria-current={active ? "page" : undefined}>
                <item.icon className="size-5" />
                <span className="max-w-full truncate px-1">{item.label.replace("My ", "").replace("Available ", "").replace("Book a ", "Book ")}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ------------------------------ Shell ------------------------------ */
export function DashboardShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();
  const { user, rider, partner } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("swiftlogix-sidebar");
      setCollapsed(saved ? saved === "collapsed" : window.innerWidth < 1280);
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => setMobileOpen(false), [pathname]);

  React.useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
    } else if (user.role !== role) {
      toast.error(`That area is for ${ROLE_LABEL[role].toLowerCase()} accounts.`);
      router.replace(`/${user.role}`);
    }
  }, [hydrated, user, role, router, pathname]);

  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem("swiftlogix-sidebar", c ? "expanded" : "collapsed");
      } catch {
        /* ignore */
      }
      return !c;
    });
  };

  const maintenance = useStore((s) => s.settings.maintenanceMode);
  const ready = hydrated && user && user.role === role;
  const showTabBar = role === "rider" || role === "customer";

  return (
    <div className="min-h-dvh bg-surface">
      {/* Desktop / tablet sidebar */}
      <aside className={cn("fixed inset-y-0 left-0 z-30 hidden flex-col bg-navy transition-[width] duration-200 md:flex", collapsed ? "w-[72px]" : "w-64")}>
        <div className={cn("flex h-16 shrink-0 items-center border-b border-white/10", collapsed ? "justify-center" : "justify-between px-5")}>
          {collapsed ? (
            <Link href={`/${role}`} aria-label="Dashboard home">
              <LogoMark size={32} inverted />
            </Link>
          ) : (
            <Logo variant="compact" href={`/${role}`} />
          )}
        </div>
        {!collapsed && (
          <div className="px-5 pt-4">
            <Badge tone="success" className="bg-white/8 text-white/80 ring-white/10">
              {ROLE_LABEL[role]} portal
            </Badge>
          </div>
        )}
        <SidebarNav role={role} collapsed={collapsed} />
        <SidebarFooter collapsed={collapsed} />
        <button type="button" onClick={toggle} className="flex h-11 items-center justify-center gap-2 border-t border-white/10 text-xs font-semibold text-white/50 hover:text-white" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <ChevronsRight className="size-4" /> : (<><ChevronsLeft className="size-4" /> Collapse</>)}
        </button>
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen} title="Navigation" className="bg-navy">
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Logo variant="compact" href={`/${role}`} />
          <button type="button" onClick={() => setMobileOpen(false)} className="rounded-md p-1.5 text-white/60 hover:text-white" aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>
        <SidebarNav role={role} collapsed={false} onNavigate={() => setMobileOpen(false)} />
        <SidebarFooter collapsed={false} />
      </Sheet>

      <div className={cn("flex min-h-dvh flex-col transition-[padding] duration-200", collapsed ? "md:pl-[72px]" : "md:pl-64")}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6">
          <button type="button" onClick={() => setMobileOpen(true)} className="-ml-1 rounded-md p-1.5 text-ink-soft hover:bg-surface md:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <Link href={`/${role}`} className="md:hidden" aria-label="Dashboard home">
            <LogoMark size={28} />
          </Link>
          <div className="hidden flex-1 sm:block">{ready && <GlobalSearch role={role} userId={user.id} riderId={rider?.id} partnerId={partner?.id} />}</div>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {ready && role === "rider" && <AvailabilityControl compact />}
            {ready && <NotificationBell role={role} />}
            {ready && <UserMenu role={role} />}
          </div>
        </header>
        {ready && maintenance && (
          <div role="status" className="border-b border-amber/40 bg-amber-tint px-4 py-2 text-center text-[13px] font-medium text-[#93630f] sm:px-6">
            {role === "admin" ? "Maintenance mode is on. Other users see a maintenance notice." : "Scheduled maintenance is in progress. Some features may be slower than usual."}
          </div>
        )}
        <main className={cn("mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8", showTabBar && "pb-24 md:pb-8")}>{ready ? children : <PageSkeleton />}</main>
      </div>
      {ready && showTabBar && <MobileTabBar role={role} />}
    </div>
  );
}

