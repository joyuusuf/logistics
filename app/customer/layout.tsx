import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="customer">{children}</DashboardShell>;
}
