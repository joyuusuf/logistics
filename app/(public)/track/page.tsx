import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackClient } from "./track-client";
import { PageSkeleton } from "@/components/shared";

export const metadata: Metadata = { title: "Track Shipment" };

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-12">
          <PageSkeleton />
        </div>
      }
    >
      <TrackClient />
    </Suspense>
  );
}
