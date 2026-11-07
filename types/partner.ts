import type { AccountStatus } from "./auth";
import type { VerificationDocument, VerificationStatus } from "./rider";

export type ServiceCategory =
  | "same_day"
  | "express"
  | "scheduled"
  | "business"
  | "bulk"
  | "intercity";

export interface Partner {
  id: string;
  userId: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  cacNumber: string;
  description: string;
  operatingStates: string[];
  services: ServiceCategory[];
  fleetSize: number;
  verification: VerificationStatus;
  status: AccountStatus;
  documents: VerificationDocument[];
  joinedAt: string;
  commissionRate: number;
  rejectionReason?: string;
}
