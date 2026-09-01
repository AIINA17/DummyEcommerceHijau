import Link from "next/link";
import { Check } from "lucide-react";

import { Logo } from "@/components/shared/Logo";
import { BRAND } from "@/lib/constants";

const SELLING_POINTS = [
  "Gratis ongkir ke seluruh Indonesia",
  `Saldo ${BRAND.wallet} Rp1.000.000 untuk pengguna baru`,
  "Belanja aman, uang kembali kalau barang tidak sampai",
];

/**
 * Dua kolom: panel hijau bercerita di kiri, form di kanan. Di bawah lg panel
 * hilang sepenuhnya — di layar kecil yang dibutuhkan cuma form.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="toped-container py-10">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-brand to-[#04703d] p-8 text-white lg:flex">
          <Link href="/" className="text-[22px] font-extrabold tracking-[-0.035em]">
            tokoku
          </Link>

          <div>
            <p className="text-[24px] leading-tight font-extrabold">
              {BRAND.tagline}.
            </p>
            <ul className="mt-6 space-y-3">
              {SELLING_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-[13px]">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] text-white/60">
            Situs demo untuk latihan. Jangan masukkan data asli.
          </p>
        </div>

        <div className="p-8">
          <div className="lg:hidden">
            <Logo />
          </div>

          <h1 className="mt-6 text-[24px] lg:mt-0">{title}</h1>
          <p className="mt-1.5 text-[13px] text-ink-muted">{subtitle}</p>

          <div className="mt-6">{children}</div>

          <div className="mt-6 text-center text-[13px] text-ink-muted">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}
