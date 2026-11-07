"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Bell, CheckCheck, CreditCard, Package, Settings2, Trash2, UserCircle, Wallet } from "lucide-react";
import type { AppNotification, NotificationPreferences } from "@/types";
import { changePasswordSchema, profileSchema } from "@/lib/validations";
import { useStore } from "@/lib/services/store";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { cn, formatDate, formatRelative, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Avatar, Card, CardBody, CardHeader, Switch } from "@/components/ui/primitives";
import { EmptyState, PageHeader } from "@/components/shared";
import { FileUpload, StateSelect } from "@/components/forms";
import { ConfirmDialog } from "@/components/dialogs";

/* ------------------------------ Notifications ------------------------------ */
const TYPE_ICON: Record<AppNotification["type"], React.ComponentType<{ className?: string }>> = {
  shipment: Package,
  payment: CreditCard,
  account: UserCircle,
  system: Settings2,
  payout: Wallet,
};

export function NotificationsView() {
  const router = useRouter();
  const { items, unread, markRead, markAllRead, remove } = useNotifications();
  const [tab, setTab] = React.useState<"all" | "unread">("all");
  const list = tab === "unread" ? items.filter((n) => !n.read) : items;
  return (
    <>
      <PageHeader
        title="Notifications"
        description="Updates about your deliveries, payments and account."
        actions={
          <Button variant="secondary" onClick={() => markAllRead()} disabled={!unread}>
            <CheckCheck /> Mark all as read
          </Button>
        }
      />
      <Card>
        <div className="flex gap-1 border-b border-line px-4 pt-3">
          {(["all", "unread"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={cn("-mb-px border-b-2 px-3 pb-2.5 text-sm font-semibold capitalize", tab === t ? "border-emerald text-navy" : "border-transparent text-muted hover:text-ink")}>
              {t} {t === "unread" && unread > 0 && <span className="ml-1 rounded-full bg-danger px-1.5 text-[11px] text-white">{unread}</span>}
            </button>
          ))}
        </div>
        {list.length === 0 ? (
          <EmptyState icon={Bell} title={tab === "unread" ? "No unread notifications" : "No notifications yet"} description="We'll let you know when something needs your attention." />
        ) : (
          <ul className="divide-y divide-line">
            {list.map((n) => {
              const Icon = TYPE_ICON[n.type];
              return (
                <li key={n.id} className={cn("group flex gap-3 px-4 py-4 sm:px-5", !n.read && "bg-emerald-tint/25")}>
                  <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-lg", n.read ? "bg-surface text-muted" : "bg-navy text-white")}>
                    <Icon className="size-4" />
                  </span>
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      markRead(n.id);
                      if (n.href) router.push(n.href);
                    }}
                  >
                    <p className="text-sm font-semibold text-ink">
                      {n.title} {!n.read && <span className="ml-1 inline-block size-2 rounded-full bg-emerald align-middle" />}
                    </p>
                    <p className="text-sm text-muted">{n.body}</p>
                    <p className="mt-1 text-xs text-muted/80">{formatRelative(n.createdAt)}</p>
                  </button>
                  <button type="button" onClick={() => remove(n.id)} className="self-start rounded-md p-1.5 text-muted opacity-100 hover:bg-danger-tint hover:text-danger sm:opacity-0 sm:group-hover:opacity-100" aria-label="Delete notification">
                    <Trash2 className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}

/* ------------------------------ Profile ------------------------------ */
type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof changePasswordSchema>;

export function PersonalInfoCard({ extra }: { extra?: React.ReactNode }) {
  const { user } = useAuth();
  const updateUser = useStore((s) => s.updateUser);
  const { register, handleSubmit, control, reset, formState } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "", phone: user?.phone ?? "", state: user?.state ?? "", city: user?.city ?? "" },
  });
  const { errors, isSubmitting, isDirty } = formState;
  if (!user) return null;

  const onSubmit = async (v: ProfileValues) => {
    await sleep(500);
    updateUser(user.id, v);
    reset(v);
    toast.success("Profile updated");
  };

  return (
    <Card>
      <CardHeader title="Personal information" description="This is how riders and support will see you." />
      <CardBody>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar name={user.name} src={user.avatarUrl} size={72} />
          <div className="flex-1">
            <FileUpload
              compact
              label="Change profile photo"
              accept="image/*"
              hint="Square images look best"
              onChange={(f) => {
                if (f?.previewUrl) {
                  updateUser(user.id, { avatarUrl: f.previewUrl });
                  toast.success("Photo updated");
                }
              }}
            />
          </div>
          {user.avatarUrl && (
            <Button variant="danger-ghost" size="sm" onClick={() => updateUser(user.id, { avatarUrl: undefined })}>
              Remove
            </Button>
          )}
        </div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="p-name" error={errors.name?.message}>
            <Input id="p-name" {...register("name")} aria-invalid={!!errors.name} />
          </Field>
          <Field label="Email" htmlFor="p-email" hint="Contact support to change your email">
            <Input id="p-email" value={user.email} disabled readOnly />
          </Field>
          <Field label="Phone number" htmlFor="p-phone" error={errors.phone?.message}>
            <Input id="p-phone" type="tel" {...register("phone")} aria-invalid={!!errors.phone} />
          </Field>
          <Field label="State" htmlFor="p-state" error={errors.state?.message}>
            <Controller control={control} name="state" render={({ field }) => <StateSelect id="p-state" value={field.value} onChange={field.onChange} invalid={!!errors.state} />} />
          </Field>
          <Field label="City" htmlFor="p-city" error={errors.city?.message}>
            <Input id="p-city" {...register("city")} aria-invalid={!!errors.city} />
          </Field>
          {extra}
          <div className="flex items-end justify-end sm:col-span-2">
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              Save changes
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

export function PasswordCard() {
  const { user } = useAuth();
  const changePassword = useStore((s) => s.changePassword);
  const { register, handleSubmit, reset, setError, formState } = useForm<PasswordValues>({ resolver: zodResolver(changePasswordSchema), defaultValues: { current: "", next: "", confirm: "" } });
  const { errors, isSubmitting } = formState;
  if (!user) return null;
  const onSubmit = async (v: PasswordValues) => {
    await sleep(500);
    const res = changePassword(user.id, v.current, v.next);
    if (!res.ok) {
      setError("current", { message: res.error });
      return;
    }
    reset();
    toast.success("Password changed");
  };
  return (
    <Card>
      <CardHeader title="Password" description="Use at least 8 characters with a letter and a number." />
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-3">
          <Field label="Current password" htmlFor="pw-current" error={errors.current?.message}>
            <Input id="pw-current" type="password" autoComplete="current-password" {...register("current")} aria-invalid={!!errors.current} />
          </Field>
          <Field label="New password" htmlFor="pw-next" error={errors.next?.message}>
            <Input id="pw-next" type="password" autoComplete="new-password" {...register("next")} aria-invalid={!!errors.next} />
          </Field>
          <Field label="Confirm new password" htmlFor="pw-confirm" error={errors.confirm?.message}>
            <Input id="pw-confirm" type="password" autoComplete="new-password" {...register("confirm")} aria-invalid={!!errors.confirm} />
          </Field>
          <div className="flex justify-end sm:col-span-3">
            <Button type="submit" variant="navy" loading={isSubmitting}>
              Update password
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

/* ------------------------------ Settings ------------------------------ */
const PREF_LABELS: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  { key: "shipmentUpdates", label: "Shipment updates", description: "Status changes, rider assignment and delivery confirmation." },
  { key: "email", label: "Email notifications", description: "Receipts and important account notices by email." },
  { key: "sms", label: "SMS notifications", description: "Text messages for time-sensitive delivery updates." },
  { key: "push", label: "Push notifications", description: "In-app alerts while you are using SwiftLogix." },
  { key: "promotions", label: "Offers and product news", description: "Occasional discounts and new features." },
];

export function NotificationPreferencesCard() {
  const { user } = useAuth();
  const updateUser = useStore((s) => s.updateUser);
  if (!user) return null;
  const toggle = (key: keyof NotificationPreferences, value: boolean) => {
    updateUser(user.id, { preferences: { ...user.preferences, [key]: value } });
    toast.success("Preference saved");
  };
  return (
    <Card>
      <CardHeader title="Notification preferences" description="Choose how we keep you informed." />
      <CardBody className="divide-y divide-line py-2">
        {PREF_LABELS.map((p) => (
          <label key={p.key} className="flex cursor-pointer items-center justify-between gap-4 py-3.5">
            <span>
              <span className="block text-sm font-semibold text-ink">{p.label}</span>
              <span className="block text-[13px] text-muted">{p.description}</span>
            </span>
            <Switch checked={user.preferences[p.key]} onCheckedChange={(v) => toggle(p.key, v)} />
          </label>
        ))}
      </CardBody>
    </Card>
  );
}

export function DemoDataCard() {
  const router = useRouter();
  const resetDemo = useStore((s) => s.resetDemo);
  const seededAt = useStore((s) => s.seededAt);
  const logout = useStore((s) => s.logout);
  const [open, setOpen] = React.useState(false);
  return (
    <Card>
      <CardHeader title="Demo data" description="SwiftLogix runs entirely in your browser for this demo." />
      <CardBody className="space-y-4">
        <p className="text-sm text-muted">
          Changes you make are saved to localStorage and shared by every demo account in this browser. Data was last reset on {formatDate(seededAt, "d MMM yyyy, h:mm a")}. Authentication here is for demonstration only and is not secure.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Reset demo data
          </Button>
          <Button
            variant="danger-ghost"
            onClick={() => {
              logout();
              router.push("/");
            }}
          >
            Sign out
          </Button>
        </div>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Reset all demo data?"
          description="This restores the original shipments, users and settings. Anything you created will be removed."
          confirmLabel="Reset data"
          tone="danger"
          onConfirm={() => {
            resetDemo();
            toast.success("Demo data restored");
          }}
        />
      </CardBody>
    </Card>
  );
}

export function AccountSummaryCard() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Card>
      <CardHeader title="Account" />
      <CardBody className="space-y-2 text-sm">
        <p className="flex justify-between">
          <span className="text-muted">Member since</span>
          <span className="font-semibold">{formatDate(user.createdAt)}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-muted">Email status</span>
          <span className="font-semibold">{user.emailVerified ? "Verified" : <Link href="/auth/verify-email" className="text-emerald-deep hover:underline">Verify now</Link>}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-muted">Account status</span>
          <span className="font-semibold capitalize">{user.status}</span>
        </p>
      </CardBody>
    </Card>
  );
}

export function SettingsView({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <PageHeader title="Settings" description="Manage notifications, security and your demo data." />
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <NotificationPreferencesCard />
          {children}
        </div>
        <div className="space-y-5">
          <AccountSummaryCard />
          <DemoDataCard />
        </div>
      </div>
    </>
  );
}
