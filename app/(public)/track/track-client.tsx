"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PackageSearch, SearchX } from "lucide-react";
import { useStore } from "@/lib/services/store";
import { useHydrated } from "@/hooks/use-hydrated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/primitives";
import { EmptyState, PageSkeleton } from "@/components/shared";
import { TrackingResult } from "@/components/tracking/tracking-result";
import { sleep } from "@/lib/utils";

export function TrackClient() {
  const params = useSearchParams();
  const router = useRouter();
  const hydrated = useHydrated();
  const initial = params.get("ref") ?? "";
  const [value, setValue] = React.useState(initial);
  const [loading, setLoading] = React.useState(false);
  const [searched, setSearched] = React.useState(initial);
  const shipments = useStore((s) => s.shipments);

  React.useEffect(() => {
    setValue(initial);
    setSearched(initial);
  }, [initial]);

  const shipment = React.useMemo(() => (searched ? shipments.find((s) => s.reference.toUpperCase() === searched.trim().toUpperCase()) : undefined), [shipments, searched]);
  const samples = React.useMemo(() => shipments.filter((s) => ["in_transit", "picked_up", "delivered"].includes(s.status)).slice(0, 3), [shipments]);

  const submit = async (ref: string) => {
    const clean = ref.trim().toUpperCase();
    if (!clean) return;
    setLoading(true);
    await sleep(450);
    setLoading(false);
    router.replace(`/track?ref=${encodeURIComponent(clean)}`);
    setSearched(clean);
  };

  return (
    <div className="bg-surface">
      <section className="relative overflow-hidden bg-navy">
        <div className="absolute inset-0 opacity-[0.07] map-grid" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-16">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Track your shipment</h1>
          <p className="mt-3 text-white/70">Enter the reference from your booking confirmation, e.g. SLX-7K4QPM.</p>
          <form
            className="mt-8 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              submit(value);
            }}
          >
            <div className="relative flex-1">
              <PackageSearch className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" />
              <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Tracking number" className="h-12 border-transparent pl-11 text-base uppercase placeholder:normal-case" aria-label="Tracking number" />
            </div>
            <Button type="submit" size="lg" loading={loading}>
              Track
            </Button>
          </form>
          {hydrated && samples.length > 0 && (
            <p className="mt-4 text-xs text-white/60">
              Demo references:{" "}
              {samples.map((s, i) => (
                <React.Fragment key={s.id}>
                  {i > 0 && " · "}
                  <button type="button" onClick={() => submit(s.reference)} className="font-semibold text-white underline-offset-2 hover:underline">
                    {s.reference}
                  </button>
                </React.Fragment>
              ))}
            </p>
          )}
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {!hydrated || loading ? (
          searched || loading ? <PageSkeleton /> : null
        ) : !searched ? (
          <Card>
            <EmptyState icon={PackageSearch} title="Enter a tracking number to begin" description="You'll see the live status, timeline, assigned rider and estimated arrival." />
          </Card>
        ) : shipment ? (
          <TrackingResult shipment={shipment} />
        ) : (
          <Card>
            <EmptyState icon={SearchX} title={`We couldn't find ${searched.toUpperCase()}`} description="Check the reference for typos. References start with SLX- followed by six letters and numbers." />
          </Card>
        )}
      </div>
    </div>
  );
}
