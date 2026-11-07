import type { Role } from "./auth";

export interface AppNotification {
  id: string;
  /** Target a specific user, or every user in a role when userId is absent. */
  userId?: string;
  role?: Role;
  title: string;
  body: string;
  type: "shipment" | "payment" | "account" | "system" | "payout";
  read: boolean;
  createdAt: string;
  href?: string;
}

export interface SavedAddress {
  id: string;
  customerId: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  state: string;
  lga: string;
  landmark?: string;
  isDefault: boolean;
}

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface TicketMessage {
  id: string;
  author: string;
  fromStaff: boolean;
  body: string;
  at: string;
}

export interface SupportTicket {
  id: string;
  reference: string;
  userId: string;
  role: Role;
  subject: string;
  category: "delivery" | "payment" | "account" | "technical" | "other";
  priority: TicketPriority;
  status: TicketStatus;
  shipmentRef?: string;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: Role | "system";
  action: string;
  target: string;
  category: "shipment" | "user" | "rider" | "partner" | "payment" | "payout" | "pricing" | "fleet" | "auth" | "settings";
  at: string;
}

export interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  autoAssignRiders: boolean;
  requireRiderVerification: boolean;
  maxActiveJobsPerRider: number;
}
