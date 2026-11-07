"use client";

import Link from "next/link";
import { Download, PackagePlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useShipments } from "@/hooks/use-shipments";
import { DELIVERY_TYPES, SHIPMENT_STATUS } from "@/lib/constants";
import { downloadTextFile, formatDate, toCsv } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared";
import { ShipmentTable } from "@/components/tables/shipment-table";

export default function CustomerShipmentsPage() {
  const { user } = useAuth();
  const shipments = useShipments({ customerId: user!.id });

  const exportCsv = () =>
    downloadTextFile(
      "swiftlogix-shipments.csv",
      toCsv(
        shipments.map((s) => ({
          Reference: s.reference,
          Recipient: s.recipient.name,
          Destination: `${s.recipient.lga}, ${s.recipient.state}`,
          Date: formatDate(s.createdAt),
          Type: DELIVERY_TYPES[s.deliveryType].label,
          Amount: s.amount,
          Status: SHIPMENT_STATUS[s.status].label,
        })),
      ),
      "text/csv",
    );

  return (
    <>
      <PageHeader
        title="My shipments"
        description="Every delivery you've booked, with live status."
        breadcrumbs={[{ label: "Overview", href: "/customer" }, { label: "My shipments" }]}
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv} disabled={!shipments.length}>
              <Download /> Export
            </Button>
            <Button asChild>
              <Link href="/customer/book">
                <PackagePlus /> New delivery
              </Link>
            </Button>
          </>
        }
      />
      <ShipmentTable
        data={shipments}
        role="customer"
        emptyDescription="Book a delivery and it will appear here."
        emptyAction={
          <Button asChild>
            <Link href="/customer/book">Book a delivery</Link>
          </Button>
        }
      />
    </>
  );
}
