"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Ban, CheckCircle2, Mail, MapPin, Package, Phone, RotateCcw, Wallet } from "lucide-react";
import { useStore } from "@/lib/services/store";
import { useShipments } from "@/hooks/use-shipments";
import { shipmentStats } from "@/lib/services/selectors";
import { formatDate, formatNaira, formatPhone } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, Card, CardBody } from "@/components/ui/primitives";
import { NotFoundCard, PageHeader, StatCard, StatGrid } from "@/components/shared";
import { ShipmentTable } from "@/components/tables/shipment-table";
import { ConfirmDialog } from "@/components/dialogs";

export default function AdminCustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const user = useStore((s) => s.users.find((u) => u.id === id && u.role === "customer"));
  const addresses = useStore((s) => s.addresses);
  const setStatus = useStore((s) => s.setUserStatus);
  const shipments = useShipments({ customerId: id });
  const [open, setOpen] = React.useState(false);

  if (!user) return <NotFoundCard title="Customer not found" description="This customer doesn't exist." href="/admin/customers" cta="Back to customers" />;
  const stats = shipmentStats(shipments);
  const defaultAddress = addresses.find((a) => a.customerId === user.id && a.isDefault);

  return (
    <>
      <PageHeader
        title={user.name}
        breadcrumbs={[{ label: "Customers", href: "/admin/customers" }, { label: user.name }]}
        actions={
          user.status === "active" ? (
            <Button variant="danger-ghost" onClick={() => setOpen(true)}>
              <Ban /> Suspend account
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => {
                setStatus(user.id, "active");
                toast.success("Account reactivated");
              }}
            >
              <RotateCcw /> Reactivate account
            </Button>
          )
        }
      />
      <Card className="mb-5">
        <CardBody className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={user.name} src={user.avatarUrl} size={64} />
          <div className="flex-1 space-y-1.5 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-bold text-navy">{user.name}</span>
              {user.status === "active" ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Suspended</Badge>}
              {user.emailVerified ? <Badge tone="info" dot={false}>Email verified</Badge> : <Badge tone="warning" dot={false}>Email unverified</Badge>}
            </div>
            <p className="flex flex-wrap gap-x-5 gap-y-1 text-ink-soft">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-4 text-muted" /> {user.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone className="size-4 text-muted" /> {formatPhone(user.phone)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-muted" /> {defaultAddress ? `${defaultAddress.address}, ` : ""}
                {user.city}, {user.state}
              </span>
            </p>
            <p className="text-xs text-muted">Customer since {formatDate(user.createdAt)}</p>
          </div>
        </CardBody>
      </Card>
      <StatGrid>
        <StatCard label="Shipments" value={stats.total} icon={Package} />
        <StatCard label="Delivered" value={stats.delivered} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Cancelled" value={stats.cancelled} icon={Ban} tone="danger" />
        <StatCard label="Total spent" value={formatNaira(stats.revenue)} icon={Wallet} tone="amber" />
      </StatGrid>
      <h2 className="mt-7 mb-3 text-[15px] font-bold text-ink">Shipment history</h2>
      <ShipmentTable data={shipments} role="admin" showRider emptyTitle="No shipments yet" />
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Suspend ${user.name}?`}
        description="They won't be able to sign in or book deliveries until reactivated."
        confirmLabel="Suspend"
        tone="danger"
        requireReason
        onConfirm={() => {
          setStatus(user.id, "suspended");
          toast.success("Account suspended");
        }}
      />
    </>
  );
}
