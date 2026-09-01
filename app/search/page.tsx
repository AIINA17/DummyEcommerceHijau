import { Suspense } from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";

import { FilterSidebar } from "@/components/product/FilterSidebar";
import { ProductCard, ProductCardSkeleton } from "@/components/product/ProductCard";
import { SortSelect } from "@/components/product/SortSelect";
import { Button } from "@/components/ui/button";
import { countProducts, getProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const category = typeof sp.category === "string" ? sp.category : "";
  const what = q || category || "Semua Produk";
  return { title: `Jual ${what}` };
}

function num(value: string | string[] | undefined): number | undefined {
  if (typeof value !== "string" || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function str(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

async function Results({
  searchParams,
}: {
  searchParams: Awaited<PageProps<"/search">["searchParams"]>;
}) {
  const filter = {
    q: str(searchParams.q),
    category: str(searchParams.category),
    min: num(searchParams.min),
    max: num(searchParams.max),
    rating: num(searchParams.rating),
    sort: str(searchParams.sort),
  };

  const [products, total] = await Promise.all([
    getProducts(filter),
    countProducts(filter),
  ]);

  if (products.length === 0) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-[var(--shadow-card)]">
        <SearchX aria-hidden className="mx-auto size-12 text-ink-muted/60" />
        <h2 className="mt-4 text-[18px]">Produknya belum ketemu</h2>
        <p className="mx-auto mt-2 max-w-sm text-[13px] text-ink-muted">
          Coba kata kunci yang lebih umum, atau lepas beberapa filter yang sedang
          aktif.
        </p>
        <Button variant="outline" className="mt-5" render={<Link href="/search" />}>
          Lihat Semua Produk
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-ink-muted">
          Menampilkan <b className="text-ink">{products.length}</b> dari{" "}
          <b className="text-ink">{total}</b> barang
          {filter.q && (
            <>
              {" "}
              untuk <b className="text-ink">&ldquo;{filter.q}&rdquo;</b>
            </>
          )}
        </p>
        <SortSelect />
      </div>

      <div
        data-testid="product-grid"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"
      >
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} priority={i < 8} />
        ))}
      </div>
    </>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 12 }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;

  return (
    <div className="toped-container py-4">
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <div className="hidden lg:block">
          <Suspense fallback={<div className="h-96 rounded-xl bg-white" />}>
            <FilterSidebar />
          </Suspense>
        </div>

        <div>
          {/* key memaksa Suspense jatuh lagi ke skeleton tiap filter berubah,
              bukan menampilkan hasil lama yang sudah tidak cocok. */}
          <Suspense key={JSON.stringify(sp)} fallback={<ResultsSkeleton />}>
            <Results searchParams={sp} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
