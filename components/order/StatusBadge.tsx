import { CheckCircle2, Clock, XCircle } from "lucide-react";

import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLES: Record<
  OrderStatus,
  { label: string; Icon: typeof Clock; className: string }
> = {
  paid: {
    label: "Selesai",
    Icon: CheckCircle2,
    className: "bg-brand-soft text-brand",
  },
  pending: {
    label: "Menunggu Pembayaran",
    Icon: Clock,
    className: "bg-[#fff5e6] text-bonus",
  },
  cancelled: {
    label: "Dibatalkan",
    Icon: XCircle,
    className: "bg-sale-soft text-sale",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const { label, Icon, className: tone } = STYLES[status] ?? STYLES.pending;
  return (
    <span
      data-testid="order-status"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-extrabold",
        tone,
        className
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {label}
    </span>
  );
}
