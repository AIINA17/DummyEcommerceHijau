"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="toped-container py-20">
      <div className="mx-auto max-w-md rounded-xl bg-white p-10 text-center shadow-[var(--shadow-card)]">
        <AlertTriangle aria-hidden className="mx-auto size-14 text-bonus" />
        <h1 className="mt-4 text-[22px]">Ada yang tidak beres</h1>
        <p className="mt-2 text-[13px] text-ink-muted">
          Kalau ini baru pertama kali dijalankan, cek DATABASE_URL di{" "}
          <code className="rounded bg-ground px-1">.env.local</code> lalu jalankan{" "}
          <code className="rounded bg-ground px-1">npm run db:setup</code>.
        </p>
        <Button className="mt-6" onClick={reset}>
          Coba Lagi
        </Button>
      </div>
    </div>
  );
}
