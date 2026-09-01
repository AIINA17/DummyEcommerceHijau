"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function PayNowButton({ orderId }: { orderId: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      size="lg"
      className="w-full"
      disabled={pending}
      data-testid="pay-now"
      onClick={async () => {
        setPending(true);
        try {
          const res = await fetch(`/api/orders/${orderId}/pay`, { method: "POST" });
          const json = await res.json();
          if (!res.ok || !json.success) {
            toast.error(json.message ?? "Pembayaran gagal");
            return;
          }
          toast.success("Pembayaran berhasil");
          router.refresh();
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? "Memproses…" : "Bayar Sekarang"}
    </Button>
  );
}
