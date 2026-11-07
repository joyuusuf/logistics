import {
  BadgeCheck,
  Banknote,
  BarChart3,
  Bell,
  Bike,
  Building2,
  ClipboardList,
  CreditCard,
  FileBarChart,
  History,
  LayoutDashboard,
  LifeBuoy,
  MapPin,
  Navigation,
  Package,
  PackagePlus,
  Receipt,
  ScrollText,
  Settings,
  Tag,
  Truck,
  User,
  UserCog,
  Users,
  Wallet,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Show in the rider mobile bottom bar. */
  mobile?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const NAVIGATION: Record<Role, NavSection[]> = {
  customer: [
    {
      items: [
        { label: "Overview", href: "/customer", icon: LayoutDashboard, mobile: true },
        { label: "Book a Delivery", href: "/customer/book", icon: PackagePlus, mobile: true },
        { label: "My Shipments", href: "/customer/shipments", icon: Package, mobile: true },
        { label: "Track Shipment", href: "/customer/track", icon: Navigation },
        { label: "Saved Addresses", href: "/customer/addresses", icon: MapPin },
        { label: "Payments", href: "/customer/payments", icon: CreditCard, mobile: true },
      ],
    },
    {
      title: "Account",
      items: [
        { label: "Notifications", href: "/customer/notifications", icon: Bell },
        { label: "Support", href: "/customer/support", icon: LifeBuoy },
        { label: "Profile", href: "/customer/profile", icon: User },
        { label: "Settings", href: "/customer/settings", icon: Settings },
      ],
    },
  ],
  rider: [
    {
      items: [
        { label: "Overview", href: "/rider", icon: LayoutDashboard, mobile: true },
        { label: "Available Jobs", href: "/rider/jobs", icon: Briefcase, mobile: true },
        { label: "My Deliveries", href: "/rider/deliveries", icon: Bike, mobile: true },
        { label: "Delivery History", href: "/rider/history", icon: History },
        { label: "Earnings", href: "/rider/earnings", icon: Wallet, mobile: true },
        { label: "Payouts", href: "/rider/payouts", icon: Banknote },
      ],
    },
    {
      title: "Account",
      items: [
        { label: "Verification", href: "/rider/verification", icon: BadgeCheck },
        { label: "Notifications", href: "/rider/notifications", icon: Bell },
        { label: "Profile", href: "/rider/profile", icon: User },
        { label: "Settings", href: "/rider/settings", icon: Settings },
      ],
    },
  ],
  partner: [
    {
      items: [
        { label: "Overview", href: "/partner", icon: LayoutDashboard, mobile: true },
        { label: "Deliveries", href: "/partner/deliveries", icon: Package, mobile: true },
        { label: "Fleet Management", href: "/partner/fleet", icon: Truck, mobile: true },
        { label: "Riders", href: "/partner/riders", icon: Users, mobile: true },
        { label: "Assignments", href: "/partner/assignments", icon: ClipboardList },
      ],
    },
    {
      title: "Finance",
      items: [
        { label: "Earnings", href: "/partner/earnings", icon: Wallet },
        { label: "Transactions", href: "/partner/transactions", icon: Receipt },
        { label: "Analytics", href: "/partner/analytics", icon: BarChart3 },
      ],
    },
    {
      title: "Company",
      items: [
        { label: "Company Profile", href: "/partner/profile", icon: Building2 },
        { label: "Notifications", href: "/partner/notifications", icon: Bell },
        { label: "Settings", href: "/partner/settings", icon: Settings },
      ],
    },
  ],
  admin: [
    {
      items: [
        { label: "Overview", href: "/admin", icon: LayoutDashboard, mobile: true },
        { label: "Deliveries", href: "/admin/deliveries", icon: Package, mobile: true },
      ],
    },
    {
      title: "People",
      items: [
        { label: "Customers", href: "/admin/customers", icon: Users },
        { label: "Riders", href: "/admin/riders", icon: Bike, mobile: true },
        { label: "Logistics Partners", href: "/admin/partners", icon: Building2 },
        { label: "Fleet", href: "/admin/fleet", icon: Truck },
      ],
    },
    {
      title: "Finance",
      items: [
        { label: "Payments", href: "/admin/payments", icon: CreditCard },
        { label: "Payouts", href: "/admin/payouts", icon: Banknote, mobile: true },
        { label: "Pricing", href: "/admin/pricing", icon: Tag },
        { label: "Reports", href: "/admin/reports", icon: FileBarChart },
      ],
    },
    {
      title: "System",
      items: [
        { label: "Support Tickets", href: "/admin/support", icon: LifeBuoy },
        { label: "Notifications", href: "/admin/notifications", icon: Bell },
        { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
        { label: "Settings", href: "/admin/settings", icon: UserCog },
      ],
    },
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  customer: "Customer",
  rider: "Rider",
  partner: "Logistics partner",
  admin: "Super admin",
};

export const PUBLIC_NAV = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Track Shipment", href: "/track" },
];

