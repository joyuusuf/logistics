export type TransactionStatus = "successful" | "pending" | "failed" | "refunded";

export interface Transaction {
  id: string;
  reference: string;
  customerId: string;
  shipmentId: string;
  amount: number;
  method: "card" | "bank_transfer" | "wallet" | "ussd";
  status: TransactionStatus;
  createdAt: string;
}

export type PayoutStatus = "pending" | "approved" | "paid" | "rejected";

export interface Payout {
  id: string;
  reference: string;
  riderId: string;
  amount: number;
  status: PayoutStatus;
  bankName: string;
  accountNumber: string;
  accountName: string;
  requestedAt: string;
  processedAt?: string;
  note?: string;
}

export interface PricingConfig {
  baseFee: number;
  perKm: number;
  freeWeightKg: number;
  perKgAbove: number;
  expressSurchargePct: number;
  sameDaySurchargePct: number;
  scheduledDiscountPct: number;
  intercityBaseFee: number;
  intercityPerKm: number;
  fragileFee: number;
  bulkFeePerExtraItem: number;
  minimumFee: number;
  riderSharePct: number;
}
