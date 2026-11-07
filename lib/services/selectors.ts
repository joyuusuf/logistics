import { endOfWeek, format, isAfter, startOfDay, startOfMonth, startOfWeek, subDays, subMonths, subWeeks } from "date-fns";
import type { AppNotification, Payout, Role, Shipment, User } from "@/types";
import { ACTIVE_STATUSES, OPEN_STATUSES, SHIPMENT_STATUS } from "@/lib/constants";
import type { ShipmentFilterGroup } from "@/types";

export const isActive = (s: Shipment) => ACTIVE_STATUSES.includes(s.status);
export const isOpen = (s: Shipment) => OPEN_STATUSES.includes(s.status);

export function matchesFilter(s: Shipment, filter: ShipmentFilterGroup) {
  return filter === "all" || SHIPMENT_STATUS[s.status].group === filter;
}

export function shipmentStats(list: Shipment[]) {
  return {
    total: list.length,
    active: list.filter(isActive).length,
    delivered: list.filter((s) => s.status === "delivered").length,
    pending: list.filter(isOpen).length,
    cancelled: list.filter((s) => s.status === "cancelled").length,
    revenue: list.filter((s) => s.paymentStatus === "paid").reduce((sum, s) => sum + s.amount, 0),
  };
}

export function successRate(list: Shipment[]) {
  const closed = list.filter((s) => s.status === "delivered" || s.status === "cancelled");
  if (!closed.length) return 0;
  return Math.round((closed.filter((s) => s.status === "delivered").length / closed.length) * 1000) / 10;
}

/** Monthly series for the last n months. */
export function monthlySeries(list: Shipment[], months = 6, now = new Date()) {
  return Array.from({ length: months }, (_, i) => {
    const start = startOfMonth(subMonths(now, months - 1 - i));
    const end = startOfMonth(subMonths(now, months - 2 - i));
    const inMonth = list.filter((s) => {
      const d = new Date(s.createdAt);
      return d >= start && (i === months - 1 || d < end);
    });
    return {
      label: format(start, "MMM"),
      shipments: inMonth.length,
      delivered: inMonth.filter((s) => s.status === "delivered").length,
      cancelled: inMonth.filter((s) => s.status === "cancelled").length,
      revenue: inMonth.filter((s) => s.paymentStatus === "paid").reduce((sum, s) => sum + s.amount, 0),
    };
  });
}

/** Daily series for the last n days. */
export function dailySeries(list: Shipment[], days = 14, now = new Date()) {
  return Array.from({ length: days }, (_, i) => {
    const day = startOfDay(subDays(now, days - 1 - i));
    const next = startOfDay(subDays(now, days - 2 - i));
    const inDay = list.filter((s) => {
      const d = new Date(s.createdAt);
      return d >= day && (i === days - 1 || d < next);
    });
    return {
      label: format(day, "d MMM"),
      shipments: inDay.length,
      delivered: inDay.filter((s) => s.status === "delivered").length,
      revenue: inDay.filter((s) => s.paymentStatus === "paid").reduce((sum, s) => sum + s.amount, 0),
    };
  });
}

/** Rider earnings per weekday for the current week. */
export function weeklyEarnings(list: Shipment[], now = new Date()) {
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const label = format(day, "EEE");
    const done = list.filter((s) => {
      if (s.status !== "delivered" || !s.deliveredAt) return false;
      const d = new Date(s.deliveredAt);
      return d >= start && d <= end && d.getDay() === day.getDay();
    });
    return { label, earnings: done.reduce((sum, s) => sum + s.riderEarning, 0), deliveries: done.length };
  });
}

export function weeklyTotals(list: Shipment[], weeks = 8, now = new Date()) {
  return Array.from({ length: weeks }, (_, i) => {
    const start = startOfWeek(subWeeks(now, weeks - 1 - i), { weekStartsOn: 1 });
    const end = endOfWeek(start, { weekStartsOn: 1 });
    const done = list.filter((s) => s.status === "delivered" && s.deliveredAt && new Date(s.deliveredAt) >= start && new Date(s.deliveredAt) <= end);
    return { label: format(start, "d MMM"), earnings: done.reduce((sum, s) => sum + s.riderEarning, 0), deliveries: done.length };
  });
}

export function riderBalance(riderId: string, shipments: Shipment[], payouts: Payout[]) {
  const mine = shipments.filter((s) => s.riderId === riderId);
  const totalEarnings = mine.filter((s) => s.status === "delivered").reduce((sum, s) => sum + s.riderEarning, 0);
  const pendingEarnings = mine.filter(isActive).reduce((sum, s) => sum + s.riderEarning, 0);
  const mp = payouts.filter((p) => p.riderId === riderId);
  const paidOut = mp.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const inFlight = mp.filter((p) => p.status === "pending" || p.status === "approved").reduce((sum, p) => sum + p.amount, 0);
  return { totalEarnings, pendingEarnings, paidOut, inFlight, available: Math.max(0, totalEarnings - paidOut - inFlight) };
}

export function notificationsFor(all: AppNotification[], user: User | undefined) {
  if (!user) return [];
  return all.filter((n) => n.userId === user.id || (!n.userId && n.role === user.role)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function statusDistribution(list: Shipment[]) {
  const groups = [
    { key: "delivered", label: "Delivered", color: "#16A477" },
    { key: "active", label: "Active", color: "#142C45" },
    { key: "open", label: "Awaiting rider", color: "#F2B84B" },
    { key: "cancelled", label: "Cancelled", color: "#DC5555" },
  ];
  const counts = {
    delivered: list.filter((s) => s.status === "delivered").length,
    active: list.filter(isActive).length,
    open: list.filter(isOpen).length,
    cancelled: list.filter((s) => s.status === "cancelled").length,
  };
  return groups.map((g) => ({ ...g, value: counts[g.key as keyof typeof counts] }));
}

export function recentSince(list: Shipment[], days: number, now = new Date()) {
  const from = subDays(now, days);
  return list.filter((s) => isAfter(new Date(s.createdAt), from));
}

export function homeFor(role: Role) {
  return `/${role}`;
}

/** Percentage change helper for KPI deltas. */
export function pctChange(current: number, previous: number) {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
