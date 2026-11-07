"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { addHours, addMinutes } from "date-fns";
import type {
  AppNotification,
  AuditLog,
  BankAccount,
  ContactPoint,
  DeliveryType,
  PackageInfo,
  Partner,
  Payout,
  PlatformSettings,
  PricingConfig,
  Rider,
  RiderAvailability,
  Role,
  SavedAddress,
  ServiceCategory,
  Session,
  Shipment,
  ShipmentStatus,
  SupportTicket,
  TicketStatus,
  Transaction,
  User,
  Vehicle,
  VehicleCategory,
  VerificationDocument,
} from "@/types";
import { createSeedData, DEMO_ACCOUNTS, DEMO_PASSWORD, type SeedData } from "@/lib/mock-data/seed";
import { DEFAULT_PRICING, calculatePrice, riderEarningFor } from "@/lib/calculations/pricing";
import { estimateDistanceKm, estimateTravelMinutes } from "@/lib/calculations/distance";
import { CANCELLABLE_STATUSES, DELIVERY_TYPES, PARTNER_DOCUMENT_TYPES, RIDER_DOCUMENT_TYPES, TIMELINE_LABELS, VEHICLE_CATEGORIES } from "@/lib/constants";
import { fourDigitPin, shipmentReference, txReference, uid } from "@/lib/utils";

type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string };
const ok = <T,>(data: T): Result<T> => ({ ok: true, data });
const fail = (error: string): Result<never> => ({ ok: false, error });

export interface NewShipmentInput {
  customerId: string;
  sender: ContactPoint;
  recipient: ContactPoint;
  package: PackageInfo;
  deliveryType: DeliveryType;
  scheduledFor?: string;
  paymentMethod: Shipment["paymentMethod"];
}

export interface RiderRegistrationInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  address: string;
  state: string;
  lga: string;
  vehicleType: VehicleCategory;
  vehiclePlate: string;
  avatarUrl?: string;
  documents: { type: string; fileName: string; previewUrl?: string }[];
  partnerId?: string;
}

export interface PartnerRegistrationInput {
  companyName: string;
  email: string;
  phone: string;
  password: string;
  address: string;
  state: string;
  cacNumber: string;
  description: string;
  operatingStates: string[];
  services: ServiceCategory[];
  fleetSize: number;
  documents: { type: string; fileName: string; previewUrl?: string }[];
}

interface StoreState extends SeedData {
  pricing: PricingConfig;
  session: Session | null;
  /** Pending password-reset tokens keyed by email (demo only). */
  resetTokens: Record<string, string>;
  seededAt: string;

  // auth
  login: (email: string, password: string) => Result<User>;
  loginAs: (role: Role) => Result<User>;
  logout: () => void;
  registerCustomer: (input: { name: string; email: string; phone: string; password: string; state: string; city: string }) => Result<User>;
  registerRider: (input: RiderRegistrationInput) => Result<User>;
  registerPartner: (input: PartnerRegistrationInput) => Result<User>;
  verifyEmail: (userId: string) => void;
  requestPasswordReset: (email: string) => Result<string>;
  resetPassword: (email: string, token: string, password: string) => Result;
  updateUser: (userId: string, patch: Partial<Pick<User, "name" | "phone" | "state" | "city" | "avatarUrl" | "preferences" | "email">>) => void;
  changePassword: (userId: string, current: string, next: string) => Result;
  setUserStatus: (userId: string, status: User["status"]) => void;

  // shipments
  createShipment: (input: NewShipmentInput) => Result<Shipment>;
  cancelShipment: (shipmentId: string, reason?: string) => Result;
  assignRider: (shipmentId: string, riderId: string) => Result;
  acceptJob: (shipmentId: string, riderId: string) => Result;
  declineAssignment: (shipmentId: string) => Result;
  advanceShipment: (shipmentId: string, next: ShipmentStatus) => Result;
  confirmDelivery: (shipmentId: string, pin: string) => Result;
  partnerClaimShipment: (shipmentId: string, partnerId: string) => Result;
  partnerReleaseShipment: (shipmentId: string) => Result;

  // riders
  setAvailability: (riderId: string, availability: RiderAvailability) => void;
  submitRiderDocuments: (riderId: string, docs: { type: string; fileName: string; previewUrl?: string }[]) => void;
  reviewRider: (riderId: string, decision: "approved" | "rejected", reason?: string) => void;
  setRiderStatus: (riderId: string, status: Rider["status"]) => void;
  updateRider: (riderId: string, patch: Partial<Pick<Rider, "name" | "phone" | "address" | "state" | "lga" | "avatarUrl" | "vehiclePlate" | "vehicleType">>) => void;
  updateRiderBank: (riderId: string, bank: BankAccount) => void;
  assignVehicle: (riderId: string, vehicleId: string | null) => Result;
  partnerAddRider: (partnerId: string, input: Omit<RiderRegistrationInput, "password" | "documents"> & { documents?: RiderRegistrationInput["documents"] }) => Result<Rider>;

  // partners and fleet
  reviewPartner: (partnerId: string, decision: "approved" | "rejected", reason?: string) => void;
  setPartnerStatus: (partnerId: string, status: Partner["status"]) => void;
  updatePartner: (partnerId: string, patch: Partial<Pick<Partner, "companyName" | "phone" | "address" | "description" | "operatingStates" | "services">>) => void;
  addVehicle: (input: Omit<Vehicle, "id" | "createdAt" | "capacityKg"> & { capacityKg?: number }) => Result<Vehicle>;
  updateVehicle: (vehicleId: string, patch: Partial<Omit<Vehicle, "id" | "partnerId">>) => Result;
  removeVehicle: (vehicleId: string) => Result;

  // payments
  requestPayout: (riderId: string, amount: number, available: number) => Result<Payout>;
  reviewPayout: (payoutId: string, decision: "approved" | "rejected" | "paid", note?: string) => void;
  retryPayment: (transactionId: string) => Result;
  refundTransaction: (transactionId: string) => Result;
  updatePricing: (config: PricingConfig) => void;

  // misc
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string, role: Role) => void;
  deleteNotification: (id: string) => void;
  saveAddress: (address: Omit<SavedAddress, "id"> & { id?: string }) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  createTicket: (input: Pick<SupportTicket, "subject" | "category" | "priority" | "shipmentRef"> & { userId: string; message: string }) => Result<SupportTicket>;
  replyTicket: (ticketId: string, body: string, fromStaff: boolean) => void;
  setTicketStatus: (ticketId: string, status: TicketStatus) => void;
  updateSettings: (patch: Partial<PlatformSettings>) => void;
  resetDemo: () => void;
}

const now = () => new Date().toISOString();

function event(status: ShipmentStatus, note?: string) {
  return { status, label: TIMELINE_LABELS[status], at: now(), note };
}

const ALLOWED_NEXT: Partial<Record<ShipmentStatus, ShipmentStatus[]>> = {
  assigned: ["accepted"],
  accepted: ["en_route_pickup"],
  en_route_pickup: ["picked_up"],
  picked_up: ["in_transit"],
  in_transit: ["arrived"],
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => {
      const currentUser = () => {
        const s = get().session;
        return s ? get().users.find((u) => u.id === s.userId) : undefined;
      };

      const audit = (action: string, target: string, category: AuditLog["category"]) => {
        const u = currentUser();
        const log: AuditLog = {
          id: uid("aud"),
          actorId: u?.id ?? "system",
          actorName: u?.name ?? "System",
          actorRole: u?.role ?? "system",
          action,
          target,
          category,
          at: now(),
        };
        set((s) => ({ auditLogs: [log, ...s.auditLogs].slice(0, 500) }));
      };

      const notify = (n: Omit<AppNotification, "id" | "read" | "createdAt">) => {
        set((s) => ({ notifications: [{ ...n, id: uid("ntf"), read: false, createdAt: now() }, ...s.notifications].slice(0, 300) }));
      };

      const patchShipment = (id: string, fn: (s: Shipment) => Shipment) =>
        set((state) => ({ shipments: state.shipments.map((s) => (s.id === id ? fn(s) : s)) }));

      const riderUserId = (riderId?: string) => get().riders.find((r) => r.id === riderId)?.userId;
      const partnerUserId = (partnerId?: string) => get().partners.find((p) => p.id === partnerId)?.userId;

      const emailTaken = (email: string) => get().users.some((u) => u.email.toLowerCase() === email.toLowerCase());

      const startSession = (user: User) => set({ session: { userId: user.id, role: user.role, signedInAt: now() } });

      const makeDocs = (types: string[], submitted: { type: string; fileName: string; previewUrl?: string }[]): VerificationDocument[] =>
        types.map((type) => {
          const found = submitted.find((d) => d.type === type);
          return {
            id: uid("doc"),
            type,
            fileName: found?.fileName ?? "",
            previewUrl: found?.previewUrl,
            status: found ? "under_review" : "not_submitted",
            uploadedAt: found ? now() : undefined,
          };
        });

      return {
        ...createSeedData(),
        pricing: DEFAULT_PRICING,
        session: null,
        resetTokens: {},
        seededAt: now(),

        // ---------------- auth ----------------
        login: (email, password) => {
          const user = get().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
          if (!user || user.password !== password) return fail("Incorrect email or password.");
          if (user.status === "suspended") return fail("This account has been suspended. Contact support for help.");
          startSession(user);
          return ok(user);
        },
        loginAs: (role) => {
          const user = get().users.find((u) => u.email === DEMO_ACCOUNTS[role].email);
          if (!user) return fail("Demo account not found. Reset the demo data and try again.");
          if (user.status === "suspended") set((s) => ({ users: s.users.map((u) => (u.id === user.id ? { ...u, status: "active" } : u)) }));
          startSession(user);
          return ok(user);
        },
        logout: () => set({ session: null }),

        registerCustomer: (input) => {
          if (emailTaken(input.email)) return fail("An account with this email already exists.");
          const user: User = {
            id: uid("usr"),
            role: "customer",
            name: input.name,
            email: input.email.toLowerCase(),
            phone: input.phone,
            password: input.password,
            state: input.state,
            city: input.city,
            status: "active",
            emailVerified: false,
            createdAt: now(),
            preferences: { email: true, sms: true, push: true, shipmentUpdates: true, promotions: false },
          };
          set((s) => ({ users: [...s.users, user] }));
          startSession(user);
          notify({ userId: user.id, title: "Welcome to SwiftLogix", body: "Your account is ready. Book your first delivery in minutes.", type: "account", href: "/customer/book" });
          notify({ role: "admin", title: "New customer", body: `${user.name} just registered from ${user.state}.`, type: "account", href: "/admin/customers" });
          return ok(user);
        },

        registerRider: (input) => {
          if (emailTaken(input.email)) return fail("An account with this email already exists.");
          const userId = uid("usr");
          const riderId = uid("rdr");
          const user: User = {
            id: userId,
            role: "rider",
            name: input.name,
            email: input.email.toLowerCase(),
            phone: input.phone,
            password: input.password,
            state: input.state,
            city: input.lga,
            status: "active",
            emailVerified: false,
            createdAt: now(),
            avatarUrl: input.avatarUrl,
            profileId: riderId,
            preferences: { email: true, sms: true, push: true, shipmentUpdates: true, promotions: false },
          };
          const rider: Rider = {
            id: riderId,
            userId,
            name: input.name,
            email: user.email,
            phone: input.phone,
            avatarUrl: input.avatarUrl,
            address: input.address,
            state: input.state,
            lga: input.lga,
            vehicleType: input.vehicleType,
            vehiclePlate: input.vehiclePlate.toUpperCase(),
            availability: "offline",
            verification: input.documents.length ? "under_review" : "not_submitted",
            status: "active",
            partnerId: input.partnerId,
            rating: 0,
            documents: makeDocs(RIDER_DOCUMENT_TYPES, input.documents),
            joinedAt: now(),
          };
          set((s) => ({ users: [...s.users, user], riders: [...s.riders, rider] }));
          startSession(user);
          notify({ userId, title: "Application received", body: "Your documents are under review. This usually takes 24 to 48 hours.", type: "account", href: "/rider/verification" });
          notify({ role: "admin", title: "New rider application", body: `${rider.name} (${rider.state}) submitted documents for review.`, type: "account", href: `/admin/riders/${rider.id}` });
          return ok(user);
        },

        registerPartner: (input) => {
          if (emailTaken(input.email)) return fail("An account with this email already exists.");
          const userId = uid("usr");
          const partnerId = uid("ptn");
          const user: User = {
            id: userId,
            role: "partner",
            name: input.companyName,
            email: input.email.toLowerCase(),
            phone: input.phone,
            password: input.password,
            state: input.state,
            city: input.state,
            status: "active",
            emailVerified: false,
            createdAt: now(),
            profileId: partnerId,
            preferences: { email: true, sms: true, push: true, shipmentUpdates: true, promotions: false },
          };
          const partner: Partner = {
            id: partnerId,
            userId,
            companyName: input.companyName,
            email: user.email,
            phone: input.phone,
            address: input.address,
            cacNumber: input.cacNumber.toUpperCase(),
            description: input.description,
            operatingStates: input.operatingStates,
            services: input.services,
            fleetSize: input.fleetSize,
            verification: "under_review",
            status: "active",
            documents: makeDocs(PARTNER_DOCUMENT_TYPES, input.documents),
            joinedAt: now(),
            commissionRate: 15,
          };
          set((s) => ({ users: [...s.users, user], partners: [...s.partners, partner] }));
          startSession(user);
          notify({ userId, title: "Application received", body: "Our partnerships team is reviewing your company documents.", type: "account" });
          notify({ role: "admin", title: "New partner application", body: `${partner.companyName} applied to join as a logistics partner.`, type: "account", href: `/admin/partners/${partner.id}` });
          return ok(user);
        },

        verifyEmail: (userId) => set((s) => ({ users: s.users.map((u) => (u.id === userId ? { ...u, emailVerified: true } : u)) })),

        requestPasswordReset: (email) => {
          const user = get().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
          // Always behave the same to avoid account enumeration; only store a token when the user exists.
          const token = String(Math.floor(100000 + Math.random() * 900000));
          if (user) set((s) => ({ resetTokens: { ...s.resetTokens, [user.email]: token } }));
          return ok(user ? token : "");
        },
        resetPassword: (email, token, password) => {
          const key = email.toLowerCase();
          if (get().resetTokens[key] !== token) return fail("That reset code is invalid or has expired.");
          set((s) => {
            const tokens = { ...s.resetTokens };
            delete tokens[key];
            return { resetTokens: tokens, users: s.users.map((u) => (u.email.toLowerCase() === key ? { ...u, password } : u)) };
          });
          return ok(undefined);
        },
        updateUser: (userId, patch) => {
          set((s) => ({
            users: s.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
            riders: s.riders.map((r) => (r.userId === userId ? { ...r, ...(patch.name ? { name: patch.name } : {}), ...(patch.phone ? { phone: patch.phone } : {}), ...(patch.avatarUrl !== undefined ? { avatarUrl: patch.avatarUrl } : {}) } : r)),
          }));
        },
        changePassword: (userId, current, next) => {
          const user = get().users.find((u) => u.id === userId);
          if (!user || user.password !== current) return fail("Your current password is incorrect.");
          set((s) => ({ users: s.users.map((u) => (u.id === userId ? { ...u, password: next } : u)) }));
          return ok(undefined);
        },
        setUserStatus: (userId, status) => {
          const user = get().users.find((u) => u.id === userId);
          set((s) => ({ users: s.users.map((u) => (u.id === userId ? { ...u, status } : u)) }));
          if (user) audit(status === "suspended" ? "Suspended account" : "Reactivated account", user.name, "user");
        },

        // ---------------- shipments ----------------
        createShipment: (input) => {
          const pricing = get().pricing;
          const dist = estimateDistanceKm(input.sender, input.recipient);
          const price = calculatePrice(
            { distanceKm: dist.km, intercity: dist.intercity, weightKg: input.package.weightKg, quantity: input.package.quantity, fragile: input.package.fragile, deliveryType: input.deliveryType },
            pricing,
          );
          const created = new Date();
          const travel = estimateTravelMinutes(dist.km, dist.intercity);
          const deadline = input.scheduledFor ? new Date(input.scheduledFor) : addHours(created, dist.intercity ? 48 : DELIVERY_TYPES[input.deliveryType].hours);
          const shipment: Shipment = {
            id: uid("shp"),
            reference: shipmentReference(),
            customerId: input.customerId,
            sender: input.sender,
            recipient: input.recipient,
            package: input.package,
            deliveryType: input.deliveryType,
            scheduledFor: input.scheduledFor,
            distanceKm: dist.km,
            intercity: dist.intercity,
            price,
            amount: price.total,
            riderEarning: riderEarningFor(price.total, pricing),
            paymentStatus: "paid",
            paymentMethod: input.paymentMethod,
            status: "confirmed",
            pin: fourDigitPin(),
            createdAt: created.toISOString(),
            deadline: deadline.toISOString(),
            estimatedArrival: (input.scheduledFor ? new Date(input.scheduledFor) : addMinutes(created, travel + 60)).toISOString(),
            timeline: [event("pending"), { ...event("confirmed"), at: addMinutes(created, 1).toISOString() }],
          };
          const txn: Transaction = {
            id: uid("txn"),
            reference: txReference(),
            customerId: input.customerId,
            shipmentId: shipment.id,
            amount: shipment.amount,
            method: input.paymentMethod,
            status: "successful",
            createdAt: now(),
          };
          set((s) => ({ shipments: [shipment, ...s.shipments], transactions: [txn, ...s.transactions] }));
          notify({ userId: input.customerId, title: "Booking confirmed", body: `${shipment.reference} is confirmed. We are matching you with a rider.`, type: "shipment", href: `/customer/shipments/${shipment.id}` });
          notify({ userId: input.customerId, title: "Payment successful", body: `Payment for ${shipment.reference} was received.`, type: "payment", href: "/customer/payments" });
          if (get().settings.autoAssignRiders) {
            const candidate = get().riders.find((r) => r.verification === "approved" && r.status === "active" && r.availability === "online" && r.state === input.sender.state);
            if (candidate) get().assignRider(shipment.id, candidate.id);
          }
          return ok(get().shipments.find((s) => s.id === shipment.id) ?? shipment);
        },

        cancelShipment: (shipmentId, reason) => {
          const s = get().shipments.find((x) => x.id === shipmentId);
          if (!s) return fail("Shipment not found.");
          if (!CANCELLABLE_STATUSES.includes(s.status)) return fail("This shipment can no longer be cancelled because the package has been picked up.");
          const refundable = s.paymentStatus === "paid";
          patchShipment(shipmentId, (x) => ({ ...x, status: "cancelled", paymentStatus: refundable ? "refunded" : x.paymentStatus, timeline: [...x.timeline, event("cancelled", reason)] }));
          if (refundable) {
            set((st) => ({ transactions: st.transactions.map((t) => (t.shipmentId === shipmentId && t.status === "successful" ? { ...t, status: "refunded" } : t)) }));
          }
          if (s.riderId) {
            set((st) => ({ riders: st.riders.map((r) => (r.id === s.riderId && r.availability === "busy" ? { ...r, availability: "online" } : r)) }));
            const ru = riderUserId(s.riderId);
            if (ru) notify({ userId: ru, title: "Delivery cancelled", body: `${s.reference} was cancelled.`, type: "shipment", href: "/rider/deliveries" });
          }
          notify({ userId: s.customerId, title: "Shipment cancelled", body: `${s.reference} was cancelled${refundable ? " and your payment refunded" : ""}.`, type: "shipment", href: `/customer/shipments/${s.id}` });
          const actor = currentUser();
          if (actor?.role === "admin") audit("Cancelled shipment", s.reference, "shipment");
          return ok(undefined);
        },

        assignRider: (shipmentId, riderId) => {
          const s = get().shipments.find((x) => x.id === shipmentId);
          const rider = get().riders.find((r) => r.id === riderId);
          if (!s || !rider) return fail("Shipment or rider not found.");
          if (!["pending", "confirmed", "assigned"].includes(s.status)) return fail("Only unassigned or newly assigned shipments can be (re)assigned.");
          if (rider.status !== "active" || (get().settings.requireRiderVerification && rider.verification !== "approved")) return fail("Only verified, active riders can receive deliveries.");
          const active = get().shipments.filter((x) => x.riderId === riderId && ["assigned", "accepted", "en_route_pickup", "picked_up", "in_transit", "arrived"].includes(x.status)).length;
          if (active >= get().settings.maxActiveJobsPerRider) return fail(`${rider.name} already has ${active} active deliveries.`);
          patchShipment(shipmentId, (x) => ({
            ...x,
            status: "assigned",
            riderId,
            partnerId: rider.partnerId ?? x.partnerId,
            timeline: [...x.timeline.filter((e) => e.status !== "assigned"), event("assigned", rider.name)],
          }));
          notify({ userId: rider.userId, title: "New delivery assigned", body: `${s.reference}: ${s.sender.lga} to ${s.recipient.lga}. Accept to proceed.`, type: "shipment", href: `/rider/deliveries/${s.id}` });
          notify({ userId: s.customerId, title: "Rider assigned", body: `${rider.name} has been assigned to ${s.reference}.`, type: "shipment", href: `/customer/shipments/${s.id}` });
          const actor = currentUser();
          if (actor?.role === "admin" || actor?.role === "partner") audit(`Assigned rider ${rider.name}`, s.reference, "shipment");
          return ok(undefined);
        },

        acceptJob: (shipmentId, riderId) => {
          const s = get().shipments.find((x) => x.id === shipmentId);
          const rider = get().riders.find((r) => r.id === riderId);
          if (!s || !rider) return fail("Delivery not found.");
          if (rider.status !== "active") return fail("Your account is suspended.");
          if (get().settings.requireRiderVerification && rider.verification !== "approved") return fail("Complete verification before accepting deliveries.");
          if (s.status === "assigned" && s.riderId === riderId) {
            patchShipment(shipmentId, (x) => ({ ...x, status: "accepted", timeline: [...x.timeline, event("accepted")] }));
          } else if (s.status === "confirmed" && !s.riderId) {
            const active = get().shipments.filter((x) => x.riderId === riderId && ["assigned", "accepted", "en_route_pickup", "picked_up", "in_transit", "arrived"].includes(x.status)).length;
            if (active >= get().settings.maxActiveJobsPerRider) return fail(`You can have at most ${get().settings.maxActiveJobsPerRider} active deliveries.`);
            patchShipment(shipmentId, (x) => ({
              ...x,
              status: "accepted",
              riderId,
              partnerId: rider.partnerId ?? x.partnerId,
              timeline: [...x.timeline, event("assigned", rider.name), event("accepted")],
            }));
          } else {
            return fail("This job is no longer available.");
          }
          set((st) => ({ riders: st.riders.map((r) => (r.id === riderId ? { ...r, availability: "busy" } : r)) }));
          notify({ userId: s.customerId, title: "Rider on the way", body: `${rider.name} accepted ${s.reference} and is preparing for pickup.`, type: "shipment", href: `/customer/shipments/${s.id}` });
          return ok(undefined);
        },

        declineAssignment: (shipmentId) => {
          const s = get().shipments.find((x) => x.id === shipmentId);
          if (!s || s.status !== "assigned") return fail("Only newly assigned deliveries can be declined.");
          patchShipment(shipmentId, (x) => ({ ...x, status: "confirmed", riderId: undefined, timeline: x.timeline.filter((e) => e.status !== "assigned") }));
          notify({ role: "admin", title: "Assignment declined", body: `${s.reference} needs a new rider.`, type: "shipment", href: `/admin/deliveries/${s.id}` });
          return ok(undefined);
        },

        advanceShipment: (shipmentId, next) => {
          const s = get().shipments.find((x) => x.id === shipmentId);
          if (!s) return fail("Shipment not found.");
          if (!ALLOWED_NEXT[s.status]?.includes(next)) return fail("That status update is not allowed at this stage.");
          patchShipment(shipmentId, (x) => ({ ...x, status: next, timeline: [...x.timeline, event(next)] }));
          const messages: Partial<Record<ShipmentStatus, string>> = {
            en_route_pickup: "Your rider is heading to the pickup point.",
            picked_up: "Your package has been picked up.",
            in_transit: "Your package is out for delivery.",
            arrived: "Your rider has arrived. Share the delivery PIN with them to complete delivery.",
          };
          if (messages[next]) notify({ userId: s.customerId, title: TIMELINE_LABELS[next], body: `${s.reference}: ${messages[next]}`, type: "shipment", href: `/customer/shipments/${s.id}` });
          return ok(undefined);
        },

        confirmDelivery: (shipmentId, pin) => {
          const s = get().shipments.find((x) => x.id === shipmentId);
          if (!s) return fail("Shipment not found.");
          if (s.status !== "arrived") return fail("Mark yourself as arrived at the destination first.");
          if (!/^\d{4}$/.test(pin)) return fail("Enter the four-digit delivery PIN.");
          if (pin !== s.pin) return fail("That PIN does not match this shipment. Ask the recipient to check again.");
          const deliveredAt = now();
          patchShipment(shipmentId, (x) => ({ ...x, status: "delivered", deliveredAt, timeline: [...x.timeline, event("delivered", "Confirmed with recipient PIN")] }));
          const stillActive = get().shipments.some((x) => x.riderId === s.riderId && x.id !== s.id && ["accepted", "en_route_pickup", "picked_up", "in_transit", "arrived"].includes(x.status));
          if (!stillActive) set((st) => ({ riders: st.riders.map((r) => (r.id === s.riderId ? { ...r, availability: "online" } : r)) }));
          notify({ userId: s.customerId, title: "Package delivered", body: `${s.reference} was delivered to ${s.recipient.name}.`, type: "shipment", href: `/customer/shipments/${s.id}` });
          const ru = riderUserId(s.riderId);
          if (ru) notify({ userId: ru, title: "Earnings added", body: `You earned from ${s.reference}. Great job.`, type: "payment", href: "/rider/earnings" });
          const pu = partnerUserId(s.partnerId);
          if (pu) notify({ userId: pu, title: "Delivery completed", body: `${s.reference} was completed by your rider.`, type: "shipment", href: "/partner/deliveries" });
          return ok(undefined);
        },

        partnerClaimShipment: (shipmentId, partnerId) => {
          const s = get().shipments.find((x) => x.id === shipmentId);
          if (!s || s.status !== "confirmed" || s.riderId) return fail("This request is no longer available.");
          patchShipment(shipmentId, (x) => ({ ...x, partnerId }));
          audit("Accepted delivery request", s.reference, "shipment");
          return ok(undefined);
        },
        partnerReleaseShipment: (shipmentId) => {
          const s = get().shipments.find((x) => x.id === shipmentId);
          if (!s || s.riderId) return fail("Only unassigned requests can be released.");
          patchShipment(shipmentId, (x) => ({ ...x, partnerId: undefined }));
          return ok(undefined);
        },

        // ---------------- riders ----------------
        setAvailability: (riderId, availability) => set((s) => ({ riders: s.riders.map((r) => (r.id === riderId ? { ...r, availability } : r)) })),
        submitRiderDocuments: (riderId, docs) => {
          set((s) => ({
            riders: s.riders.map((r) => {
              if (r.id !== riderId) return r;
              const documents = r.documents.map((d) => {
                const found = docs.find((x) => x.type === d.type);
                return found ? { ...d, fileName: found.fileName, previewUrl: found.previewUrl, status: "under_review" as const, uploadedAt: now(), note: undefined } : d;
              });
              return { ...r, documents, verification: "under_review", rejectionReason: undefined };
            }),
          }));
          const rider = get().riders.find((r) => r.id === riderId);
          notify({ role: "admin", title: "Documents submitted", body: `${rider?.name ?? "A rider"} submitted verification documents.`, type: "account", href: `/admin/riders/${riderId}` });
        },
        reviewRider: (riderId, decision, reason) => {
          set((s) => ({
            riders: s.riders.map((r) =>
              r.id === riderId
                ? { ...r, verification: decision, rejectionReason: decision === "rejected" ? reason : undefined, documents: r.documents.map((d) => (d.status === "not_submitted" ? d : { ...d, status: decision, note: decision === "rejected" ? reason : undefined })), rating: decision === "approved" && r.rating === 0 ? 5 : r.rating }
                : r,
            ),
          }));
          const rider = get().riders.find((r) => r.id === riderId);
          if (!rider) return;
          notify({ userId: rider.userId, title: decision === "approved" ? "You are verified" : "Verification unsuccessful", body: decision === "approved" ? "Go online to start receiving delivery jobs." : reason ?? "Please review your documents and resubmit.", type: "account", href: "/rider/verification" });
          audit(decision === "approved" ? "Approved rider application" : "Rejected rider application", rider.name, "rider");
        },
        setRiderStatus: (riderId, status) => {
          const rider = get().riders.find((r) => r.id === riderId);
          set((s) => ({
            riders: s.riders.map((r) => (r.id === riderId ? { ...r, status, availability: status === "suspended" ? "offline" : r.availability } : r)),
            users: s.users.map((u) => (u.id === rider?.userId ? { ...u, status } : u)),
          }));
          if (rider) audit(status === "suspended" ? "Suspended rider" : "Reactivated rider", rider.name, "rider");
        },
        updateRider: (riderId, patch) => {
          const rider = get().riders.find((r) => r.id === riderId);
          set((s) => ({
            riders: s.riders.map((r) => (r.id === riderId ? { ...r, ...patch } : r)),
            users: s.users.map((u) => (u.id === rider?.userId ? { ...u, ...(patch.name ? { name: patch.name } : {}), ...(patch.phone ? { phone: patch.phone } : {}), ...(patch.state ? { state: patch.state } : {}), ...(patch.avatarUrl !== undefined ? { avatarUrl: patch.avatarUrl } : {}) } : u)),
          }));
        },
        updateRiderBank: (riderId, bank) => set((s) => ({ riders: s.riders.map((r) => (r.id === riderId ? { ...r, bank } : r)) })),
        assignVehicle: (riderId, vehicleId) => {
          const rider = get().riders.find((r) => r.id === riderId);
          if (!rider) return fail("Rider not found.");
          if (vehicleId) {
            const v = get().vehicles.find((x) => x.id === vehicleId);
            if (!v) return fail("Vehicle not found.");
            if (v.availability === "maintenance" || v.availability === "inactive") return fail("This vehicle is not available for assignment.");
            if (v.assignedRiderId && v.assignedRiderId !== riderId) return fail("This vehicle is already assigned to another rider.");
          }
          set((s) => ({
            vehicles: s.vehicles.map((v) => {
              if (v.id === vehicleId) return { ...v, assignedRiderId: riderId };
              if (v.assignedRiderId === riderId) return { ...v, assignedRiderId: undefined };
              return v;
            }),
            riders: s.riders.map((r) => {
              if (r.id !== riderId) return r;
              const v = s.vehicles.find((x) => x.id === vehicleId);
              return { ...r, vehicleId: vehicleId ?? undefined, ...(v ? { vehicleType: v.category, vehiclePlate: v.plate } : {}) };
            }),
          }));
          audit(vehicleId ? "Assigned vehicle" : "Unassigned vehicle", rider.name, "fleet");
          return ok(undefined);
        },
        partnerAddRider: (partnerId, input) => {
          if (emailTaken(input.email)) return fail("A user with this email already exists.");
          const userId = uid("usr");
          const riderId = uid("rdr");
          const user: User = {
            id: userId,
            role: "rider",
            name: input.name,
            email: input.email.toLowerCase(),
            phone: input.phone,
            password: DEMO_PASSWORD,
            state: input.state,
            city: input.lga,
            status: "active",
            emailVerified: false,
            createdAt: now(),
            profileId: riderId,
            preferences: { email: true, sms: true, push: true, shipmentUpdates: true, promotions: false },
          };
          const docs = input.documents ?? [];
          const rider: Rider = {
            id: riderId,
            userId,
            name: input.name,
            email: user.email,
            phone: input.phone,
            address: input.address,
            state: input.state,
            lga: input.lga,
            vehicleType: input.vehicleType,
            vehiclePlate: input.vehiclePlate.toUpperCase(),
            availability: "offline",
            verification: docs.length ? "under_review" : "not_submitted",
            status: "active",
            partnerId,
            rating: 0,
            documents: makeDocs(RIDER_DOCUMENT_TYPES, docs),
            joinedAt: now(),
          };
          set((s) => ({ users: [...s.users, user], riders: [...s.riders, rider] }));
          audit("Added rider to fleet", rider.name, "rider");
          if (docs.length) notify({ role: "admin", title: "Partner rider added", body: `${rider.name} was added by a logistics partner and needs review.`, type: "account", href: `/admin/riders/${rider.id}` });
          return ok(rider);
        },

        // ---------------- partners & fleet ----------------
        reviewPartner: (partnerId, decision, reason) => {
          set((s) => ({
            partners: s.partners.map((p) =>
              p.id === partnerId ? { ...p, verification: decision, rejectionReason: decision === "rejected" ? reason : undefined, documents: p.documents.map((d) => (d.status === "not_submitted" ? d : { ...d, status: decision })) } : p,
            ),
          }));
          const p = get().partners.find((x) => x.id === partnerId);
          if (!p) return;
          notify({ userId: p.userId, title: decision === "approved" ? "Partnership approved" : "Application not approved", body: decision === "approved" ? "Your company can now receive delivery requests." : reason ?? "Please contact the partnerships team.", type: "account" });
          audit(decision === "approved" ? "Approved partner application" : "Rejected partner application", p.companyName, "partner");
        },
        setPartnerStatus: (partnerId, status) => {
          const p = get().partners.find((x) => x.id === partnerId);
          set((s) => ({
            partners: s.partners.map((x) => (x.id === partnerId ? { ...x, status } : x)),
            users: s.users.map((u) => (u.id === p?.userId ? { ...u, status } : u)),
          }));
          if (p) audit(status === "suspended" ? "Suspended partner" : "Reactivated partner", p.companyName, "partner");
        },
        updatePartner: (partnerId, patch) => {
          const p = get().partners.find((x) => x.id === partnerId);
          set((s) => ({
            partners: s.partners.map((x) => (x.id === partnerId ? { ...x, ...patch } : x)),
            users: s.users.map((u) => (u.id === p?.userId ? { ...u, ...(patch.companyName ? { name: patch.companyName } : {}), ...(patch.phone ? { phone: patch.phone } : {}) } : u)),
          }));
        },
        addVehicle: (input) => {
          if (get().vehicles.some((v) => v.plate.toUpperCase() === input.plate.toUpperCase())) return fail("A vehicle with this plate number is already registered.");
          const vehicle: Vehicle = { ...input, plate: input.plate.toUpperCase(), id: uid("veh"), createdAt: now(), capacityKg: input.capacityKg ?? VEHICLE_CATEGORIES[input.category].capacityKg };
          set((s) => ({ vehicles: [vehicle, ...s.vehicles], partners: s.partners.map((p) => (p.id === input.partnerId ? { ...p, fleetSize: p.fleetSize + 1 } : p)) }));
          audit("Registered vehicle", vehicle.plate, "fleet");
          return ok(vehicle);
        },
        updateVehicle: (vehicleId, patch) => {
          if (patch.plate && get().vehicles.some((v) => v.id !== vehicleId && v.plate.toUpperCase() === patch.plate!.toUpperCase())) return fail("Another vehicle already uses this plate number.");
          set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === vehicleId ? { ...v, ...patch, plate: (patch.plate ?? v.plate).toUpperCase() } : v)) }));
          const v = get().vehicles.find((x) => x.id === vehicleId);
          if (v?.assignedRiderId) set((s) => ({ riders: s.riders.map((r) => (r.id === v.assignedRiderId ? { ...r, vehiclePlate: v.plate, vehicleType: v.category } : r)) }));
          return ok(undefined);
        },
        removeVehicle: (vehicleId) => {
          const v = get().vehicles.find((x) => x.id === vehicleId);
          if (!v) return fail("Vehicle not found.");
          if (v.availability === "in_use") return fail("Vehicles that are currently in use cannot be removed.");
          set((s) => ({
            vehicles: s.vehicles.filter((x) => x.id !== vehicleId),
            riders: s.riders.map((r) => (r.vehicleId === vehicleId ? { ...r, vehicleId: undefined } : r)),
            partners: s.partners.map((p) => (p.id === v.partnerId ? { ...p, fleetSize: Math.max(0, p.fleetSize - 1) } : p)),
          }));
          audit("Removed vehicle", v.plate, "fleet");
          return ok(undefined);
        },

        // ---------------- payments ----------------
        requestPayout: (riderId, amount, available) => {
          const rider = get().riders.find((r) => r.id === riderId);
          if (!rider?.bank) return fail("Add a bank account before requesting a payout.");
          if (amount < 1000) return fail("The minimum payout is ₦1,000.");
          if (amount > available) return fail("Amount exceeds your available balance.");
          const payout: Payout = {
            id: uid("pay"),
            reference: txReference("PO"),
            riderId,
            amount,
            status: "pending",
            bankName: rider.bank.bankName,
            accountNumber: rider.bank.accountNumber,
            accountName: rider.bank.accountName,
            requestedAt: now(),
          };
          set((s) => ({ payouts: [payout, ...s.payouts] }));
          notify({ role: "admin", title: "Payout requested", body: `${rider.name} requested a payout.`, type: "payout", href: "/admin/payouts" });
          return ok(payout);
        },
        reviewPayout: (payoutId, decision, note) => {
          const p = get().payouts.find((x) => x.id === payoutId);
          set((s) => ({ payouts: s.payouts.map((x) => (x.id === payoutId ? { ...x, status: decision, processedAt: now(), note } : x)) }));
          if (!p) return;
          const ru = riderUserId(p.riderId);
          const text = { approved: "was approved and will be sent shortly", paid: "has been sent to your bank account", rejected: `was rejected${note ? `: ${note}` : ""}` }[decision];
          if (ru) notify({ userId: ru, title: `Payout ${decision}`, body: `Your payout ${p.reference} ${text}.`, type: "payout", href: "/rider/payouts" });
          audit(`${decision === "paid" ? "Marked payout as paid" : decision === "approved" ? "Approved payout" : "Rejected payout"}`, p.reference, "payout");
        },
        retryPayment: (transactionId) => {
          const t = get().transactions.find((x) => x.id === transactionId);
          if (!t || (t.status !== "failed" && t.status !== "pending")) return fail("Only failed or pending payments can be retried.");
          set((s) => ({
            transactions: s.transactions.map((x) => (x.id === transactionId ? { ...x, status: "successful", createdAt: now() } : x)),
            shipments: s.shipments.map((sh) =>
              sh.id === t.shipmentId && sh.status === "pending" ? { ...sh, paymentStatus: "paid", status: "confirmed", timeline: [...sh.timeline, event("confirmed")] } : sh.id === t.shipmentId ? { ...sh, paymentStatus: "paid" } : sh,
            ),
          }));
          return ok(undefined);
        },
        refundTransaction: (transactionId) => {
          const t = get().transactions.find((x) => x.id === transactionId);
          if (!t || t.status !== "successful") return fail("Only successful payments can be refunded.");
          set((s) => ({
            transactions: s.transactions.map((x) => (x.id === transactionId ? { ...x, status: "refunded" } : x)),
            shipments: s.shipments.map((sh) => (sh.id === t.shipmentId ? { ...sh, paymentStatus: "refunded" } : sh)),
          }));
          notify({ userId: t.customerId, title: "Refund issued", body: `A refund for ${t.reference} has been issued.`, type: "payment", href: "/customer/payments" });
          audit("Issued refund", t.reference, "payment");
          return ok(undefined);
        },
        updatePricing: (config) => {
          set({ pricing: config });
          audit("Updated pricing configuration", "Pricing", "pricing");
        },

        // ---------------- misc ----------------
        markNotificationRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
        markAllNotificationsRead: (userId, role) =>
          set((s) => ({ notifications: s.notifications.map((n) => (n.userId === userId || (!n.userId && n.role === role) ? { ...n, read: true } : n)) })),
        deleteNotification: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
        saveAddress: (address) => {
          set((s) => {
            const id = address.id ?? uid("adr");
            const exists = s.addresses.some((a) => a.id === id);
            let list = exists ? s.addresses.map((a) => (a.id === id ? { ...address, id } : a)) : [...s.addresses, { ...address, id }];
            const own = list.filter((a) => a.customerId === address.customerId);
            if (address.isDefault || own.length === 1) list = list.map((a) => (a.customerId === address.customerId ? { ...a, isDefault: a.id === id } : a));
            return { addresses: list };
          });
        },
        deleteAddress: (id) =>
          set((s) => {
            const target = s.addresses.find((a) => a.id === id);
            let list = s.addresses.filter((a) => a.id !== id);
            if (target?.isDefault) {
              const next = list.find((a) => a.customerId === target.customerId);
              if (next) list = list.map((a) => (a.id === next.id ? { ...a, isDefault: true } : a));
            }
            return { addresses: list };
          }),
        setDefaultAddress: (id) =>
          set((s) => {
            const target = s.addresses.find((a) => a.id === id);
            return { addresses: s.addresses.map((a) => (a.customerId === target?.customerId ? { ...a, isDefault: a.id === id } : a)) };
          }),
        createTicket: (input) => {
          const user = get().users.find((u) => u.id === input.userId);
          if (!user) return fail("User not found.");
          const ticket: SupportTicket = {
            id: uid("tkt"),
            reference: `TCK-${Math.floor(10000 + Math.random() * 89999)}`,
            userId: user.id,
            role: user.role,
            subject: input.subject,
            category: input.category,
            priority: input.priority,
            status: "open",
            shipmentRef: input.shipmentRef,
            messages: [{ id: uid("msg"), author: user.name, fromStaff: false, body: input.message, at: now() }],
            createdAt: now(),
            updatedAt: now(),
          };
          set((s) => ({ tickets: [ticket, ...s.tickets] }));
          notify({ role: "admin", title: "New support ticket", body: `${ticket.reference}: ${ticket.subject}`, type: "system", href: "/admin/support" });
          return ok(ticket);
        },
        replyTicket: (ticketId, body, fromStaff) => {
          const user = currentUser();
          const t = get().tickets.find((x) => x.id === ticketId);
          set((s) => ({
            tickets: s.tickets.map((x) =>
              x.id === ticketId
                ? { ...x, status: fromStaff && x.status === "open" ? "in_progress" : x.status, updatedAt: now(), messages: [...x.messages, { id: uid("msg"), author: fromStaff ? `${user?.name.split(" ")[0] ?? "Support"} (SwiftLogix Support)` : user?.name ?? "You", fromStaff, body, at: now() }] }
                : x,
            ),
          }));
          if (fromStaff && t) notify({ userId: t.userId, title: "Support replied", body: `New reply on ${t.reference}.`, type: "system", href: `/${t.role}/support` });
        },
        setTicketStatus: (ticketId, status) => {
          set((s) => ({ tickets: s.tickets.map((x) => (x.id === ticketId ? { ...x, status, updatedAt: now() } : x)) }));
          const t = get().tickets.find((x) => x.id === ticketId);
          if (t && currentUser()?.role === "admin") audit(`Marked ticket ${status.replace("_", " ")}`, t.reference, "settings");
        },
        updateSettings: (patch) => {
          set((s) => ({ settings: { ...s.settings, ...patch } }));
          audit("Updated platform settings", Object.keys(patch).join(", "), "settings");
        },
        resetDemo: () => {
          const session = get().session;
          set({ ...createSeedData(), pricing: DEFAULT_PRICING, resetTokens: {}, seededAt: now(), session });
          const user = get().users.find((u) => u.id === session?.userId);
          if (!user) set({ session: null });
        },
      };
    },
    {
      name: "swiftlogix-demo-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        users: s.users,
        riders: s.riders,
        partners: s.partners,
        vehicles: s.vehicles,
        shipments: s.shipments,
        transactions: s.transactions,
        payouts: s.payouts,
        notifications: s.notifications,
        addresses: s.addresses,
        tickets: s.tickets,
        auditLogs: s.auditLogs,
        settings: s.settings,
        pricing: s.pricing,
        session: s.session,
        resetTokens: s.resetTokens,
        seededAt: s.seededAt,
      }),
    },
  ),
);
