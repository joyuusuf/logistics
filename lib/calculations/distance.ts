import { getState } from "@/lib/mock-data/nigeria";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Simulated road distance. Intercity routes use state-capital coordinates with
 * a road-winding factor; same-state routes derive a stable 3 to 32 km distance
 * from the two LGAs. Replace with a Distance Matrix API call when a map
 * provider is connected.
 */
export function estimateDistanceKm(
  from: { state: string; lga: string; address?: string },
  to: { state: string; lga: string; address?: string },
): { km: number; intercity: boolean } {
  const a = getState(from.state);
  const b = getState(to.state);
  const intercity = !!a && !!b && a.name !== b.name;
  if (intercity && a && b) {
    return { km: Math.round(haversineKm(a.lat, a.lng, b.lat, b.lng) * 1.32), intercity: true };
  }
  if (from.lga === to.lga) {
    return { km: 2 + (hash(`${from.address ?? ""}${to.address ?? ""}`) % 5), intercity: false };
  }
  const key = [from.lga, to.lga].sort().join("|");
  return { km: 5 + (hash(key) % 28), intercity: false };
}

/** Rough travel time in minutes assuming Nigerian urban / highway speeds. */
export function estimateTravelMinutes(km: number, intercity: boolean): number {
  const speed = intercity ? 55 : 22;
  return Math.max(20, Math.round((km / speed) * 60));
}
