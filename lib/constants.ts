import type {
  DeliveryType,
  PackageCategory,
  PayoutStatus,
  ServiceCategory,
  ShipmentFilterGroup,
  ShipmentStatus,
  TicketPriority,
  TicketStatus,
  TransactionStatus,
  VehicleAvailability,
  VehicleCategory,
  VerificationStatus,
  RiderAvailability,
} from "@/types";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "navy" | "amber";

export const SHIPMENT_STATUS: Record<ShipmentStatus, { label: string; tone: Tone; group: ShipmentFilterGroup }> = {
  pending: { label: "Pending", tone: "warning", group: "pending" },
  confirmed: { label: "Confirmed", tone: "info", group: "confirmed" },
  assigned: { label: "Assigned", tone: "navy", group: "assigned" },
  accepted: { label: "Accepted", tone: "navy", group: "assigned" },
  en_route_pickup: { label: "Heading to pickup", tone: "navy", group: "assigned" },
  picked_up: { label: "Picked up", tone: "amber", group: "picked_up" },
  in_transit: { label: "In transit", tone: "info", group: "in_transit" },
  arrived: { label: "At destination", tone: "info", group: "in_transit" },
  delivered: { label: "Delivered", tone: "success", group: "delivered" },
  cancelled: { label: "Cancelled", tone: "danger", group: "cancelled" },
};

export const SHIPMENT_FILTERS: { value: ShipmentFilterGroup; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "assigned", label: "Assigned" },
  { value: "picked_up", label: "Picked up" },
  { value: "in_transit", label: "In transit" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export const ACTIVE_STATUSES: ShipmentStatus[] = [
  "assigned",
  "accepted",
  "en_route_pickup",
  "picked_up",
  "in_transit",
  "arrived",
];

export const OPEN_STATUSES: ShipmentStatus[] = ["pending", "confirmed"];

/** Statuses in which a customer or admin may still cancel. */
export const CANCELLABLE_STATUSES: ShipmentStatus[] = ["pending", "confirmed", "assigned", "accepted"];

/** The ordered rider workflow used for progress and timelines. */
export const STATUS_FLOW: ShipmentStatus[] = [
  "pending",
  "confirmed",
  "assigned",
  "accepted",
  "en_route_pickup",
  "picked_up",
  "in_transit",
  "arrived",
  "delivered",
];

export const TIMELINE_LABELS: Record<ShipmentStatus, string> = {
  pending: "Booking received",
  confirmed: "Payment confirmed",
  assigned: "Rider assigned",
  accepted: "Rider accepted delivery",
  en_route_pickup: "Rider heading to pickup",
  picked_up: "Package picked up",
  in_transit: "Out for delivery",
  arrived: "Rider at destination",
  delivered: "Delivered and confirmed with PIN",
  cancelled: "Shipment cancelled",
};

export const DELIVERY_TYPES: Record<DeliveryType, { label: string; description: string; hours: number }> = {
  standard: { label: "Standard", description: "Delivered within 24 to 48 hours", hours: 36 },
  express: { label: "Express", description: "Priority handling, within 6 hours", hours: 6 },
  same_day: { label: "Same-day", description: "Delivered before 9pm today", hours: 10 },
  scheduled: { label: "Scheduled", description: "Pick a date and time that suits you", hours: 24 },
};

export const PACKAGE_CATEGORIES: Record<PackageCategory, string> = {
  documents: "Documents",
  electronics: "Electronics",
  food: "Food and groceries",
  clothing: "Clothing and fashion",
  cosmetics: "Beauty and cosmetics",
  household: "Household items",
  pharmaceuticals: "Pharmaceuticals",
  auto_parts: "Auto parts",
  other: "Other",
};

export const VEHICLE_CATEGORIES: Record<VehicleCategory, { label: string; capacityKg: number }> = {
  motorcycle: { label: "Motorcycle", capacityKg: 30 },
  tricycle: { label: "Tricycle", capacityKg: 250 },
  car: { label: "Car", capacityKg: 300 },
  van: { label: "Van", capacityKg: 1200 },
  pickup_truck: { label: "Pickup truck", capacityKg: 1500 },
  truck: { label: "Truck", capacityKg: 8000 },
};

export const VEHICLE_AVAILABILITY: Record<VehicleAvailability, { label: string; tone: Tone }> = {
  available: { label: "Available", tone: "success" },
  in_use: { label: "In use", tone: "info" },
  maintenance: { label: "Maintenance", tone: "warning" },
  inactive: { label: "Inactive", tone: "neutral" },
};

export const VERIFICATION_STATUS: Record<VerificationStatus, { label: string; tone: Tone }> = {
  not_submitted: { label: "Not submitted", tone: "neutral" },
  under_review: { label: "Under review", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

export const RIDER_AVAILABILITY: Record<RiderAvailability, { label: string; tone: Tone; dot: string }> = {
  online: { label: "Online", tone: "success", dot: "bg-emerald" },
  busy: { label: "Busy", tone: "amber", dot: "bg-amber" },
  offline: { label: "Offline", tone: "neutral", dot: "bg-slate-400" },
};

export const TRANSACTION_STATUS: Record<TransactionStatus, { label: string; tone: Tone }> = {
  successful: { label: "Successful", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
  failed: { label: "Failed", tone: "danger" },
  refunded: { label: "Refunded", tone: "neutral" },
};

export const PAYOUT_STATUS: Record<PayoutStatus, { label: string; tone: Tone }> = {
  pending: { label: "Pending review", tone: "warning" },
  approved: { label: "Approved", tone: "info" },
  paid: { label: "Paid", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

export const TICKET_STATUS: Record<TicketStatus, { label: string; tone: Tone }> = {
  open: { label: "Open", tone: "warning" },
  in_progress: { label: "In progress", tone: "info" },
  resolved: { label: "Resolved", tone: "success" },
  closed: { label: "Closed", tone: "neutral" },
};

export const TICKET_PRIORITY: Record<TicketPriority, { label: string; tone: Tone }> = {
  low: { label: "Low", tone: "neutral" },
  medium: { label: "Medium", tone: "info" },
  high: { label: "High", tone: "warning" },
  urgent: { label: "Urgent", tone: "danger" },
};

export const SERVICE_CATEGORIES: Record<ServiceCategory, string> = {
  same_day: "Same-day delivery",
  express: "Express delivery",
  scheduled: "Scheduled delivery",
  business: "Business logistics",
  bulk: "Bulk shipments",
  intercity: "Intercity delivery",
};

export const PAYMENT_METHODS = {
  card: "Card",
  bank_transfer: "Bank transfer",
  wallet: "SwiftLogix wallet",
  ussd: "USSD",
} as const;

export const NIGERIAN_BANKS = [
  "Access Bank",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank",
  "Guaranty Trust Bank",
  "Kuda Microfinance Bank",
  "Moniepoint Microfinance Bank",
  "OPay",
  "Stanbic IBTC Bank",
  "Sterling Bank",
  "United Bank for Africa",
  "Union Bank",
  "Wema Bank",
  "Zenith Bank",
];

export const RIDER_DOCUMENT_TYPES = ["Driver's licence", "Valid identification (NIN slip)", "Vehicle papers", "Proof of address"];
export const PARTNER_DOCUMENT_TYPES = ["CAC certificate", "Memorandum of association", "Tax identification (TIN)", "Insurance certificate"];
