"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PackageSearch, SearchX } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useShipments } from "@/hooks/use-shipments";
import { isActive } from "@/lib/services/selectors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/primitives";
import { EmptyState, PageHeader, ShipmentStatusBadge } from "@/components/shared";
import { TrackingResult } from "@/components/tracking/tracking-result";

function CustomerTrack() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const shipments = useShipments({ customerId: user!.id });
  const active = shipments.filter(isActive);
  const ref = params.get("ref") ?? active[0]?.reference ?? "";
  const [value, setValue] = React.useState(params.get("ref") ?? "");
  const shipment = shipments.find((s) => s.reference === ref.toUpperCase());

  const go = (r: string) => router.replace(`/customer/track?ref=${encodeURIComponent(r.trim().toUpperCase())}`);

  return (
    <>
      <PageHeader title="Track shipment" description="Follow your deliveries step by step." breadcrumbs={[{ label: "Overview", href: "/customer" }, { label: "Track shipment" }]} />
      <Card className="mb-5">
        <CardBody className="space-y-4">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (value.trim()) go(value);
            }}
          >
            <div className="relative flex-1">
              <PackageSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Enter a shipment reference, e.g. SLX-7K4QPM" className="pl-9 uppercase placeholder:normal-case" aria-label="Shipment reference" />
            </div>
            <Button type="submit">Track</Button>
          </form>
          {active.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-muted uppercase">Active deliveries</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {active.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setValue(s.reference);
                      go(s.reference);
                    }}
                    className={cn("flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-left", ref === s.reference ? "border-emerald bg-emerald-tint/40" : "border-line hover:border-line-strong")}
                  >
                    <span className="text-[13px] font-semibold text-navy">{s.reference}</span>
                    <ShipmentStatusBadge status={s.status} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
      {shipment ? (
        <TrackingResult shipment={shipment} showPrivate />
      ) : (
        <Card>
          {ref ? (
            <EmptyState icon={SearchX} title={`No shipment ${ref.toUpperCase()} on your account`} description="Check the reference or use the public tracking page for shipments booked by someone else." />
          ) : (
            <EmptyState icon={PackageSearch} title="Nothing to track right now" description="You have no active deliveries. Enter a reference above to look up a past shipment." />
          )}
        </Card>
      )}
    </>
  );
}

export default function CustomerTrackPage() {
  return (
    <Suspense>
      <CustomerTrack />
    </Suspense>
  );
}
