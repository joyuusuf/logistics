import type { Shipment, ShipmentStatus } from "@/types";

/**
 * Location service boundary.
 *
 * Today this returns a *simulated* progress value derived from the shipment
 * status and elapsed time. When a real rider-location service exists, replace
 * `getRiderProgress` with a subscription (WebSocket / SSE) that returns live
 * coordinates, and render them with a Google Maps or Mapbox adapter.
 */
export interface RiderPosition {
  /** 0 = at pickup, 1 = at destination. Negative values mean approaching pickup. */
  progress: number;
  simulated: true;
  updatedAt: string;
}

const STATUS_PROGRESS: Record<ShipmentStatus, number> = {
  pending: -1,
  confirmed: -1,
  assigned: -0.35,
  accepted: -0.3,
  en_route_pickup: -0.15,
  picked_up: 0.02,
  in_transit: 0.45,
  arrived: 0.97,
  delivered: 1,
  cancelled: -1,
};

export function getRiderPosition(shipment: Shipment, now = Date.now()): RiderPosition {
  let progress = STATUS_PROGRESS[shipment.status];
  if (shipment.status === "in_transit") {
    // Ease along the route based on time since the rider left pickup.
    const started = [...shipment.timeline].reverse().find((e) => e.status === "in_transit");
    if (started) {
      const elapsed = (now - new Date(started.at).getTime()) / 60000;
      const expected = Math.max(15, shipment.distanceKm * (shipment.intercity ? 1.1 : 2.6));
      progress = Math.min(0.9, 0.12 + (elapsed / expected) * 0.8);
    }
  }
  return { progress, simulated: true, updatedAt: new Date(now).toISOString() };
}

export const MAP_PROVIDER = (process.env.NEXT_PUBLIC_MAP_PROVIDER ?? "") as "" | "google" | "mapbox";
