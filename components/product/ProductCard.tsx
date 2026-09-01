import Link from "next/link";
import { MapPin, Star } from "lucide-react";

import { formatIDR, formatSold, originalPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Anatomi persis kartu produk Tokopedia (lihat design/screenshots):
 * gambar 1:1 → badge diskon → judul 2 baris → harga → harga coret →
 * ⭐ rating · N terjual → kota toko.
 */
export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const discount = Number(product.discount_percent);
  const price = Number(product.price);
  const before = originalPrice(price, discount);
  const soldOut = product.stock <= 0;

  return (
    <Link
      href={`/product/${product.id}`}
      data-testid="product-card"
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border border-line bg-white",
        "transition-[transform,box-shadow,border-color] duration-200",
        "hover:-translate-y-0.5 hover:border-transparent hover:shadow-[var(--shadow-card)]",
        "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none",
        soldOut && "opacity-70"
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-ground">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image_url ?? `/api/thumb/${product.id}`}
          alt={product.name}
          width={400}
          height={400}
          loading={priority ? "eager" : "lazy"}
          className="size-full object-cover transition-transform duration-[280ms] ease-[var(--ease-toped)] group-hover:scale-[1.03]"
        />

        {discount > 0 && (
          <span className="absolute top-2 left-2 rounded-md bg-sale px-1.5 py-0.5 text-[11px] leading-4 font-extrabold text-white">
            {discount}%
          </span>
        )}

        {soldOut && (
          <span className="absolute inset-0 grid place-items-center bg-white/75 text-[13px] font-extrabold text-ink-muted">
            Stok Habis
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <h3 className="line-clamp-2-fixed text-[12px] leading-[1.4] font-normal text-ink/85">
          {product.name}
        </h3>

        <p
          data-testid="card-price"
          className="text-[14px] font-extrabold text-ink"
        >
          {formatIDR(price)}
        </p>

        {discount > 0 && (
          <p className="text-[11px] text-ink-muted line-through">
            {formatIDR(before)}
          </p>
        )}

        <div className="mt-auto flex items-center gap-1.5 pt-1 text-[11px] text-ink-muted">
          <Star
            aria-hidden
            className="size-3.5 fill-star text-star"
            strokeWidth={0}
          />
          <span className="font-bold text-ink/80">
            {Number(product.rating).toFixed(1)}
          </span>
          <span aria-hidden>·</span>
          <span>{formatSold(product.sold)} terjual</span>
        </div>

        <p className="flex items-center gap-1 text-[11px] text-ink-muted">
          <MapPin aria-hidden className="size-3" />
          <span className="truncate">{product.shop_city}</span>
        </p>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="toped-shimmer aspect-square" />
      <div className="space-y-2 p-2.5">
        <div className="toped-shimmer h-3 w-full rounded" />
        <div className="toped-shimmer h-3 w-2/3 rounded" />
        <div className="toped-shimmer h-4 w-1/2 rounded" />
        <div className="toped-shimmer h-3 w-1/3 rounded" />
      </div>
    </div>
  );
}
