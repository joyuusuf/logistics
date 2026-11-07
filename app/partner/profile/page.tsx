"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import type { ServiceCategory } from "@/types";
import { nigerianPhone } from "@/lib/validations";
import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/lib/services/store";
import { SERVICE_CATEGORIES, VERIFICATION_STATUS } from "@/lib/constants";
import { STATE_NAMES } from "@/lib/mock-data/nigeria";
import { formatDate, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardBody, CardHeader, DetailRow } from "@/components/ui/primitives";
import { PageHeader, StatusBadge } from "@/components/shared";
import { ChoiceChip } from "@/components/forms";
import { PasswordCard } from "@/components/dashboard/account";
import { PartnerStatusBanner } from "@/components/dashboard/partner-banner";

const schema = z.object({
  companyName: z.string().trim().min(3),
  phone: nigerianPhone,
  address: z.string().trim().min(8, "Enter a full address"),
  description: z.string().trim().min(30, "At least 30 characters"),
  operatingStates: z.array(z.string()).min(1, "Select at least one state"),
  services: z.array(z.string()).min(1, "Select at least one service"),
});
type Values = z.infer<typeof schema>;

export default function CompanyProfilePage() {
  const { partner } = useAuth();
  const update = useStore((s) => s.updatePartner);
  const p = partner!;
  const { register, control, handleSubmit, reset, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { companyName: p.companyName, phone: p.phone, address: p.address, description: p.description, operatingStates: p.operatingStates, services: p.services },
  });
  const { errors, isSubmitting, isDirty } = formState;

  return (
    <>
      <PageHeader title="Company profile" description="How your company appears to SwiftLogix and customers." />
      <PartnerStatusBanner partner={p} />
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Company details" />
            <CardBody>
              <form
                noValidate
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={handleSubmit(async (v) => {
                  await sleep(500);
                  update(p.id, { ...v, services: v.services as ServiceCategory[] });
                  reset(v);
                  toast.success("Company profile updated");
                })}
              >
                <Field label="Company name" htmlFor="c-name" error={errors.companyName?.message}>
                  <Input id="c-name" {...register("companyName")} />
                </Field>
                <Field label="Phone number" htmlFor="c-phone" error={errors.phone?.message}>
                  <Input id="c-phone" type="tel" {...register("phone")} aria-invalid={!!errors.phone} />
                </Field>
                <Field label="Business address" htmlFor="c-addr" error={errors.address?.message} className="sm:col-span-2">
                  <Input id="c-addr" {...register("address")} aria-invalid={!!errors.address} />
                </Field>
                <Field label="Description" htmlFor="c-desc" error={errors.description?.message} className="sm:col-span-2">
                  <Textarea id="c-desc" rows={4} {...register("description")} aria-invalid={!!errors.description} />
                </Field>
                <Field label="Operating states" error={errors.operatingStates?.message} className="sm:col-span-2">
                  <Controller
                    control={control}
                    name="operatingStates"
                    render={({ field }) => (
                      <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-lg border border-line p-3 scrollbar-thin">
                        {STATE_NAMES.map((s) => (
                          <ChoiceChip key={s} selected={field.value.includes(s)} onClick={() => field.onChange(field.value.includes(s) ? field.value.filter((x) => x !== s) : [...field.value, s])}>
                            {s}
                          </ChoiceChip>
                        ))}
                      </div>
                    )}
                  />
                </Field>
                <Field label="Services" error={errors.services?.message} className="sm:col-span-2">
                  <Controller
                    control={control}
                    name="services"
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(SERVICE_CATEGORIES).map(([k, l]) => (
                          <ChoiceChip key={k} selected={field.value.includes(k)} onClick={() => field.onChange(field.value.includes(k) ? field.value.filter((x) => x !== k) : [...field.value, k])}>
                            {l}
                          </ChoiceChip>
                        ))}
                      </div>
                    )}
                  />
                </Field>
                <div className="flex justify-end sm:col-span-2">
                  <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
                    Save changes
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
          <PasswordCard />
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader title="Registration" />
            <CardBody className="pt-2">
              <dl className="divide-y divide-line">
                <DetailRow label="Status">
                  <StatusBadge map={VERIFICATION_STATUS} value={p.verification} />
                </DetailRow>
                <DetailRow label="CAC number">{p.cacNumber}</DetailRow>
                <DetailRow label="Business email">{p.email}</DetailRow>
                <DetailRow label="Commission">{p.commissionRate}%</DetailRow>
                <DetailRow label="Partner since">{formatDate(p.joinedAt)}</DetailRow>
              </dl>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Company documents" />
            <CardBody className="pt-2">
              <ul className="divide-y divide-line">
                {p.documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="flex min-w-0 items-center gap-2 text-sm">
                      <FileText className="size-4 shrink-0 text-muted" />
                      <span className="truncate">{d.type}</span>
                    </span>
                    <StatusBadge map={VERIFICATION_STATUS} value={d.status} />
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
