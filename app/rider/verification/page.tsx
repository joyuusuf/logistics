"use client";

import * as React from "react";
import { toast } from "sonner";
import { BadgeCheck, Clock3, FileText, ShieldAlert, Upload } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/lib/services/store";
import { VERIFICATION_STATUS } from "@/lib/constants";
import { cn, formatDate, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/primitives";
import { PageHeader, StatusBadge } from "@/components/shared";
import { FileUpload, type UploadedFile } from "@/components/forms";

export default function RiderVerificationPage() {
  const { rider } = useAuth();
  const submit = useStore((s) => s.submitRiderDocuments);
  const [uploads, setUploads] = React.useState<Record<string, UploadedFile | undefined>>({});
  const [busy, setBusy] = React.useState(false);
  const status = rider!.verification;
  const editable = rider!.documents.filter((d) => d.status === "not_submitted" || d.status === "rejected");
  const pending = Object.values(uploads).filter(Boolean).length;

  const header = {
    approved: { icon: BadgeCheck, tone: "bg-emerald-tint text-emerald-deep", title: "You're fully verified", body: "All documents are approved. You can accept deliveries anywhere in your operating state." },
    under_review: { icon: Clock3, tone: "bg-info-tint text-info", title: "Documents under review", body: "Our verification team is checking your documents. This usually takes 24 to 48 hours." },
    rejected: { icon: ShieldAlert, tone: "bg-danger-tint text-danger", title: "Some documents were rejected", body: rider!.rejectionReason ?? "Re-upload the flagged documents to continue." },
    not_submitted: { icon: Upload, tone: "bg-amber-tint text-[#93630f]", title: "Documents not submitted", body: "Upload your documents to start accepting delivery jobs." },
  }[status];
  const Icon = header.icon;

  const send = async () => {
    const docs = Object.entries(uploads)
      .filter(([, f]) => !!f)
      .map(([type, f]) => ({ type, fileName: f!.fileName, previewUrl: f!.previewUrl }));
    if (!docs.length) return;
    setBusy(true);
    await sleep(800);
    submit(rider!.id, docs);
    setUploads({});
    setBusy(false);
    toast.success("Documents submitted for review");
  };

  return (
    <>
      <PageHeader title="Verification" description="Your documents and verification status." />
      <Card className="mb-5">
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className={cn("inline-flex size-14 shrink-0 items-center justify-center rounded-2xl", header.tone)}>
            <Icon className="size-7" />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-navy">{header.title}</h2>
              <StatusBadge map={VERIFICATION_STATUS} value={status} />
            </div>
            <p className="mt-1 text-sm text-muted">{header.body}</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Documents" description="Upload clear, uncropped photos or PDFs. Files stay in your browser in this demo." />
        <CardBody>
          <ul className="space-y-4">
            {rider!.documents.map((d) => {
              const canEdit = d.status === "not_submitted" || d.status === "rejected";
              return (
                <li key={d.id} className="rounded-xl border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {d.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.previewUrl} alt="" className="size-11 rounded-md object-cover ring-1 ring-line" />
                      ) : (
                        <span className="inline-flex size-11 items-center justify-center rounded-md bg-surface text-navy">
                          <FileText className="size-5" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{d.type}</p>
                        <p className="truncate text-xs text-muted">{d.fileName ? `${d.fileName}${d.uploadedAt ? ` · uploaded ${formatDate(d.uploadedAt)}` : ""}` : "No file uploaded"}</p>
                      </div>
                    </div>
                    <StatusBadge map={VERIFICATION_STATUS} value={d.status} />
                  </div>
                  {d.note && <p className="mt-3 rounded-md bg-danger-tint px-3 py-2 text-xs text-danger">{d.note}</p>}
                  {canEdit && (
                    <div className="mt-3">
                      <FileUpload label={d.status === "rejected" ? "Upload a new copy" : `Upload ${d.type.toLowerCase()}`} value={uploads[d.type]} onChange={(f) => setUploads((u) => ({ ...u, [d.type]: f }))} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {editable.length > 0 && (
            <div className="mt-5 flex flex-col items-start justify-between gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
              <p className="text-sm text-muted">{pending ? `${pending} document${pending > 1 ? "s" : ""} ready to submit` : "Select files to upload"}</p>
              <Button size="lg" onClick={send} disabled={!pending} loading={busy}>
                Submit for review
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
}
