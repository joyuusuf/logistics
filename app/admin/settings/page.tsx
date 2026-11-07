"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { PlatformSettings } from "@/types";
import { useStore } from "@/lib/services/store";
import { sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card, CardBody, CardHeader, Switch } from "@/components/ui/primitives";
import { PageHeader } from "@/components/shared";
import { DemoDataCard, NotificationPreferencesCard, PasswordCard, PersonalInfoCard } from "@/components/dashboard/account";

const schema = z.object({
  platformName: z.string().trim().min(2),
  supportEmail: z.string().email("Enter a valid email"),
  supportPhone: z.string().trim().min(7, "Enter a phone number"),
  maxActiveJobsPerRider: z.coerce.number<number>().int().min(1).max(10),
});

function PlatformSettingsCard() {
  const settings = useStore((s) => s.settings);
  const update = useStore((s) => s.updateSettings);
  const { register, handleSubmit, reset, formState } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: settings });
  const { errors, isSubmitting, isDirty } = formState;

  const toggle = (key: keyof PlatformSettings, value: boolean, label: string) => {
    update({ [key]: value });
    toast.success(`${label} ${value ? "enabled" : "disabled"}`);
  };

  return (
    <Card>
      <CardHeader title="Platform settings" description="Operational defaults for the whole platform." />
      <CardBody className="space-y-6">
        <form
          noValidate
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={handleSubmit(async (v) => {
            await sleep(400);
            update(v);
            reset(v);
            toast.success("Platform settings saved");
          })}
        >
          <Field label="Platform name" htmlFor="ps-name" error={errors.platformName?.message}>
            <Input id="ps-name" {...register("platformName")} />
          </Field>
          <Field label="Support email" htmlFor="ps-email" error={errors.supportEmail?.message}>
            <Input id="ps-email" type="email" {...register("supportEmail")} aria-invalid={!!errors.supportEmail} />
          </Field>
          <Field label="Support phone" htmlFor="ps-phone" error={errors.supportPhone?.message}>
            <Input id="ps-phone" {...register("supportPhone")} aria-invalid={!!errors.supportPhone} />
          </Field>
          <Field label="Max active jobs per rider" htmlFor="ps-max" error={errors.maxActiveJobsPerRider?.message}>
            <Input id="ps-max" type="number" min={1} max={10} {...register("maxActiveJobsPerRider")} aria-invalid={!!errors.maxActiveJobsPerRider} />
          </Field>
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              Save settings
            </Button>
          </div>
        </form>
        <div className="divide-y divide-line border-t border-line">
          {[
            { key: "autoAssignRiders" as const, label: "Auto-assign riders", body: "Automatically assign the nearest online rider when a booking is confirmed." },
            { key: "requireRiderVerification" as const, label: "Require rider verification", body: "Riders must be approved before they can accept jobs." },
            { key: "maintenanceMode" as const, label: "Maintenance mode", body: "Show a maintenance notice to customers (demo flag only)." },
          ].map((t) => (
            <label key={t.key} className="flex cursor-pointer items-center justify-between gap-4 py-3.5">
              <span>
                <span className="block text-sm font-semibold text-ink">{t.label}</span>
                <span className="block text-[13px] text-muted">{t.body}</span>
              </span>
              <Switch checked={settings[t.key]} onCheckedChange={(v) => toggle(t.key, v, t.label)} />
            </label>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export default function AdminSettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Platform configuration and your admin account." />
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <PlatformSettingsCard />
          <PersonalInfoCard />
          <PasswordCard />
        </div>
        <div className="space-y-5">
          <NotificationPreferencesCard />
          <DemoDataCard />
        </div>
      </div>
    </>
  );
}
