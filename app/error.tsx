"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-danger-tint text-danger">
        <TriangleAlert className="size-7" />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold text-navy">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-muted">An unexpected error occurred. Try again, or reset the demo data from Settings if the problem continues.</p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button
          variant="secondary"
          onClick={() => {
            try {
              localStorage.removeItem("swiftlogix-demo-v1");
            } catch {}
            window.location.assign("/");
          }}
        >
          Reset demo data
        </Button>
      </div>
    </div>
  );
}
