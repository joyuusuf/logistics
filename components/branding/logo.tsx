import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoVariant = "full" | "icon" | "white" | "compact";

interface LogoMarkProps {
  size?: number;
  inverted?: boolean;
  className?: string;
}

/**
 * The SwiftLogix mark: a location pin moving forward, with a chevron inside
 * and trailing speed lines. Built to stay legible down to 16px.
 */
export function LogoMark({ size = 36, inverted = false, className }: LogoMarkProps) {
  const pin = inverted ? "#FFFFFF" : "#142C45";
  const chevron = inverted ? "#142C45" : "#FFFFFF";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <rect x="1" y="13" width="12" height="3.4" rx="1.7" fill="#16A477" />
      <rect x="4" y="19.6" width="9" height="3.4" rx="1.7" fill="#16A477" opacity="0.75" />
      <rect x="7" y="26.2" width="6" height="3.4" rx="1.7" fill="#16A477" opacity="0.5" />
      <path d="M31 3.5c-8.6 0-15.5 6.8-15.5 15.2C15.5 29.5 31 44.5 31 44.5s15.5-15 15.5-25.8C46.5 10.3 39.6 3.5 31 3.5Z" fill={pin} />
      <circle cx="31" cy="18.7" r="8.6" fill="#16A477" />
      <path d="m28.2 13.6 5.6 5.1-5.6 5.1" stroke={chevron} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    <span className={cn("font-extrabold tracking-[-0.025em] leading-none", className)}>
      <span className={inverted ? "text-white" : "text-navy"}>Swift</span>
      <span className="text-emerald">Logix</span>
    </span>
  );
}

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
  href?: string | null;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

/** Reusable logo with full, icon-only, white (for dark surfaces) and compact sidebar variants. */
export function Logo({ variant = "full", className, href = "/", size = "md", showTagline }: LogoProps) {
  const dims = { sm: { mark: 28, text: "text-lg" }, md: { mark: 34, text: "text-[22px]" }, lg: { mark: 44, text: "text-[28px]" } }[size];
  const inverted = variant === "white" || variant === "compact";

  const content =
    variant === "icon" ? (
      <LogoMark size={dims.mark} />
    ) : (
      <span className={cn("inline-flex items-center", variant === "compact" ? "gap-2" : "gap-2.5")}>
        <LogoMark size={variant === "compact" ? 30 : dims.mark} inverted={inverted} />
        <span className="flex flex-col">
          <Wordmark inverted={inverted} className={variant === "compact" ? "text-[19px]" : dims.text} />
          {showTagline && <span className={cn("mt-1 text-[10px] font-semibold uppercase tracking-[0.16em]", inverted ? "text-white/60" : "text-muted")}>Delivering More, Faster.</span>}
        </span>
      </span>
    );

  if (!href) return <span className={cn("inline-flex", className)}>{content}</span>;
  return (
    <Link href={href} className={cn("inline-flex rounded-md", className)} aria-label="SwiftLogix home">
      {content}
    </Link>
  );
}
