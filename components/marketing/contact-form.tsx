"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { contactSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";

type Values = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [sent, setSent] = React.useState(false);
  const { register, handleSubmit, reset, formState } = useForm<Values>({ resolver: zodResolver(contactSchema), defaultValues: { topic: "" } });
  const { errors, isSubmitting } = formState;

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 700));
    setSent(true);
    reset();
    toast.success("Message sent (demo). We'll be in touch.");
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-white p-10 text-center shadow-card">
        <CheckCircle2 className="size-12 text-emerald" />
        <h2 className="mt-4 text-xl font-bold text-navy">Thanks, your message is in</h2>
        <p className="mt-2 max-w-sm text-sm text-muted">A member of our team will reply within one business day. For urgent delivery issues, call our support line.</p>
        <Button variant="secondary" className="mt-6" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="c-name" error={errors.name?.message}>
          <Input id="c-name" {...register("name")} aria-invalid={!!errors.name} autoComplete="name" />
        </Field>
        <Field label="Email" htmlFor="c-email" error={errors.email?.message}>
          <Input id="c-email" type="email" {...register("email")} aria-invalid={!!errors.email} autoComplete="email" />
        </Field>
        <Field label="Phone" htmlFor="c-phone" optional>
          <Input id="c-phone" type="tel" {...register("phone")} placeholder="0803 123 4567" autoComplete="tel" />
        </Field>
        <Field label="Topic" htmlFor="c-topic" error={errors.topic?.message}>
          <NativeSelect id="c-topic" {...register("topic")} aria-invalid={!!errors.topic}>
            <option value="">Choose a topic</option>
            <option>A delivery I booked</option>
            <option>Business account</option>
            <option>Becoming a logistics partner</option>
            <option>Becoming a rider</option>
            <option>Something else</option>
          </NativeSelect>
        </Field>
      </div>
      <Field label="Message" htmlFor="c-msg" error={errors.message?.message}>
        <Textarea id="c-msg" rows={5} {...register("message")} aria-invalid={!!errors.message} placeholder="Include your shipment reference if this is about a delivery." />
      </Field>
      <Button type="submit" size="lg" loading={isSubmitting}>
        Send message
      </Button>
    </form>
  );
}
