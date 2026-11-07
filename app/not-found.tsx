import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/branding/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface px-6 text-center">
      <Logo />
      <span className="mt-10 inline-flex size-14 items-center justify-center rounded-2xl bg-white text-navy shadow-card ring-1 ring-line">
        <Compass className="size-7" />
      </span>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-navy">This route doesn&apos;t exist</h1>
      <p className="mt-2 max-w-md text-muted">The page you&apos;re looking for may have moved. Let&apos;s get you back on the road.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/track">Track a shipment</Link>
        </Button>
      </div>
    </div>
  );
}
