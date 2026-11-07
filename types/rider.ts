import type { AccountStatus } from "./auth";
import type { VehicleCategory } from "./vehicle";

export type RiderAvailability = "online" | "offline" | "busy";

export type VerificationStatus = "not_submitted" | "under_review" | "approved" | "rejected";

export interface VerificationDocument {
  id: string;
  type: string;
  fileName: string;
  status: VerificationStatus;
  uploadedAt?: string;
  previewUrl?: string;
  note?: string;
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface Rider {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  address: string;
  state: string;
  lga: string;
  vehicleType: VehicleCategory;
  vehiclePlate: string;
  availability: RiderAvailability;
  verification: VerificationStatus;
  status: AccountStatus;
  partnerId?: string;
  vehicleId?: string;
  rating: number;
  documents: VerificationDocument[];
  bank?: BankAccount;
  joinedAt: string;
  rejectionReason?: string;
}
