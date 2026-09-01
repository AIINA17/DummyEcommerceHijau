import Link from "next/link";

import { Logo } from "@/components/shared/Logo";
import { BRAND, CATEGORIES } from "@/lib/constants";

const COLUMNS = [
  {
    title: BRAND.name,
    links: ["Tentang Kami", "Karier", "Blog", "Mitra Toppers"],
  },
  {
    title: "Beli",
    links: ["Bebas Ongkir", "Promo Hari Ini", "Cicilan 0%", "Bayar di Tempat"],
  },
  {
    title: "Bantuan",
    links: ["Pusat Bantuan", "Cara Belanja", "Pengembalian", "Hubungi Kami"],
  },
];

export function Footer() {
  return (
    <footer className="mt-10 border-t border-line bg-white">
      <div className="toped-container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-3 max-w-xs text-[12px] leading-relaxed text-ink-muted">
            {BRAND.tagline}. Situs demo untuk latihan — semua produk, toko, dan
            transaksi di sini fiktif.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-labelledby={`footer-${col.title}`}>
            <h2
              id={`footer-${col.title}`}
              className="mb-3 text-[12px] font-extrabold tracking-wide text-ink uppercase"
            >
              {col.title}
            </h2>
            <ul className="space-y-2">
              {col.links.map((label) => (
                <li key={label}>
                  <Link
                    href="/"
                    className="text-[12px] text-ink-muted transition-colors duration-200 hover:text-brand"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="toped-container flex flex-wrap items-center justify-between gap-3 py-4 text-[12px] text-ink-muted">
          <p>
            © {new Date().getFullYear()} {BRAND.name}. Proyek dummy, bukan situs
            komersial.
          </p>
          <ul className="flex flex-wrap gap-4">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <Link
                  href={`/search?category=${encodeURIComponent(c)}`}
                  className="transition-colors duration-200 hover:text-brand"
                >
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
