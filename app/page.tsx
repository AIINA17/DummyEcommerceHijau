import Link from "next/link";
import {
  ArrowRight,
  Flame,
  Headphones,
  Home,
  Package,
  Shirt,
  Truck,
  Wallet,
  Zap,
} from "lucide-react";

import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/constants";
import { getCategoryCounts, getProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

const CATEGORY_ICONS: Record<string, typeof Home> = {
  "Gadget & Tech": Headphones,
  Lifestyle: Shirt,
  "Home & Living": Home,
  "Lain-lain": Package,
};

const PERKS = [
  { Icon: Truck, title: "Bebas Ongkir", note: "Min. belanja Rp0" },
  { Icon: Wallet, title: BRAND.wallet, note: "Bayar sekali klik" },
  { Icon: Zap, title: "Kirim Instan", note: "Sampai 2 jam" },
  { Icon: Flame, title: "Promo Guncang", note: "Tiap tanggal kembar" },
];

export default async function HomePage() {
  const [deals, recommended, categories] = await Promise.all([
    getProducts({ sort: "sold_desc", limit: 6 }),
    getProducts({ sort: "rating_desc", limit: 24 }),
    getCategoryCounts(),
  ]);

  return (
    <div className="toped-container space-y-4 py-4">
      <HeroCarousel />

      {/* Kategori + perks: satu kartu putih di atas ground abu, pola yang sama
          dengan blok "Kategori Populer" di tokopedia.com. */}
      <section className="toped-surface p-5" aria-labelledby="kategori-heading">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Dua kolom, bukan empat: dengan auto-rows-fr petak kategori memanjang
              mengisi tinggi kartu wallet di sebelahnya, jadi tidak ada ruang
              kosong menganga di bawahnya. */}
          <div className="flex flex-col">
            <h2 id="kategori-heading" className="text-[20px]">
              Kategori Populer
            </h2>
            <div className="mt-4 grid flex-1 auto-rows-fr grid-cols-2 gap-3">
              {categories.map(({ category, count }) => {
                const Icon = CATEGORY_ICONS[category] ?? Package;
                return (
                  <Link
                    key={category}
                    href={`/search?category=${encodeURIComponent(category)}`}
                    className="group flex items-center gap-3 rounded-lg border border-line p-3 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-border hover:bg-brand-soft/50 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold">
                        {category}
                      </span>
                      <span className="block text-[11px] text-ink-muted">
                        {count} produk
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-brand to-[#04703d] p-5 text-white">
            <p className="text-[12px] font-bold tracking-[0.14em] text-white/70 uppercase">
              {BRAND.wallet}
            </p>
            <p className="mt-2 text-[20px] leading-tight font-extrabold">
              Bayar sekali klik, tanpa kode OTP
            </p>
            <p className="mt-1.5 text-[12px] text-white/80">
              Daftar sekarang dan langsung dapat saldo Rp1.000.000 untuk coba
              belanja.
            </p>
            <Button
              variant="neutral"
              size="sm"
              className="mt-4 w-full"
              render={<Link href="/register" />}
            >
              Aktifkan Sekarang
            </Button>
          </div>
        </div>

        <ul className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-5 sm:grid-cols-4">
          {PERKS.map(({ Icon, title, note }) => (
            <li key={title} className="flex items-center gap-2.5">
              <Icon aria-hidden className="size-5 shrink-0 text-brand" />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-bold">{title}</span>
                <span className="block truncate text-[11px] text-ink-muted">
                  {note}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="toped-surface p-5" aria-labelledby="guncang-heading">
        <div className="flex flex-wrap items-center gap-3">
          <h2
            id="guncang-heading"
            className="flex items-center gap-2 text-[20px]"
          >
            <Flame aria-hidden className="size-5 text-sale" />
            Promo Guncang
          </h2>
          <p className="text-[12px] text-ink-muted">Paling laris minggu ini</p>
          <Link
            href="/search?sort=sold_desc"
            className="ml-auto flex items-center gap-1 text-[13px] font-bold text-brand transition-colors duration-200 hover:text-brand-hover"
          >
            Lihat Semua
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {deals.map((p) => (
            <ProductCard key={p.id} product={p} priority />
          ))}
        </div>
      </section>

      <section className="toped-surface p-5" aria-labelledby="rekomendasi-heading">
        <h2 id="rekomendasi-heading" className="text-[20px]">
          Rekomendasi Untukmu
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {recommended.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <Button variant="outline" render={<Link href="/search" />}>
            Muat Lebih Banyak
          </Button>
        </div>
      </section>
    </div>
  );
}
