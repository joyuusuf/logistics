"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CustomerSupportView } from "@/components/dashboard/support";

function Support() {
  const params = useSearchParams();
  return <CustomerSupportView defaultShipment={params.get("shipment") ?? undefined} />;
}

export default function CustomerSupportPage() {
  return (
    <Suspense>
      <Support />
    </Suspense>
  );
}
