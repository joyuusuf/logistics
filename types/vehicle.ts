export type VehicleCategory = "motorcycle" | "tricycle" | "car" | "van" | "pickup_truck" | "truck";

export type VehicleAvailability = "available" | "in_use" | "maintenance" | "inactive";

export interface Vehicle {
  id: string;
  partnerId: string;
  category: VehicleCategory;
  make: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  capacityKg: number;
  availability: VehicleAvailability;
  assignedRiderId?: string;
  createdAt: string;
}
