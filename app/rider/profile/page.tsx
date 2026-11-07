"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { plateNumber } from "@/lib/validations";
import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/lib/services/store";
import { VEHICLE_CATEGORIES, VERIFICATION_STATUS } from "@/lib/constants";
import { formatDate, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect } from "@/components/ui/input";
import { Card, CardBody, CardHeader, DetailRow } from "@/components/ui/primitives";
import { PageHeader, StatusBadge } from "@/components/shared";
import { PasswordCard, PersonalInfoCard } from "@/components/dashboard/account";

const vehicleSchema = z.object({
  vehicleType: z.enum(["motorcycle", "tricycle", "car", "van", "pickup_truck", "truck"]),
  vehiclePlate: plateNumber,
  address: z.string().trim().min(8, "Enter your full address"),
});

export default function RiderProfilePage() {
  const { rider } = useAuth();
  const partner = useStore((s) => s.partners.find((p) => p.id === rider?.partnerId));
  const updateRider = useStore((s) => s.updateRider);
  const fleetManaged = !!rider!.vehicleId;
  const { register, handleSubmit, reset, formState } = useForm<z.infer<typeof vehicleSchema>>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { vehicleType: rider!.vehicleType, vehiclePlate: rider!.vehiclePlate, address: rider!.address },
  });
  const { errors, isSubmitting, isDirty } = formState;

  return (
    <>
      <PageHeader title="Profile" description="Your rider details, vehicle and password." />
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <PersonalInfoCard />
          <Card>
            <CardHeader title="Vehicle and address" description={fleetManaged ? "Your vehicle is managed by your fleet operator." : "Keep these up to date so we send you suitable jobs."} />
            <CardBody>
              <form
                noValidate
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={handleSubmit(async (v) => {
                  await sleep(500);
                  updateRider(rider!.id, { ...v, vehiclePlate: v.vehiclePlate.toUpperCase() });
                  reset(v);
                  toast.success("Vehicle details saved");
                })}
              >
                <Field label="Vehicle type" htmlFor="v-type">
                  <NativeSelect id="v-type" {...register("vehicleType")} disabled={fleetManaged}>
                    {Object.entries(VEHICLE_CATEGORIES).map(([k, c]) => (
                      <option key={k} value={k}>
                        {c.label}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Registration number" htmlFor="v-plate" error={errors.vehiclePlate?.message}>
                  <Input id="v-plate" {...register("vehiclePlate")} className="uppercase" disabled={fleetManaged} aria-invalid={!!errors.vehiclePlate} />
                </Field>
                <Field label="Residential address" htmlFor="v-address" error={errors.address?.message} className="sm:col-span-2">
                  <Input id="v-address" {...register("address")} aria-invalid={!!errors.address} />
                </Field>
                <div className="flex justify-end sm:col-span-2">
                  <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
                    Save
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
          <PasswordCard />
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader title="Rider summary" />
            <CardBody className="pt-2">
              <dl className="divide-y divide-line">
                <DetailRow label="Rating">
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-4 fill-amber text-amber" /> {rider!.rating ? rider!.rating.toFixed(1) : "New"}
                  </span>
                </DetailRow>
                <DetailRow label="Verification">
                  <StatusBadge map={VERIFICATION_STATUS} value={rider!.verification} />
                </DetailRow>
                <DetailRow label="Operating area">
                  {rider!.lga}, {rider!.state}
                </DetailRow>
                <DetailRow label="Fleet">{partner?.companyName ?? "Independent rider"}</DetailRow>
                <DetailRow label="Joined">{formatDate(rider!.joinedAt)}</DetailRow>
              </dl>
              <Button asChild variant="secondary" className="mt-4 w-full">
                <Link href="/rider/verification">Manage documents</Link>
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
