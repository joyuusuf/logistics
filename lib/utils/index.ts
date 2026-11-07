import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/** Formats a number as Nigerian Naira, e.g. ₦12,500. */
export function formatNaira(value: number): string {
  return nairaFormatter.format(Math.round(value)).replace("NGN", "₦").replace(/\s/g, "");
}

/** Compact Naira for chart axes, e.g. ₦1.2M. */
export function formatNairaCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (Math.abs(value) >= 10_000) return `₦${Math.round(value / 1_000)}k`;
  if (Math.abs(value) >= 1_000) return `₦${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return `₦${Math.round(value)}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-NG").format(value);
}

function toDate(value: string | Date): Date | null {
  const d = typeof value === "string" ? parseISO(value) : value;
  return isValid(d) ? d : null;
}

export function formatDate(value: string | Date, pattern = "d MMM yyyy"): string {
  const d = toDate(value);
  return d ? format(d, pattern) : "-";
}

export function formatDateTime(value: string | Date): string {
  return formatDate(value, "d MMM yyyy, h:mm a");
}

export function formatRelative(value: string | Date): string {
  const d = toDate(value);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : "-";
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Formats a Nigerian phone number as +234 803 123 4567. */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  let local = digits;
  if (digits.startsWith("234")) local = digits.slice(3);
  else if (digits.startsWith("0")) local = digits.slice(1);
  if (local.length !== 10) return phone;
  return `+234 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

/** Generates a shipment reference such as SLX-48K2Q9. */
export function shipmentReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `SLX-${out}`;
}

export function txReference(prefix = "TXN"): string {
  return `${prefix}-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 900 + 100)}`;
}

export function fourDigitPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function titleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function maskAccount(accountNumber: string): string {
  return accountNumber.length > 4 ? `•••• ${accountNumber.slice(-4)}` : accountNumber;
}

export function downloadTextFile(fileName: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(","))].join("\n");
}
