"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Ban, Building2, CheckCircle2, FileText, RotateCcw, XCircle } from "lucide-react";
import { useStore } from "@/lib/services/store";
import { useShipments } from "@/hooks/use-shipments";
import { monthlySeries, successRate } from "@/lib/services/selectors";
import { SERVICE_CATEGORIES, VEHICLE_AVAILABILITY, VEHICLE_CATEGORIES, VERIFICATION_STATUS } from "@/lib/constants";
import { formatDate, formatNaira, formatPhone } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardBody, CardHeader, DetailRow, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { NotFoundCard, PageHeader, StatusBadge } from "@/components/shared";
import { BarsChart, CHART_COLORS } from "@/components/charts";
import { ShipmentTable } from "@/components/tables/shipment-table";
import { ConfirmDialog } from "@/components/dialogs";

export default function AdminPartnerDetail() {
  const { id } = useParams<{ id: string }>();
  const partner = useStore((s) => s.partners.find((p) => p.id === id));
  const allRiders = useStore((s) => s.riders);
  const allVehicles = useStore((s) => s.vehicles);
  const review = useStore((s) => s.reviewPartner);
  const setStatus = useStore((s) => s.setPartnerStatus);
  const shipments = useShipments({ partnerId: id });
  const [dialog, setDialog] = React.useState<"approve" | "reject" | "suspend" | null>(null);
  const riders = React.useMemo(() => allRiders.filter((r) => r.partnerId === id), [allRiders, id]);
  const vehicles = React.useMemo(() => allVehicles.filter((v) => v.partnerId === id), [allVehicles, id]);
  const monthly = React.useMemo(() => monthlySeries(shipments, 6), [shipments]);

  if (!partner) return <NotFoundCard title="Partner not found" description="This company doesn't exist." href="/admin/partners" cta="Back to partners" />;
  const delivered = shipments.filter((s) => s.status === "delivered");

  return (
    <>
      <PageHeader
        title={partner.companyName}
        breadcrumbs={[{ label: "Logistics partners", href: "/admin/partners" }, { label: partner.companyName }]}
        actions={
          <>
            {partner.verification !== "approved" && (
              <>
                {partner.verification === "under_review" && (
                  <Button variant="danger-ghost" onClick={() => setDialog("reject")}>
                    <XCircle /> Reject
                  </Button>
                )}
                <Button onClick={() => setDialog("approve")}>
                  <CheckCircle2 /> Approve company
                </Button>
              </>
            )}
            {partner.status === "active" ? (
              <Button variant="secondary" onClick={() => setDialog("suspend")}>
                <Ban /> Suspend
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  setStatus(partner.id, "active");
                  toast.success("Partner reactivated");
                }}
              >
                <RotateCcw /> Reactivate
              </Button>
            )}
          </>
        }
      />
      <Card className="mb-5">
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-xl bg-navy text-white">
            <Building2 className="size-7" />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge map={VERIFICATION_STATUS} value={partner.verification} />
              {partner.status === "suspended" && <Badge tone="danger">Suspended</Badge>}
              {partner.services.map((s) => (
                <Badge key={s} tone="neutral" dot={false}>
                  {SERVICE_CATEGORIES[s]}
                </Badge>
              ))}
            </div>
            <p className="mt-2 text-sm text-ink-soft">{partner.description}</p>
            {partner.rejectionReason && <p className="mt-2 text-xs text-danger">Rejection reason: {partner.rejectionReason}</p>}
          </div>
        </CardBody>
      </Card>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Delivered", delivered.length],
          ["Success rate", `${successRate(shipments)}%`],
          ["Revenue", formatNaira(delivered.reduce((a, s) => a + s.amount, 0))],
          ["Riders / vehicles", `${riders.length} / ${vehicles.length}`],
        ].map(([l, v]) => (
          <Card key={l as string} className="p-4">
            <p className="text-xs text-muted">{l}</p>
            <p className="mt-1 text-xl font-extrabold text-navy tabular">{v}</p>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="fleet">Fleet ({vehicles.length})</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries ({shipments.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-5 xl:grid-cols-[1fr_1.4fr]">
            <Card>
              <CardHeader title="Company details" />
              <CardBody className="pt-2">
                <dl className="divide-y divide-line">
                  <DetailRow label="CAC number">{partner.cacNumber}</DetailRow>
                  <DetailRow label="Email">{partner.email}</DetailRow>
                  <DetailRow label="Phone">{formatPhone(partner.phone)}</DetailRow>
                  <DetailRow label="Address">{partner.address}</DetailRow>
                  <DetailRow label="Coverage">{partner.operatingStates.join(", ")}</DetailRow>
                  <DetailRow label="Declared fleet">{partner.fleetSize} vehicles</DetailRow>
                  <DetailRow label="Commission">{partner.commissionRate}%</DetailRow>
                  <DetailRow label="Applied">{formatDate(partner.joinedAt)}</DetailRow>
                </dl>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Performance" description="Delivered vs cancelled, last 6 months" />
              <CardBody>
                <BarsChart
                  data={monthly}
                  series={[
                    { key: "delivered", name: "Delivered", color: CHART_COLORS.emerald },
                    { key: "cancelled", name: "Cancelled", color: CHART_COLORS.danger },
                  ]}
                  stacked
                  height={260}
                />
              </CardBody>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="documents">
          <Card>
            <ul className="divide-y divide-line">
              {partner.documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-md bg-surface text-navy">
                      <FileText className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink">{d.type}</span>
                      <span className="block truncate text-xs text-muted">{d.fileName || "Not uploaded"}{d.uploadedAt ? ` · ${formatDate(d.uploadedAt)}` : ""}</span>
                    </span>
                  </span>
                  <StatusBadge map={VERIFICATION_STATUS} value={d.status} />
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>
        <TabsContent value="fleet">
          <Card>
            {vehicles.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted">No vehicles registered.</p>
            ) : (
              <ul className="divide-y divide-line">
                {vehicles.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <span className="text-sm">
                      <span className="font-semibold text-ink">{v.plate}</span>
                      <span className="text-muted">
                        {" "}
                        · {VEHICLE_CATEGORIES[v.category].label} · {v.make} {v.model} · {riders.find((r) => r.id === v.assignedRiderId)?.name ?? "Unassigned"}
                      </span>
                    </span>
                    <StatusBadge map={VEHICLE_AVAILABILITY} value={v.availability} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>
        <TabsContent value="deliveries">
          <ShipmentTable data={shipments} role="admin" showRider showCustomer emptyTitle="No deliveries yet" />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={dialog === "approve"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Approve ${partner.companyName}?`}
        description="The company will start receiving delivery requests in its coverage area."
        confirmLabel="Approve"
        onConfirm={() => {
          review(partner.id, "approved");
          toast.success("Partner approved");
        }}
      />
      <ConfirmDialog
        open={dialog === "reject"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Reject ${partner.companyName}?`}
        confirmLabel="Reject"
        tone="danger"
        requireReason
        reasonLabel="Reason shown to the company"
        onConfirm={(reason) => {
          review(partner.id, "rejected", reason);
          toast.success("Application rejected");
        }}
      />
      <ConfirmDialog
        open={dialog === "suspend"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Suspend ${partner.companyName}?`}
        description="The company and its admin account will lose access to delivery requests."
        confirmLabel="Suspend"
        tone="danger"
        requireReason
        onConfirm={() => {
          setStatus(partner.id, "suspended");
          toast.success("Partner suspended");
        }}
      />
    </>
  );
}
