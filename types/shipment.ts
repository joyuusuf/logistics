export type ShipmentStatus =
  | "pending"
  | "confirmed"
  | "assigned"
  | "accepted"
  | "en_route_pickup"
  | "picked_up"
  | "in_transit"
  | "arrived"
  | "delivered"
  | "cancelled";

/** Coarser status groups used by customer-facing filters. */
export type ShipmentFilterGroup =
  | "all"
  | "pending"
  | "confirmed"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type DeliveryType = "standard" | "express" | "same_day" | "scheduled";

export type PackageCategory =
  | "documents"
  | "electronics"
  | "food"
  | "clothing"
  | "cosmetics"
  | "household"
  | "pharmaceuticals"
  | "auto_parts"
  | "other";

export interface ContactPoint {
  name: string;
  phone: string;
  address: string;
  state: string;
  lga: string;
  landmark?: string;
  instructions?: string;
}

export interface PackageInfo {
  category: PackageCategory;
  description: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  quantity: number;
  fragile: boolean;
  imageDataUrl?: string;
}

export interface PriceBreakdown {
  baseFee: number;
  distanceFee: number;
  weightFee: number;
  serviceSurcharge: number;
  intercityFee: number;
  specialFee: number;
  total: number;
}

export interface TimelineEvent {
  status: ShipmentStatus;
  label: string;
  at: string;
  note?: string;
}

export interface Shipment {
  id: string;
  reference: string;
  customerId: string;
  sender: ContactPoint;
  recipient: ContactPoint;
  package: PackageInfo;
  deliveryType: DeliveryType;
  scheduledFor?: string;
  distanceKm: number;
  intercity: boolean;
  price: PriceBreakdown;
  amount: number;
  riderEarning: number;
  paymentStatus: "paid" | "pending" | "failed" | "refunded";
  paymentMethod: "card" | "bank_transfer" | "wallet" | "ussd";
  status: ShipmentStatus;
  riderId?: string;
  partnerId?: string;
  /** Four-digit delivery confirmation code shared with the recipient. */
  pin: string;
  createdAt: string;
  deadline: string;
  estimatedArrival: string;
  deliveredAt?: string;
  timeline: TimelineEvent[];
}
