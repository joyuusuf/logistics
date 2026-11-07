export type Role = "customer" | "rider" | "partner" | "admin";

export type AccountStatus = "active" | "suspended";

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  shipmentUpdates: boolean;
  promotions: boolean;
}

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  /** Demo only. Never store plain passwords in production. */
  password: string;
  state: string;
  city: string;
  status: AccountStatus;
  emailVerified: boolean;
  createdAt: string;
  avatarUrl?: string;
  /** For rider / partner accounts, the linked profile record id. */
  profileId?: string;
  preferences: NotificationPreferences;
}

export interface Session {
  userId: string;
  role: Role;
  signedInAt: string;
}
