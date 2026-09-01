import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Wordmark: huruf kecil semua, weight 800, tracking rapat — mengikuti pola
 * logo Tokopedia asli, dengan satu huruf beraksen supaya tetap punya identitas
 * sendiri dan bukan tiruan persis.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="TokoKu — ke beranda"
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-md",
        "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none",
        className
      )}
    >
      <span
        aria-hidden
        className="grid size-7 place-items-center rounded-[9px] bg-brand text-[15px] font-extrabold text-white"
      >
        t
      </span>
      <span className="text-[22px] leading-none font-extrabold tracking-[-0.035em] text-brand">
        tokoku
      </span>
    </Link>
  );
}
