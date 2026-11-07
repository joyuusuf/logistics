import { addHours, addMinutes, subDays, subHours, subMinutes } from "date-fns";
import type {
  AppNotification,
  AuditLog,
  DeliveryType,
  PackageCategory,
  Partner,
  Payout,
  PlatformSettings,
  Rider,
  SavedAddress,
  Shipment,
  ShipmentStatus,
  SupportTicket,
  TimelineEvent,
  Transaction,
  User,
  Vehicle,
  VehicleCategory,
} from "@/types";
import { DEFAULT_PRICING, calculatePrice, riderEarningFor } from "@/lib/calculations/pricing";
import { estimateDistanceKm, estimateTravelMinutes } from "@/lib/calculations/distance";
import { DELIVERY_TYPES, NIGERIAN_BANKS, PARTNER_DOCUMENT_TYPES, RIDER_DOCUMENT_TYPES, STATUS_FLOW, TIMELINE_LABELS, VEHICLE_CATEGORIES } from "@/lib/constants";
import { SAMPLE_ADDRESSES } from "./nigeria";

export const DEMO_PASSWORD = "demo1234";

export const DEMO_ACCOUNTS = {
  customer: { email: "customer@swiftlogix.ng", name: "Adaeze Okafor", label: "Customer", description: "Book and track deliveries" },
  rider: { email: "rider@swiftlogix.ng", name: "Chinedu Eze", label: "Rider", description: "Accept jobs and complete deliveries" },
  partner: { email: "partner@swiftlogix.ng", name: "Greenline Haulage Ltd", label: "Logistics partner", description: "Manage fleet, riders and assignments" },
  admin: { email: "admin@swiftlogix.ng", name: "Tunde Bakare", label: "Super admin", description: "Run the whole platform" },
} as const;

/** Small deterministic PRNG so the demo data is the same on every reset. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const defaultPrefs = { email: true, sms: true, push: true, shipmentUpdates: true, promotions: false };

const FIRST = ["Adaeze", "Bolaji", "Chiamaka", "Damilola", "Emeka", "Funmilayo", "Garba", "Halima", "Ifeoma", "Jide", "Kelechi", "Lami", "Musa", "Ngozi", "Oluwaseun", "Precious", "Rasheed", "Sade", "Tobi", "Uche", "Victor", "Wuraola", "Yusuf", "Zainab", "Abubakar", "Bisola", "Chukwudi", "Dayo", "Efe", "Folake", "Ibrahim", "Kunle", "Mariam", "Nnamdi", "Obinna", "Segun", "Temitope", "Usman", "Kemi", "Aisha"];
const LAST = ["Okafor", "Adeyemi", "Bello", "Nwosu", "Ogunleye", "Eze", "Mohammed", "Okonkwo", "Adebayo", "Ibrahim", "Olawale", "Chukwu", "Abdullahi", "Afolabi", "Obi", "Lawal", "Usman", "Onyeka", "Balogun", "Ojo", "Akande", "Danjuma", "Etim", "Ikechukwu", "Salami", "Oyelaran"];

const PACKAGE_SAMPLES: { category: PackageCategory; description: string; weight: [number, number] }[] = [
  { category: "documents", description: "Signed contract documents in envelope", weight: [0.2, 0.8] },
  { category: "electronics", description: "Samsung Galaxy phone in original box", weight: [0.4, 1] },
  { category: "electronics", description: "HP laptop and charger", weight: [2, 3.5] },
  { category: "food", description: "Party jollof rice and small chops trays", weight: [4, 9] },
  { category: "food", description: "Bag of garri and foodstuff", weight: [10, 25] },
  { category: "clothing", description: "Ankara fabric bundle (6 yards)", weight: [1, 3] },
  { category: "clothing", description: "Customer order: 3 sneakers", weight: [2.5, 4] },
  { category: "cosmetics", description: "Skincare products order", weight: [0.8, 2.5] },
  { category: "household", description: "Blender and kitchen set", weight: [3, 7] },
  { category: "pharmaceuticals", description: "Pharmacy order, sealed", weight: [0.3, 1.5] },
  { category: "auto_parts", description: "Toyota Corolla brake pads", weight: [3, 6] },
  { category: "other", description: "Gift box for birthday", weight: [1, 4] },
];

const VEHICLE_MODELS: Record<VehicleCategory, [string, string][]> = {
  motorcycle: [["Bajaj", "Boxer BM150"], ["TVS", "HLX 125"], ["Honda", "Ace 125"], ["Qlink", "XP200"]],
  tricycle: [["Bajaj", "RE Maxima"], ["TVS", "King Deluxe"]],
  car: [["Toyota", "Corolla"], ["Honda", "Civic"], ["Kia", "Rio"]],
  van: [["Toyota", "Hiace"], ["Ford", "Transit"], ["Nissan", "Urvan"]],
  pickup_truck: [["Toyota", "Hilux"], ["Nissan", "Navara"]],
  truck: [["Mercedes-Benz", "Axor 1828"], ["Isuzu", "NPR"]],
};

const PLATE_CODES: Record<string, string> = { Lagos: "LND", Oyo: "IBD", FCT: "ABJ", Rivers: "PHC", Kano: "KAN", Ogun: "ABK", Enugu: "ENU", Edo: "BEN", Kaduna: "KAD" };

export interface SeedData {
  users: User[];
  riders: Rider[];
  partners: Partner[];
  vehicles: Vehicle[];
  shipments: Shipment[];
  transactions: Transaction[];
  payouts: Payout[];
  notifications: AppNotification[];
  addresses: SavedAddress[];
  tickets: SupportTicket[];
  auditLogs: AuditLog[];
  settings: PlatformSettings;
}

export function buildTimeline(status: ShipmentStatus, createdAt: Date, totalMinutes: number, cancelledAfter?: ShipmentStatus): TimelineEvent[] {
  const target = status === "cancelled" ? cancelledAfter ?? "pending" : status;
  const idx = STATUS_FLOW.indexOf(target);
  const steps = STATUS_FLOW.slice(0, idx + 1);
  // Distribute time: first few steps fast, travel steps take longer.
  const weights: Record<ShipmentStatus, number> = { pending: 0, confirmed: 2, assigned: 6, accepted: 2, en_route_pickup: 3, picked_up: 18, in_transit: 8, arrived: 52, delivered: 6, cancelled: 0 };
  const totalWeight = STATUS_FLOW.reduce((s, k) => s + weights[k], 0);
  let t = createdAt;
  const events: TimelineEvent[] = steps.map((s) => {
    t = addMinutes(t, Math.round((weights[s] / totalWeight) * totalMinutes));
    return { status: s, label: TIMELINE_LABELS[s], at: t.toISOString() };
  });
  if (status === "cancelled") {
    events.push({ status: "cancelled", label: TIMELINE_LABELS.cancelled, at: addMinutes(t, 25).toISOString(), note: "Cancelled by customer before pickup" });
  }
  return events;
}

export function createSeedData(now: Date = new Date()): SeedData {
  const rand = mulberry32(20261105);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
  const between = (min: number, max: number) => min + rand() * (max - min);
  const int = (min: number, max: number) => Math.floor(between(min, max + 1));
  const phone = () => `0${pick(["803", "806", "813", "816", "703", "706", "810", "905", "802", "808", "812", "701", "902", "907"])}${String(int(1000000, 9999999))}`;
  const usedNames = new Set<string>();
  const personName = () => {
    let n = "";
    do n = `${pick(FIRST)} ${pick(LAST)}`;
    while (usedNames.has(n));
    usedNames.add(n);
    return n;
  };
  const emailFor = (name: string, domain = "gmail.com") => `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@${domain}`;
  const iso = (d: Date) => d.toISOString();
  let seq = 0;
  const id = (p: string) => `${p}_${(++seq).toString(36).padStart(4, "0")}`;
  const refChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const ref = () => `SLX-${Array.from({ length: 6 }, () => refChars[Math.floor(rand() * refChars.length)]).join("")}`;

  const users: User[] = [];
  const addUser = (u: Omit<User, "password" | "preferences" | "emailVerified" | "status"> & Partial<User>): User => {
    const user: User = { password: DEMO_PASSWORD, preferences: { ...defaultPrefs }, emailVerified: true, status: "active", ...u };
    users.push(user);
    return user;
  };

  // ---- Admin ----
  const admin = addUser({ id: "usr_admin", role: "admin", name: DEMO_ACCOUNTS.admin.name, email: DEMO_ACCOUNTS.admin.email, phone: "08031234567", state: "Lagos", city: "Ikeja", createdAt: iso(subDays(now, 420)) });
  usedNames.add(admin.name);
  addUser({ id: "usr_admin2", role: "admin", name: "Kemi Adeleke", email: "kemi.ops@swiftlogix.ng", phone: "08029876543", state: "Lagos", city: "Ikeja", createdAt: iso(subDays(now, 300)) });
  usedNames.add("Kemi Adeleke");

  // ---- Customers ----
  const customerSpecs = [
    { name: DEMO_ACCOUNTS.customer.name, email: DEMO_ACCOUNTS.customer.email, state: "Lagos", city: "Lekki", days: 240 },
    { name: "Bolaji Adeyemi", state: "Lagos", city: "Ikeja", days: 210 },
    { name: "Halima Bello", state: "FCT", city: "Wuse", days: 190 },
    { name: "Oluwaseun Afolabi", state: "Oyo", city: "Ibadan", days: 175 },
    { name: "Ngozi Okonkwo", state: "Lagos", city: "Surulere", days: 160 },
    { name: "Efe Etim", state: "Rivers", city: "Port Harcourt", days: 140 },
    { name: "Garba Abdullahi", state: "Kano", city: "Kano", days: 120 },
    { name: "Folake Balogun", state: "Lagos", city: "Yaba", days: 95 },
    { name: "Nnamdi Chukwu", state: "Enugu", city: "Enugu", days: 70 },
    { name: "Mariam Salami", state: "Oyo", city: "Ibadan", days: 45 },
    { name: "Victor Ojo", state: "Ogun", city: "Abeokuta", days: 30 },
    { name: "Temitope Akande", state: "Lagos", city: "Ikorodu", days: 12 },
    { name: "Bisola Lawal", state: "FCT", city: "Maitama", days: 5 },
  ];
  const customers = customerSpecs.map((c, i) => {
    usedNames.add(c.name);
    return addUser({
      id: i === 0 ? "usr_customer" : id("usr"),
      role: "customer",
      name: c.name,
      email: c.email ?? emailFor(c.name),
      phone: i === 0 ? "08037654321" : phone(),
      state: c.state,
      city: c.city,
      createdAt: iso(subDays(now, c.days)),
      status: i === 10 ? "suspended" : "active",
    });
  });

  // ---- Partners ----
  const partnerSpecs = [
    { name: DEMO_ACCOUNTS.partner.name, state: "Lagos", states: ["Lagos", "Ogun", "Oyo"], v: "approved" as const, days: 380, address: "Plot 14, Oregun Industrial Estate, Ikeja, Lagos" },
    { name: "Ekomile Logistics Ltd", state: "Lagos", states: ["Lagos"], v: "approved" as const, days: 300, address: "22 Apapa Road, Ebute Metta, Lagos" },
    { name: "Northpoint Couriers Nig. Ltd", state: "FCT", states: ["FCT", "Kaduna", "Kano", "Niger"], v: "approved" as const, days: 260, address: "5 Ladoke Akintola Boulevard, Garki II, Abuja" },
    { name: "Delta Bridge Logistics", state: "Rivers", states: ["Rivers", "Delta", "Bayelsa"], v: "approved" as const, days: 200, address: "47 Trans-Amadi Industrial Layout, Port Harcourt" },
    { name: "Savannah Freight Co.", state: "Kano", states: ["Kano", "Katsina", "Jigawa"], v: "under_review" as const, days: 6, address: "11 Bompai Road, Kano" },
    { name: "Ibadan Express Movers", state: "Oyo", states: ["Oyo", "Osun"], v: "under_review" as const, days: 3, address: "7 Ring Road, Challenge, Ibadan" },
    { name: "Coastal Dash Logistics", state: "Lagos", states: ["Lagos"], v: "rejected" as const, days: 40, address: "3 Mile 2 Expressway, Amuwo-Odofin, Lagos" },
  ];
  const partners: Partner[] = partnerSpecs.map((p, i) => {
    const user = addUser({
      id: i === 0 ? "usr_partner" : id("usr"),
      role: "partner",
      name: p.name,
      email: i === 0 ? DEMO_ACCOUNTS.partner.email : `ops@${p.name.toLowerCase().split(" ")[0].replace(/[^a-z]/g, "")}.ng`,
      phone: i === 0 ? "08097778888" : phone(),
      state: p.state,
      city: p.address.split(",").slice(-2, -1)[0]?.trim() ?? p.state,
      createdAt: iso(subDays(now, p.days)),
    });
    const partnerId = i === 0 ? "ptn_greenline" : id("ptn");
    user.profileId = partnerId;
    return {
      id: partnerId,
      userId: user.id,
      companyName: p.name,
      email: user.email,
      phone: user.phone,
      address: p.address,
      cacNumber: `RC ${int(1100000, 1899999)}`,
      description:
        i === 0
          ? "Last-mile and regional delivery operator serving e-commerce merchants, pharmacies and SMEs across the South-West with a mixed motorcycle and van fleet."
          : `Licensed courier and haulage operator covering ${p.states.join(", ")}.`,
      operatingStates: p.states,
      services: i % 2 === 0 ? ["same_day", "express", "business", "intercity"] : ["same_day", "express", "bulk", "scheduled"],
      fleetSize: 0,
      verification: p.v,
      status: "active",
      documents: PARTNER_DOCUMENT_TYPES.map((type) => ({
        id: id("doc"),
        type,
        fileName: `${type.toLowerCase().replace(/[^a-z]+/g, "-")}.pdf`,
        status: p.v === "approved" ? "approved" : p.v === "rejected" && type === "CAC certificate" ? "rejected" : "under_review",
        uploadedAt: iso(subDays(now, p.days)),
      })),
      joinedAt: iso(subDays(now, p.days)),
      commissionRate: 15,
      rejectionReason: p.v === "rejected" ? "CAC certificate name does not match the registered company name." : undefined,
    };
  });
  usedNames.add("Greenline Haulage Ltd");

  // ---- Vehicles ----
  const vehicles: Vehicle[] = [];
  const activePartners = partners.filter((p) => p.verification === "approved");
  activePartners.forEach((p, pi) => {
    const count = pi === 0 ? 9 : int(4, 7);
    const plateCode = PLATE_CODES[p.operatingStates[0]] ?? "LND";
    for (let i = 0; i < count; i++) {
      const category: VehicleCategory = i < Math.ceil(count * 0.6) ? "motorcycle" : pick(["van", "tricycle", "car", "pickup_truck", i === count - 1 ? "truck" : "van"] as const);
      const [make, model] = pick(VEHICLE_MODELS[category]);
      vehicles.push({
        id: id("veh"),
        partnerId: p.id,
        category,
        make,
        model,
        year: int(2017, 2025),
        plate: `${plateCode}-${int(100, 999)}${pick(["AA", "KJ", "XY", "GG", "EP", "BD"])}`,
        color: pick(["Red", "Black", "White", "Silver", "Blue"]),
        capacityKg: VEHICLE_CATEGORIES[category].capacityKg,
        availability: i === count - 1 ? "maintenance" : "available",
        createdAt: iso(subDays(now, int(30, 300))),
      });
    }
    p.fleetSize = count;
  });

  // ---- Riders ----
  const riders: Rider[] = [];
  const riderSpecs: { state: string; partner?: Partner; v: Rider["verification"]; avail: Rider["availability"]; days: number }[] = [
    { state: "Lagos", partner: partners[0], v: "approved", avail: "online", days: 300 },
    ...Array.from({ length: 5 }, (_, i) => ({ state: i < 4 ? "Lagos" : "Ogun", partner: partners[0], v: "approved" as const, avail: pick(["online", "online", "busy", "offline"] as const), days: int(60, 300) })),
    ...Array.from({ length: 4 }, () => ({ state: "Lagos", partner: partners[1], v: "approved" as const, avail: pick(["online", "busy", "offline"] as const), days: int(60, 280) })),
    ...Array.from({ length: 4 }, () => ({ state: "FCT", partner: partners[2], v: "approved" as const, avail: pick(["online", "busy", "offline"] as const), days: int(60, 240) })),
    ...Array.from({ length: 3 }, () => ({ state: "Rivers", partner: partners[3], v: "approved" as const, avail: pick(["online", "offline"] as const), days: int(60, 190) })),
    { state: "Oyo", v: "approved", avail: "online", days: 150 },
    { state: "Oyo", v: "approved", avail: "offline", days: 110 },
    { state: "Kano", v: "approved", avail: "online", days: 90 },
    { state: "Enugu", v: "approved", avail: "online", days: 80 },
    { state: "Lagos", v: "under_review", avail: "offline", days: 2 },
    { state: "Lagos", partner: partners[0], v: "under_review", avail: "offline", days: 4 },
    { state: "FCT", v: "under_review", avail: "offline", days: 1 },
    { state: "Oyo", v: "rejected", avail: "offline", days: 20 },
    { state: "Lagos", v: "not_submitted", avail: "offline", days: 1 },
  ];
  riderSpecs.forEach((spec, i) => {
    const name = i === 0 ? DEMO_ACCOUNTS.rider.name : personName();
    if (i === 0) usedNames.add(name);
    const addrPool = SAMPLE_ADDRESSES.filter((a) => a.state === spec.state);
    const addr = addrPool.length ? pick(addrPool) : { address: `12 Market Road, ${spec.state}`, lga: spec.state, state: spec.state, landmark: "" };
    const user = addUser({
      id: i === 0 ? "usr_rider" : id("usr"),
      role: "rider",
      name,
      email: i === 0 ? DEMO_ACCOUNTS.rider.email : emailFor(name, "yahoo.com"),
      phone: i === 0 ? "08061112233" : phone(),
      state: spec.state,
      city: addr.lga,
      createdAt: iso(subDays(now, spec.days)),
      emailVerified: spec.v !== "not_submitted",
    });
    const riderId = i === 0 ? "rdr_chinedu" : id("rdr");
    user.profileId = riderId;
    const partnerVehicles = spec.partner ? vehicles.filter((v) => v.partnerId === spec.partner!.id && !v.assignedRiderId && v.availability !== "maintenance") : [];
    const vehicle = spec.v === "approved" ? partnerVehicles[0] : undefined;
    const vehicleType: VehicleCategory = vehicle?.category ?? (rand() < 0.8 ? "motorcycle" : "tricycle");
    const plateCode = PLATE_CODES[spec.state] ?? "LND";
    const docStatus = spec.v === "not_submitted" ? "not_submitted" : spec.v;
    const rider: Rider = {
      id: riderId,
      userId: user.id,
      name,
      email: user.email,
      phone: user.phone,
      address: addr.address,
      state: spec.state,
      lga: addr.lga,
      vehicleType,
      vehiclePlate: vehicle?.plate ?? `${plateCode}-${int(100, 999)}${pick(["QA", "KT", "MN"])}`,
      availability: spec.avail,
      verification: spec.v,
      status: i === 15 ? "suspended" : "active",
      partnerId: spec.partner?.id,
      vehicleId: vehicle?.id,
      rating: spec.v === "approved" ? Math.round(between(4.2, 4.95) * 10) / 10 : 0,
      documents: RIDER_DOCUMENT_TYPES.map((type, di) => ({
        id: id("doc"),
        type,
        fileName: docStatus === "not_submitted" ? "" : `${type.toLowerCase().replace(/[^a-z]+/g, "-")}.jpg`,
        status: spec.v === "rejected" && di === 0 ? "rejected" : docStatus === "rejected" ? "approved" : docStatus,
        uploadedAt: docStatus === "not_submitted" ? undefined : iso(subDays(now, spec.days)),
        note: spec.v === "rejected" && di === 0 ? "Licence has expired. Please upload a valid licence." : undefined,
      })),
      bank:
        spec.v === "approved"
          ? { bankName: pick(NIGERIAN_BANKS), accountNumber: String(int(1000000000, 9999999999)), accountName: name.toUpperCase() }
          : undefined,
      joinedAt: iso(subDays(now, spec.days)),
      rejectionReason: spec.v === "rejected" ? "Driver's licence expired." : undefined,
    };
    if (i === 0) rider.bank = { bankName: "Guaranty Trust Bank", accountNumber: "0123456789", accountName: "CHINEDU EZE" };
    if (vehicle) vehicle.assignedRiderId = rider.id;
    riders.push(rider);
  });
  const approvedRiders = riders.filter((r) => r.verification === "approved" && r.status === "active");

  // ---- Saved addresses ----
  const addresses: SavedAddress[] = [];
  customers.forEach((c) => {
    const pool = SAMPLE_ADDRESSES.filter((a) => a.state === c.state);
    const own = pool.length ? pool : SAMPLE_ADDRESSES.slice(0, 3);
    const count = c.id === "usr_customer" ? 3 : 1;
    const homes = c.id === "usr_customer" ? [own[2], own[3], own[6]] : [pick(own)];
    homes.slice(0, count).forEach((a, i) => {
      addresses.push({
        id: id("adr"),
        customerId: c.id,
        label: ["Home", "Office", "Shop"][i],
        name: c.name,
        phone: c.phone,
        address: a.address,
        state: a.state,
        lga: a.lga,
        landmark: a.landmark,
        isDefault: i === 0,
      });
    });
  });

  // ---- Shipments ----
  const shipments: Shipment[] = [];
  const transactions: Transaction[] = [];
  const customerWeights = customers.map((c, i) => (i === 0 ? 7 : c.status === "suspended" ? 1 : 3));
  const totalW = customerWeights.reduce((a, b) => a + b, 0);
  const pickCustomer = () => {
    let r = rand() * totalW;
    for (let i = 0; i < customers.length; i++) {
      r -= customerWeights[i];
      if (r <= 0) return customers[i];
    }
    return customers[0];
  };

  const makeShipment = (opts: { customer: User; createdAt: Date; status: ShipmentStatus; riderPreferred?: Rider; forceLocal?: boolean; cancelledAfter?: ShipmentStatus }) => {
    const { customer, createdAt, status } = opts;
    const own = addresses.filter((a) => a.customerId === customer.id);
    const from = own.length && rand() < 0.75 ? pick(own) : null;
    const fromSample = pick(SAMPLE_ADDRESSES.filter((a) => a.state === customer.state).length ? SAMPLE_ADDRESSES.filter((a) => a.state === customer.state) : SAMPLE_ADDRESSES);
    const intercity = !opts.forceLocal && rand() < 0.14;
    const destPool = SAMPLE_ADDRESSES.filter((a) => (intercity ? a.state !== customer.state : a.state === customer.state && a.address !== (from?.address ?? fromSample.address)));
    const dest = pick(destPool.length ? destPool : SAMPLE_ADDRESSES);
    const pkgSample = pick(PACKAGE_SAMPLES);
    const quantity = rand() < 0.85 ? 1 : int(2, 5);
    const weightKg = Math.round(between(pkgSample.weight[0], pkgSample.weight[1]) * 10) / 10;
    const deliveryType: DeliveryType = intercity ? pick(["standard", "standard", "express"] as const) : pick(["standard", "express", "same_day", "same_day", "scheduled", "express"] as const);
    const sender = {
      name: customer.name,
      phone: customer.phone,
      address: from?.address ?? fromSample.address,
      state: from?.state ?? fromSample.state,
      lga: from?.lga ?? fromSample.lga,
      landmark: from?.landmark ?? fromSample.landmark,
      instructions: rand() < 0.3 ? "Call on arrival, gate is usually locked." : undefined,
    };
    const recipientName = personName();
    const recipient = {
      name: recipientName,
      phone: phone(),
      address: dest.address,
      state: dest.state,
      lga: dest.lga,
      landmark: dest.landmark,
      instructions: rand() < 0.35 ? pick(["Leave with security if not available.", "Deliver to the reception desk.", "Call 10 minutes before arrival."]) : undefined,
    };
    const dist = estimateDistanceKm(sender, recipient);
    const fragile = pkgSample.category === "electronics" || (pkgSample.category === "household" && rand() < 0.5);
    const price = calculatePrice({ distanceKm: dist.km, intercity: dist.intercity, weightKg, quantity, fragile, deliveryType }, DEFAULT_PRICING);
    const travel = estimateTravelMinutes(dist.km, dist.intercity);
    const totalMinutes = travel + int(45, 180);
    const scheduledFor = deliveryType === "scheduled" ? addHours(createdAt, int(18, 60)) : undefined;
    const deadline = scheduledFor ?? addHours(createdAt, dist.intercity ? 48 : DELIVERY_TYPES[deliveryType].hours);

    let rider: Rider | undefined;
    const idx = STATUS_FLOW.indexOf(status === "cancelled" ? opts.cancelledAfter ?? "pending" : status);
    if (idx >= STATUS_FLOW.indexOf("assigned")) {
      rider = opts.riderPreferred ?? pick(approvedRiders.filter((r) => r.state === sender.state).length ? approvedRiders.filter((r) => r.state === sender.state) : approvedRiders);
    }
    const timeline = buildTimeline(status, createdAt, totalMinutes, opts.cancelledAfter);
    const paid = status !== "pending";
    const s: Shipment = {
      id: id("shp"),
      reference: ref(),
      customerId: customer.id,
      sender,
      recipient,
      package: {
        category: pkgSample.category,
        description: pkgSample.description,
        weightKg,
        lengthCm: int(15, 60),
        widthCm: int(10, 45),
        heightCm: int(5, 40),
        quantity,
        fragile,
      },
      deliveryType,
      scheduledFor: scheduledFor ? iso(scheduledFor) : undefined,
      distanceKm: dist.km,
      intercity: dist.intercity,
      price,
      amount: price.total,
      riderEarning: riderEarningFor(price.total, DEFAULT_PRICING),
      paymentStatus: status === "cancelled" ? "refunded" : paid ? "paid" : "pending",
      paymentMethod: pick(["card", "card", "bank_transfer", "wallet", "ussd"] as const),
      status,
      riderId: rider?.id,
      partnerId: rider?.partnerId,
      pin: String(int(1000, 9999)),
      createdAt: iso(createdAt),
      deadline: iso(deadline),
      estimatedArrival: iso(addMinutes(createdAt, totalMinutes)),
      deliveredAt: status === "delivered" ? timeline[timeline.length - 1].at : undefined,
      timeline,
    };
    shipments.push(s);
    transactions.push({
      id: id("txn"),
      reference: `TXN-${String(int(100000000, 999999999))}`,
      customerId: customer.id,
      shipmentId: s.id,
      amount: s.amount,
      method: s.paymentMethod,
      status: status === "cancelled" ? "refunded" : paid ? "successful" : "pending",
      createdAt: iso(addMinutes(createdAt, 1)),
    });
    if (rand() < 0.05 && paid) {
      transactions.push({
        id: id("txn"),
        reference: `TXN-${String(int(100000000, 999999999))}`,
        customerId: customer.id,
        shipmentId: s.id,
        amount: s.amount,
        method: "card",
        status: "failed",
        createdAt: iso(createdAt),
      });
    }
    return s;
  };

  // Historical shipments across the last 6 months, increasing volume over time.
  for (let d = 180; d >= 2; d--) {
    const perDay = d > 120 ? (rand() < 0.6 ? 1 : 0) : d > 60 ? int(0, 2) : int(1, 3);
    for (let k = 0; k < perDay; k++) {
      const createdAt = subMinutes(subDays(now, d), int(0, 600) - 300);
      const roll = rand();
      const status: ShipmentStatus = roll < 0.9 ? "delivered" : "cancelled";
      makeShipment({ customer: pickCustomer(), createdAt, status, cancelledAfter: pick(["pending", "confirmed", "assigned"] as const) });
    }
  }

  // Demo rider history: guarantee a meaningful record of completed work.
  const demoRider = riders[0];
  const demoCustomer = customers[0];
  for (let k = 0; k < 18; k++) {
    makeShipment({ customer: pick(customers.filter((c) => c.state === "Lagos")), createdAt: subHours(subDays(now, int(1, 40)), int(0, 10)), status: "delivered", riderPreferred: demoRider, forceLocal: true });
  }

  // Live and recent shipments.
  const live: { status: ShipmentStatus; customer?: User; rider?: Rider; hoursAgo: number }[] = [
    { status: "assigned", customer: demoCustomer, rider: demoRider, hoursAgo: 0.6 },
    { status: "picked_up", customer: customers[4], rider: demoRider, hoursAgo: 1.4 },
    { status: "in_transit", customer: demoCustomer, hoursAgo: 2 },
    { status: "pending", customer: demoCustomer, hoursAgo: 0.2 },
    { status: "confirmed", customer: demoCustomer, hoursAgo: 0.5 },
    { status: "en_route_pickup", customer: customers[1], hoursAgo: 0.8 },
    { status: "arrived", customer: customers[7], hoursAgo: 2.5 },
    { status: "in_transit", customer: customers[2], hoursAgo: 1.8 },
    { status: "accepted", customer: customers[3], hoursAgo: 0.4 },
    { status: "picked_up", customer: customers[5], hoursAgo: 1.2 },
    { status: "delivered", customer: demoCustomer, rider: demoRider, hoursAgo: 20 },
    { status: "delivered", customer: demoCustomer, hoursAgo: 30 },
    { status: "cancelled", customer: demoCustomer, hoursAgo: 26 },
  ];
  live.forEach((l) => {
    makeShipment({ customer: l.customer ?? pickCustomer(), createdAt: subMinutes(now, Math.round(l.hoursAgo * 60)), status: l.status, riderPreferred: l.rider, forceLocal: true });
  });

  // Unassigned, confirmed jobs on the open marketplace (mostly Lagos so the demo rider sees them).
  const jobCustomers = customers.filter((c) => c.status === "active" && c.id !== "usr_customer");
  for (let k = 0; k < 9; k++) {
    const c = k < 6 ? pick(jobCustomers.filter((x) => x.state === "Lagos")) : pick(jobCustomers);
    makeShipment({ customer: c, createdAt: subMinutes(now, int(5, 90)), status: "confirmed", forceLocal: k < 7 });
  }

  // Mark riders with live jobs as busy.
  shipments
    .filter((s) => s.riderId && ["accepted", "en_route_pickup", "picked_up", "in_transit", "arrived"].includes(s.status))
    .forEach((s) => {
      const r = riders.find((x) => x.id === s.riderId);
      if (r && r.id !== demoRider.id) r.availability = "busy";
    });

  shipments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  transactions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // ---- Payouts ----
  const payouts: Payout[] = [];
  approvedRiders.forEach((r) => {
    const earned = shipments.filter((s) => s.riderId === r.id && s.status === "delivered").reduce((sum, s) => sum + s.riderEarning, 0);
    let remaining = earned * 0.75;
    let daysAgo = 3;
    while (remaining > 5000 && r.bank) {
      const amount = Math.min(remaining, Math.round(between(15000, 60000) / 500) * 500);
      payouts.push({
        id: id("pay"),
        reference: `PO-${String(int(100000, 999999))}`,
        riderId: r.id,
        amount,
        status: "paid",
        bankName: r.bank.bankName,
        accountNumber: r.bank.accountNumber,
        accountName: r.bank.accountName,
        requestedAt: iso(subDays(now, daysAgo + 1)),
        processedAt: iso(subDays(now, daysAgo)),
      });
      remaining -= amount;
      daysAgo += int(6, 14);
    }
  });
  // A few pending requests for the admin queue.
  approvedRiders.slice(1, 5).forEach((r, i) => {
    if (!r.bank) return;
    payouts.push({
      id: id("pay"),
      reference: `PO-${String(int(100000, 999999))}`,
      riderId: r.id,
      amount: [12500, 18000, 9500, 22000][i],
      status: "pending",
      bankName: r.bank.bankName,
      accountNumber: r.bank.accountNumber,
      accountName: r.bank.accountName,
      requestedAt: iso(subHours(now, int(2, 30))),
    });
  });
  payouts.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));

  // ---- Notifications ----
  const demoShip = shipments.filter((s) => s.customerId === "usr_customer");
  const inTransit = demoShip.find((s) => s.status === "in_transit");
  const notifications: AppNotification[] = [
    { id: id("ntf"), userId: "usr_customer", title: "Your package is on the way", body: `${inTransit?.reference ?? "Your shipment"} is out for delivery.`, type: "shipment", read: false, createdAt: iso(subMinutes(now, 40)), href: inTransit ? `/customer/shipments/${inTransit.id}` : undefined },
    { id: id("ntf"), userId: "usr_customer", title: "Rider assigned", body: `${demoRider.name} will pick up your package shortly.`, type: "shipment", read: false, createdAt: iso(subMinutes(now, 30)) },
    { id: id("ntf"), userId: "usr_customer", title: "Payment received", body: "We received your payment. Receipt is available under Payments.", type: "payment", read: true, createdAt: iso(subHours(now, 5)), href: "/customer/payments" },
    { id: id("ntf"), userId: "usr_customer", title: "Delivered", body: "Your package was delivered and confirmed with your PIN.", type: "shipment", read: true, createdAt: iso(subHours(now, 19)) },
    { id: id("ntf"), userId: "usr_rider", title: "New delivery assigned", body: "You have a new pickup in Lekki Phase 1. Accept to proceed.", type: "shipment", read: false, createdAt: iso(subMinutes(now, 35)), href: "/rider/deliveries" },
    { id: id("ntf"), userId: "usr_rider", title: "Payout completed", body: "Your last payout has been sent to your GTBank account.", type: "payout", read: false, createdAt: iso(subDays(now, 3)), href: "/rider/payouts" },
    { id: id("ntf"), userId: "usr_rider", title: "Weekly summary", body: "Great work. Your rating this week is 4.9.", type: "system", read: true, createdAt: iso(subDays(now, 2)) },
    { id: id("ntf"), userId: "usr_partner", title: "Rider application", body: "A new rider joined your fleet and is awaiting verification.", type: "account", read: false, createdAt: iso(subDays(now, 4)), href: "/partner/riders" },
    { id: id("ntf"), userId: "usr_partner", title: "Pending assignments", body: "There are deliveries in your coverage waiting for a rider.", type: "shipment", read: false, createdAt: iso(subMinutes(now, 50)), href: "/partner/assignments" },
    { id: id("ntf"), userId: "usr_partner", title: "Weekly settlement", body: "Your weekly earnings statement is ready.", type: "payment", read: true, createdAt: iso(subDays(now, 5)), href: "/partner/earnings" },
    { id: id("ntf"), role: "admin", title: "Verification queue", body: "3 riders and 2 logistics companies are awaiting review.", type: "account", read: false, createdAt: iso(subMinutes(now, 20)), href: "/admin/riders" },
    { id: id("ntf"), role: "admin", title: "Payout requests", body: "4 rider payout requests need approval.", type: "payout", read: false, createdAt: iso(subHours(now, 2)), href: "/admin/payouts" },
    { id: id("ntf"), role: "admin", title: "Failed payment spike", body: "Card failures are slightly above average today.", type: "payment", read: true, createdAt: iso(subHours(now, 7)), href: "/admin/payments" },
  ];

  // ---- Support tickets ----
  const ticketSpecs: { user: User; subject: string; category: SupportTicket["category"]; priority: SupportTicket["priority"]; status: SupportTicket["status"]; hours: number; msg: string; reply?: string }[] = [
    { user: customers[0], subject: "Rider arrived late for pickup", category: "delivery", priority: "medium", status: "resolved", hours: 70, msg: "The rider came about 40 minutes after the estimated time.", reply: "Sorry about the delay. We have applied a ₦500 credit to your next delivery." },
    { user: customers[1], subject: "Charged twice for one delivery", category: "payment", priority: "high", status: "in_progress", hours: 9, msg: "My card was debited twice for the same shipment.", reply: "We can see the duplicate attempt. A reversal is being processed." },
    { user: customers[2], subject: "Cannot update my phone number", category: "account", priority: "low", status: "open", hours: 4, msg: "The profile page does not save my new number." },
    { user: customers[5], subject: "Package arrived damaged", category: "delivery", priority: "urgent", status: "open", hours: 2, msg: "The blender box was crushed on arrival. Please advise." },
    { user: users.find((u) => u.id === "usr_rider")!, subject: "Payout not yet received", category: "payment", priority: "medium", status: "closed", hours: 200, msg: "I requested a payout three days ago.", reply: "Payout was completed. Bank delays can take up to 24 hours." },
    { user: customers[7], subject: "App shows wrong ETA", category: "technical", priority: "low", status: "resolved", hours: 120, msg: "ETA kept changing during delivery.", reply: "Thanks, the ETA calculation has been improved." },
  ];
  const tickets: SupportTicket[] = ticketSpecs.map((t) => {
    const created = subHours(now, t.hours);
    return {
      id: id("tkt"),
      reference: `TCK-${int(10000, 99999)}`,
      userId: t.user.id,
      role: t.user.role,
      subject: t.subject,
      category: t.category,
      priority: t.priority,
      status: t.status,
      messages: [
        { id: id("msg"), author: t.user.name, fromStaff: false, body: t.msg, at: iso(created) },
        ...(t.reply ? [{ id: id("msg"), author: "Kemi (SwiftLogix Support)", fromStaff: true, body: t.reply, at: iso(addHours(created, 1)) }] : []),
      ],
      createdAt: iso(created),
      updatedAt: iso(t.reply ? addHours(created, 1) : created),
    };
  });

  // ---- Audit logs ----
  const auditLogs: AuditLog[] = [
    { id: id("aud"), actorId: admin.id, actorName: admin.name, actorRole: "admin", action: "Approved rider application", target: riders[3].name, category: "rider", at: iso(subDays(now, 2)) },
    { id: id("aud"), actorId: admin.id, actorName: admin.name, actorRole: "admin", action: "Updated express surcharge to 45%", target: "Pricing", category: "pricing", at: iso(subDays(now, 6)) },
    { id: id("aud"), actorId: "usr_admin2", actorName: "Kemi Adeleke", actorRole: "admin", action: "Approved payout", target: "PO-482910", category: "payout", at: iso(subDays(now, 3)) },
    { id: id("aud"), actorId: admin.id, actorName: admin.name, actorRole: "admin", action: "Rejected partner application", target: "Coastal Dash Logistics", category: "partner", at: iso(subDays(now, 38)) },
    { id: id("aud"), actorId: admin.id, actorName: admin.name, actorRole: "admin", action: "Suspended customer account", target: customers[10].name, category: "user", at: iso(subDays(now, 9)) },
    { id: id("aud"), actorId: "usr_partner", actorName: "Greenline Haulage Ltd", actorRole: "partner", action: "Registered vehicle", target: vehicles[2]?.plate ?? "Vehicle", category: "fleet", at: iso(subDays(now, 12)) },
    { id: id("aud"), actorId: "system", actorName: "System", actorRole: "system", action: "Daily settlement batch completed", target: "Settlements", category: "payment", at: iso(subHours(now, 10)) },
    { id: id("aud"), actorId: "usr_admin2", actorName: "Kemi Adeleke", actorRole: "admin", action: "Signed in", target: "Admin console", category: "auth", at: iso(subHours(now, 3)) },
  ].sort((a, b) => b.at.localeCompare(a.at)) as AuditLog[];

  const settings: PlatformSettings = {
    platformName: "SwiftLogix",
    supportEmail: "support@swiftlogix.ng",
    supportPhone: "+234 700 794 3856",
    maintenanceMode: false,
    autoAssignRiders: false,
    requireRiderVerification: true,
    maxActiveJobsPerRider: 3,
  };

  return { users, riders, partners, vehicles, shipments, transactions, payouts, notifications, addresses, tickets, auditLogs, settings };
}
