"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { Vehicle } from "@/types";
import { vehicleSchema } from "@/lib/validations";
import { useStore } from "@/lib/services/store";
import { VEHICLE_AVAILABILITY, VEHICLE_CATEGORIES } from "@/lib/constants";
import { sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/overlays";

type Values = z.infer<typeof vehicleSchema>;

export function VehicleDialog({ open, onOpenChange, partnerId, vehicle }: { open: boolean; onOpenChange: (o: boolean) => void; partnerId: string; vehicle?: Vehicle }) {
  const add = useStore((s) => s.addVehicle);
  const update = useStore((s) => s.updateVehicle);
  const empty: Values = { category: "motorcycle", make: "", model: "", year: new Date().getFullYear() - 2, plate: "", color: "", availability: "available" };
  const { register, handleSubmit, reset, setError, formState } = useForm<Values>({ resolver: zodResolver(vehicleSchema), defaultValues: empty });
  const { errors, isSubmitting } = formState;

  React.useEffect(() => {
    if (open) reset(vehicle ? { category: vehicle.category, make: vehicle.make, model: vehicle.model, year: vehicle.year, plate: vehicle.plate, color: vehicle.color, availability: vehicle.availability } : empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vehicle]);

  const onSubmit = async (v: Values) => {
    await sleep(450);
    const res = vehicle ? update(vehicle.id, { ...v, capacityKg: VEHICLE_CATEGORIES[v.category].capacityKg }) : add({ ...v, partnerId });
    if (!res.ok) {
      setError("plate", { message: res.error });
      return;
    }
    toast.success(vehicle ? "Vehicle updated" : `${v.plate.toUpperCase()} added to your fleet`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={vehicle ? "Edit vehicle" : "Register a vehicle"} description="Vehicle details are shown to customers when a rider is assigned." size="lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
          <Field label="Vehicle category" htmlFor="v-cat">
            <NativeSelect id="v-cat" {...register("category")}>
              {Object.entries(VEHICLE_CATEGORIES).map(([k, c]) => (
                <option key={k} value={k}>
                  {c.label} (up to {c.capacityKg.toLocaleString()} kg)
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Registration number" htmlFor="v-plate" error={errors.plate?.message} hint="e.g. LND-123AA">
            <Input id="v-plate" {...register("plate")} aria-invalid={!!errors.plate} className="uppercase" />
          </Field>
          <Field label="Make" htmlFor="v-make" error={errors.make?.message}>
            <Input id="v-make" {...register("make")} aria-invalid={!!errors.make} placeholder="e.g. Toyota" />
          </Field>
          <Field label="Model" htmlFor="v-model" error={errors.model?.message}>
            <Input id="v-model" {...register("model")} aria-invalid={!!errors.model} placeholder="e.g. Hiace" />
          </Field>
          <Field label="Year" htmlFor="v-year" error={errors.year?.message}>
            <Input id="v-year" type="number" inputMode="numeric" {...register("year")} aria-invalid={!!errors.year} />
          </Field>
          <Field label="Colour" htmlFor="v-color" error={errors.color?.message}>
            <Input id="v-color" {...register("color")} aria-invalid={!!errors.color} />
          </Field>
          <Field label="Availability" htmlFor="v-avail" className="sm:col-span-2">
            <NativeSelect id="v-avail" {...register("availability")}>
              {Object.entries(VEHICLE_AVAILABILITY).map(([k, a]) => (
                <option key={k} value={k}>
                  {a.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {vehicle ? "Save changes" : "Register vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
