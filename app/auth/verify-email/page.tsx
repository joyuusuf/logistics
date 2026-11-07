"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useHydrated } from "@/hooks/use-hydrated";
import { useStore } from "@/lib/services/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/primitives";
import { sleep } from "@/lib/utils";

export default function VerifyEmailPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const { user } = useAuth();
  const verify = useStore((s) => s.verifyEmail);
  const [code] = React.useState(() => String(Math.floor(100000 + Math.random() * 900000)));
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState<string>();
  const [busy, setBusy] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  React.useEffect(() => {
    if (hydrated && !user) router.replace("/auth/login");
  }, [hydrated, user, router]);

  if (!hydrated || !user) return <Skeleton className="h-80 w-full rounded-xl" />;

  const nextPath = user.role === "customer" || user.role === "admin" ? `/${user.role}` : "/auth/account-verification";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() !== code) {
      setError("That code doesn't match. Check the latest email and try again.");
      return;
    }
    setBusy(true);
    await sleep(600);
    verify(user.id);
    setBusy(false);
    toast.success("Email verified");
    router.push(nextPath);
  };

  if (user.emailVerified) {
    return (
      <div>
        <h1 className="text-[28px] font-extrabold tracking-tight text-navy">Your email is verified</h1>
        <p className="mt-2 text-sm text-muted">{user.email} is confirmed.</p>
        <Button asChild size="lg" className="mt-6 w-full">
          <Link href={nextPath}>Continue</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <span className="inline-flex size-12 items-center justify-center rounded-xl bg-emerald-tint text-emerald-deep">
        <Mail className="size-6" />
      </span>
      <h1 className="mt-5 text-[28px] font-extrabold tracking-tight text-navy">Verify your email</h1>
      <p className="mt-2 text-sm text-muted">
        We sent a 6-digit code to <span className="font-semibold text-ink">{user.email}</span>. Enter it below to activate your account.
      </p>
      <div className="mt-5 rounded-lg border border-amber/40 bg-amber-tint/60 p-4 text-sm">
        <p className="font-semibold text-navy">Demo inbox</p>
        <p className="mt-1 text-ink-soft">
          Your verification code is <span className="font-mono text-base font-bold tracking-widest text-navy">{code}</span>
        </p>
      </div>
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value.replace(/\D/g, "").slice(0, 6));
            setError(undefined);
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="••••••"
          aria-label="Verification code"
          aria-invalid={!!error}
          className="h-14 text-center font-mono text-2xl tracking-[0.5em]"
        />
        {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={busy} disabled={value.length !== 6}>
          Verify email
        </Button>
      </form>
      <div className="mt-5 flex items-center justify-between text-sm">
        <button
          type="button"
          disabled={cooldown > 0}
          onClick={() => {
            setCooldown(30);
            toast.success("A new code was sent (demo: the code above stays the same)");
          }}
          className="font-semibold text-emerald-deep disabled:text-muted"
        >
          {cooldown ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
        <Link href={nextPath} className="font-semibold text-muted hover:text-ink">
          Skip for now
        </Link>
      </div>
    </div>
  );
}
