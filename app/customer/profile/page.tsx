"use client";

import { PageHeader } from "@/components/shared";
import { PasswordCard, PersonalInfoCard } from "@/components/dashboard/account";

export default function CustomerProfilePage() {
  return (
    <>
      <PageHeader title="Profile" description="Your personal details and password." breadcrumbs={[{ label: "Overview", href: "/customer" }, { label: "Profile" }]} />
      <div className="max-w-4xl space-y-5">
        <PersonalInfoCard />
        <PasswordCard />
      </div>
    </>
  );
}
