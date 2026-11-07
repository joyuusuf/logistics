"use client";

import { Download } from "lucide-react";
import { useStore } from "@/lib/services/store";
import { DELIVERY_TYPES, SHIPMENT_FILTERS, SHIPMENT_STATUS } from "@/lib/constants";
import { downloadTextFile, formatDate, toCsv } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared";
import { ShipmentTable } from "@/components/tables/shipment-table";

export default function AdminDeliveriesPage() {
  const shipments = useStore((s) => s.shipments);
  const users = useStore((s) => s.users);
  return (
    <>
      <PageHeader
        title="Deliveries"
        description="Every shipment on the platform. Search by reference, assign riders and step in when needed."
        actions={
          <Button
            variant="secondary"
            onClick={() =>
              downloadTextFile(
                "swiftlogix-deliveries.csv",
                toCsv(
                  shipments.map((s) => ({
                    Reference: s.reference,
                    Customer: users.find((u) => u.id === s.customerId)?.name ?? "",
                    From: `${s.sender.lga}, ${s.sender.state}`,
                    To: `${s.recipient.lga}, ${s.recipient.state}`,
                    Date: formatDate(s.createdAt),
                    Type: DELIVERY_TYPES[s.deliveryType].label,
                    Amount: s.amount,
                    Status: SHIPMENT_STATUS[s.status].label,
                  })),
                ),
                "text/csv",
              )
            }
          >
            <Download /> Export CSV
          </Button>
        }
      />
      <ShipmentTable data={shipments} role="admin" showCustomer showRider pageSize={12} filters={[SHIPMENT_FILTERS[0], { value: "unassigned", label: "Needs rider" }, ...SHIPMENT_FILTERS.slice(1)]} />
    </>
  );
}
