import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin, ShieldCheck, Star, Store, Truck } from "lucide-react";

import { BuyBox } from "@/components/product/BuyBox";
import { ProductCard } from "@/components/product/ProductCard";
import { Separator } from "@/components/ui/separator";
import { formatIDR, formatSold, originalPrice } from "@/lib/format";
import { getProduct, getRelated } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/product/[id]">) {
  const { id } = await params;
  const product = await getProduct(Number(id));
  return { title: product ? `Jual ${product.name}` : "Produk tidak ditemukan" };
}

const GUARANTEES = [
  { Icon: ShieldCheck, label: "Garansi resmi 1 tahun" },
  { Icon: Truck, label: "Bebas ongkir ke seluruh Indonesia" },
  { Icon: Store, label: "Dikirim dari toko terverifikasi" },
];

export default async function ProductPage({ params }: PageProps<"/product/[id]">) {
  const { id } = await params;
  const product = await getProduct(Number(id));

  if (!product) notFound();

  const related = await getRelated(product);
  const price = Number(product.price);
  const discount = Number(product.discount_percent);
  const before = originalPrice(price, discount);

  return (
    <div className="toped-container py-4">
      <nav aria-label="Breadcrumb" className="mb-3">
        <ol className="flex flex-wrap items-center gap-1 text-[12px] text-ink-muted">
          <li>
            <Link href="/" className="transition-colors duration-200 hover:text-brand">
              Home
            </Link>
          </li>
          <ChevronRight aria-hidden className="size-3.5" />
          <li>
            <Link
              href={`/search?category=${encodeURIComponent(product.category)}`}
              className="transition-colors duration-200 hover:text-brand"
            >
              {product.category}
            </Link>
          </li>
          <ChevronRight aria-hidden className="size-3.5" />
          <li aria-current="page" className="truncate text-ink">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr_320px]">
        <div className="lg:sticky lg:top-40 lg:h-fit">
          <div className="overflow-hidden rounded-xl bg-white shadow-[var(--shadow-card)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image_url ?? `/api/thumb/${product.id}`}
              alt={product.name}
              width={400}
              height={400}
              className="aspect-square w-full object-cover"
            />
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-[var(--shadow-card)]">
          <h1 className="text-[22px] leading-tight">{product.name}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-ink-muted">
            <span className="flex items-center gap-1">
              <Star aria-hidden className="size-3.5 fill-star text-star" strokeWidth={0} />
              <b className="text-ink">{Number(product.rating).toFixed(1)}</b>
            </span>
            <span aria-hidden>·</span>
            <span>{formatSold(product.sold)} terjual</span>
            <span aria-hidden>·</span>
            <span>Stok {product.stock}</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p data-testid="product-price" className="text-[28px] leading-none font-extrabold">
              {formatIDR(price)}
            </p>
            {discount > 0 && (
              <>
                <span className="rounded-md bg-sale-soft px-1.5 py-0.5 text-[12px] font-extrabold text-sale">
                  {discount}%
                </span>
                <span className="text-[14px] text-ink-muted line-through">
                  {formatIDR(before)}
                </span>
              </>
            )}
          </div>

          <Separator className="my-5" />

          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-[15px] font-extrabold text-brand">
              {product.shop_name.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate text-[14px] font-bold">
                {product.shop_name}
                <ShieldCheck aria-hidden className="size-4 shrink-0 text-brand" />
              </p>
              <p className="flex items-center gap-1 text-[12px] text-ink-muted">
                <MapPin aria-hidden className="size-3" />
                {product.shop_city}
              </p>
            </div>
          </div>

          <Separator className="my-5" />

          <h2 className="text-[16px]">Detail Produk</h2>
          <dl className="mt-3 grid grid-cols-[110px_1fr] gap-y-2 text-[13px]">
            <dt className="text-ink-muted">Kondisi</dt>
            <dd className="font-bold">Baru</dd>
            <dt className="text-ink-muted">Kategori</dt>
            <dd>
              <Link
                href={`/search?category=${encodeURIComponent(product.category)}`}
                className="font-bold text-brand transition-colors duration-200 hover:text-brand-hover"
              >
                {product.category}
              </Link>
            </dd>
            <dt className="text-ink-muted">Dikirim dari</dt>
            <dd className="font-bold">{product.shop_city}</dd>
          </dl>

          <p className="mt-4 text-[13px] leading-relaxed text-ink/85">
            {product.description}
          </p>

          <ul className="mt-5 space-y-2 border-t border-line pt-5">
            {GUARANTEES.map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-[13px] text-ink-muted">
                <Icon aria-hidden className="size-4 shrink-0 text-brand" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <BuyBox product={product} />
      </div>

      {related.length > 0 && (
        <section
          className="mt-4 rounded-xl bg-white p-5 shadow-[var(--shadow-card)]"
          aria-labelledby="terkait-heading"
        >
          <h2 id="terkait-heading" className="text-[18px]">
            Produk Terkait
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
