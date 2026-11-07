import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="rider">{children}</DashboardShell>;
}
