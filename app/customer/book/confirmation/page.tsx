"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle2, Copy, Navigation, PackagePlus, Share2 } from "lucide-react";
import { useShipment } from "@/hooks/use-shipments";
import { DELIVERY_TYPES } from "@/lib/constants";
import { formatDateTime, formatNaira } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardBody, DetailRow } from "@/components/ui/primitives";
import { NotFoundCard } from "@/components/shared";

function Confirmation() {
  const params = useSearchParams();
  const shipment = useShipment(params.get("id") ?? undefined);
  if (!shipment) return <NotFoundCard title="Booking not found" description="We couldn't find that booking. It may have been reset." href="/customer/shipments" cta="Go to my shipments" />;

  const copy = (text: string, label: string) =>
    navigator.clipboard?.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Could not copy"),
    );
  const shareText = `Your SwiftLogix delivery ${shipment.reference} is on its way. Track it at ${typeof window !== "undefined" ? window.location.origin : ""}/track?ref=${shipment.reference}. Give the rider this PIN on arrival: ${shipment.pin}`;

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="overflow-hidden">
        <div className="bg-navy px-6 py-10 text-center text-white">
          <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-emerald">
            <CheckCircle2 className="size-9" />
          </motion.span>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Booking confirmed</h1>
          <p className="mt-1 text-white/70">Payment received. We&apos;re matching you with a nearby rider.</p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5">
            <span className="text-xs tracking-wide text-white/60 uppercase">Reference</span>
            <span className="text-xl font-extrabold tracking-wide">{shipment.reference}</span>
            <button type="button" onClick={() => copy(shipment.reference, "Reference")} className="rounded p-1 text-white/70 hover:text-white" aria-label="Copy reference">
              <Copy className="size-4" />
            </button>
          </div>
        </div>
        <CardBody className="space-y-5">
          <div className="rounded-xl border-2 border-dashed border-emerald/40 bg-emerald-tint/40 p-5 text-center">
            <p className="text-sm font-semibold text-navy">Delivery PIN for your recipient</p>
            <p className="mt-2 font-mono text-4xl font-extrabold tracking-[0.4em] text-navy">{shipment.pin}</p>
            <p className="mt-2 text-xs text-muted">Share this with {shipment.recipient.name}. The rider can only complete delivery with this code.</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => {
                if (navigator.share) navigator.share({ title: "SwiftLogix delivery", text: shareText }).catch(() => undefined);
                else copy(shareText, "Message");
              }}
            >
              <Share2 /> Share with recipient
            </Button>
          </div>
          <dl className="divide-y divide-line">
            <DetailRow label="From">
              {shipment.sender.lga}, {shipment.sender.state}
            </DetailRow>
            <DetailRow label="To">
              {shipment.recipient.name} · {shipment.recipient.lga}, {shipment.recipient.state}
            </DetailRow>
            <DetailRow label="Delivery option">{DELIVERY_TYPES[shipment.deliveryType].label}</DetailRow>
            <DetailRow label="Estimated arrival">{formatDateTime(shipment.estimatedArrival)}</DetailRow>
            <DetailRow label="Amount paid">
              <span className="text-base font-extrabold text-navy">{formatNaira(shipment.amount)}</span>
            </DetailRow>
          </dl>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild size="lg" className="flex-1">
              <Link href={`/customer/shipments/${shipment.id}`}>
                <Navigation /> Track this shipment
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="flex-1">
              <Link href="/customer/book">
                <PackagePlus /> Book another
              </Link>
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense>
      <Confirmation />
    </Suspense>
  );
}
