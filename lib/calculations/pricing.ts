import type { DeliveryType, PriceBreakdown, PricingConfig } from "@/types";

export const DEFAULT_PRICING: PricingConfig = {
  baseFee: 1200,
  perKm: 140,
  freeWeightKg: 5,
  perKgAbove: 150,
  expressSurchargePct: 45,
  sameDaySurchargePct: 25,
  scheduledDiscountPct: 5,
  intercityBaseFee: 4500,
  intercityPerKm: 38,
  fragileFee: 800,
  bulkFeePerExtraItem: 250,
  minimumFee: 1500,
  riderSharePct: 70,
};

export interface PriceInput {
  distanceKm: number;
  intercity: boolean;
  weightKg: number;
  quantity: number;
  fragile: boolean;
  deliveryType: DeliveryType;
}

const round50 = (n: number) => Math.round(n / 50) * 50;

/**
 * Simulated pricing engine. Pure function so the same logic powers the
 * booking flow, the public pricing estimator and the admin pricing preview.
 */
export function calculatePrice(input: PriceInput, config: PricingConfig): PriceBreakdown {
  const baseFee = input.intercity ? config.intercityBaseFee : config.baseFee;
  const distanceFee = input.distanceKm * (input.intercity ? config.intercityPerKm : config.perKm);
  const extraKg = Math.max(0, input.weightKg * Math.max(1, input.quantity) - config.freeWeightKg);
  const weightFee = extraKg * config.perKgAbove;
  const intercityFee = 0; // already reflected in intercity base and per-km rates
  const specialFee =
    (input.fragile ? config.fragileFee : 0) + Math.max(0, input.quantity - 1) * config.bulkFeePerExtraItem;

  const subtotal = baseFee + distanceFee + weightFee + specialFee;
  let serviceSurcharge = 0;
  if (input.deliveryType === "express") serviceSurcharge = (subtotal * config.expressSurchargePct) / 100;
  if (input.deliveryType === "same_day") serviceSurcharge = (subtotal * config.sameDaySurchargePct) / 100;
  if (input.deliveryType === "scheduled") serviceSurcharge = -(subtotal * config.scheduledDiscountPct) / 100;

  const total = Math.max(config.minimumFee, round50(subtotal + serviceSurcharge));
  return {
    baseFee: round50(baseFee),
    distanceFee: round50(distanceFee),
    weightFee: round50(weightFee),
    serviceSurcharge: round50(serviceSurcharge),
    intercityFee,
    specialFee: round50(specialFee),
    total,
  };
}

export function riderEarningFor(total: number, config: PricingConfig): number {
  return round50((total * config.riderSharePct) / 100);
}
