import { z } from "zod";

/** Accepts 0803..., +234803..., 234803... with 10 local digits. */
export const nigerianPhone = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .refine((v) => /^(\+?234|0)[789][01]\d{8}$/.test(v.replace(/[\s-]/g, "")), "Enter a valid Nigerian number, e.g. 0803 123 4567");

export const email = z.string().trim().min(1, "Email is required").email("Enter a valid email address");

export const password = z
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

const required = (label: string) => z.string().trim().min(1, `${label} is required`);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

export const customerRegisterSchema = z
  .object({
    name: required("Full name").min(3, "Enter your full name"),
    email,
    phone: nigerianPhone,
    state: required("State"),
    city: required("City"),
    password,
    confirmPassword: z.string(),
    terms: z.boolean().refine((v) => v, "You must accept the terms to continue"),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

export const riderPersonalSchema = z
  .object({
    name: required("Full name").min(3, "Enter your full name"),
    email,
    phone: nigerianPhone,
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

export const riderLocationSchema = z.object({
  address: required("Residential address").min(8, "Enter a full address"),
  state: required("State of operation"),
  lga: required("Local government area"),
});

export const plateNumber = z
  .string()
  .trim()
  .min(1, "Registration number is required")
  .regex(/^[A-Za-z]{3}[-\s]?\d{3}[A-Za-z]{2}$/, "Use the Nigerian format, e.g. LND-123AA");

export const riderVehicleSchema = z.object({
  vehicleType: z.enum(["motorcycle", "tricycle", "car", "van", "pickup_truck", "truck"]),
  vehiclePlate: plateNumber,
});

export const partnerCompanySchema = z
  .object({
    companyName: required("Company name").min(3, "Enter the registered company name"),
    email,
    phone: nigerianPhone,
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

export const partnerBusinessSchema = z.object({
  address: required("Business address").min(8, "Enter a full address"),
  state: required("Head office state"),
  cacNumber: z
    .string()
    .trim()
    .regex(/^(RC|BN|IT)\s?\d{5,8}$/i, "Use the CAC format, e.g. RC 1234567"),
  description: required("Business description").min(30, "Tell us a bit more (at least 30 characters)"),
});

export const partnerOperationsSchema = z.object({
  operatingStates: z.array(z.string()).min(1, "Select at least one state"),
  services: z.array(z.string()).min(1, "Select at least one service"),
  fleetSize: z.coerce.number<number>().int("Whole numbers only").min(1, "Enter at least 1 vehicle").max(5000),
});

export const contactPointSchema = z.object({
  name: required("Name").min(3, "Enter a full name"),
  phone: nigerianPhone,
  address: required("Address").min(6, "Enter a full street address"),
  state: required("State"),
  lga: required("LGA"),
  landmark: z.string().trim().optional(),
  instructions: z.string().trim().max(200, "Keep instructions under 200 characters").optional(),
});

export const packageSchema = z.object({
  category: z.enum(["documents", "electronics", "food", "clothing", "cosmetics", "household", "pharmaceuticals", "auto_parts", "other"]),
  description: required("Description").min(4, "Describe the package"),
  weightKg: z.coerce.number<number>().positive("Enter the weight").max(2000, "For loads above 2,000kg contact sales"),
  lengthCm: z.coerce.number<number>().positive("Required").max(500),
  widthCm: z.coerce.number<number>().positive("Required").max(500),
  heightCm: z.coerce.number<number>().positive("Required").max(500),
  quantity: z.coerce.number<number>().int().min(1, "At least 1").max(200),
  fragile: z.boolean(),
  imageDataUrl: z.string().optional(),
});

export const addressSchema = contactPointSchema.omit({ instructions: true }).extend({
  label: required("Label"),
  isDefault: z.boolean(),
});

export const profileSchema = z.object({
  name: required("Full name").min(3),
  phone: nigerianPhone,
  state: required("State"),
  city: required("City"),
});

export const changePasswordSchema = z
  .object({ current: z.string().min(1, "Enter your current password"), next: password, confirm: z.string() })
  .refine((d) => d.next === d.confirm, { path: ["confirm"], message: "Passwords do not match" });

export const vehicleSchema = z.object({
  category: z.enum(["motorcycle", "tricycle", "car", "van", "pickup_truck", "truck"]),
  make: required("Make"),
  model: required("Model"),
  year: z.coerce.number<number>().int().min(2000, "2000 or newer").max(new Date().getFullYear() + 1),
  plate: plateNumber,
  color: required("Colour"),
  availability: z.enum(["available", "in_use", "maintenance", "inactive"]),
});

export const bankSchema = z.object({
  bankName: required("Bank"),
  accountNumber: z.string().regex(/^\d{10}$/, "NUBAN account numbers have 10 digits"),
  accountName: required("Account name").min(3),
});

export const ticketSchema = z.object({
  subject: required("Subject").min(5, "Add a short subject"),
  category: z.enum(["delivery", "payment", "account", "technical", "other"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  shipmentRef: z.string().trim().optional(),
  message: required("Message").min(10, "Describe the issue in a little more detail"),
});

export const contactSchema = z.object({
  name: required("Name"),
  email,
  phone: z.string().optional(),
  topic: required("Topic"),
  message: required("Message").min(10, "Please add a little more detail"),
});
