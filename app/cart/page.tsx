"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

import { useCart } from "@/components/cart-store";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SERVICE_FEE, SHIPPING_FEE } from "@/lib/constants";
import { formatIDR } from "@/lib/format";

export default function CartPage() {
  const router = useRouter();
  const { status } = useSession();
  const { items, loading, setQuantity, remove } = useCart();

  // Yang disimpan adalah id yang SENGAJA dilepas centangnya, bukan yang
  // tercentang. Dengan begitu barang baru otomatis ikut terpilih dan barang
  // yang sudah dihapus hilang sendiri dari perhitungan — tanpa effect yang
  // menyalin daftar keranjang ke dalam state seleksi.
  const [unchecked, setUnchecked] = useState<number[]>([]);

  const chosen = useMemo(
    () => items.filter((i) => !unchecked.includes(i.id)),
    [items, unchecked]
  );

  const itemsTotal = chosen.reduce(
    (sum, i) => sum + Number(i.product.price) * i.quantity,
    0
  );
  const total = chosen.length ? itemsTotal + SERVICE_FEE + SHIPPING_FEE : 0;

  if (status === "unauthenticated") {
    return (
      <EmptyState
        title="Masuk dulu buat lihat keranjang"
        body="Keranjang tersimpan di akunmu, jadi bisa dibuka dari perangkat mana saja."
        action={{ href: "/login?callbackUrl=/cart", label: "Masuk" }}
      />
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="toped-container grid gap-4 py-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="toped-shimmer h-28 rounded-xl" />
          ))}
        </div>
        <div className="toped-shimmer h-64 rounded-xl" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Keranjang kamu masih kosong"
        body="Yuk isi dengan barang-barang impianmu. Cek promo yang lagi jalan dulu."
        action={{ href: "/search", label: "Mulai Belanja" }}
      />
    );
  }

  const allChecked = chosen.length === items.length;

  return (
    <div className="toped-container py-4">
      <h1 className="mb-4 text-[24px]">Keranjang</h1>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-[var(--shadow-card)]">
            <Checkbox
              id="pilih-semua"
              checked={allChecked}
              onCheckedChange={(checked) =>
                setUnchecked(checked ? [] : items.map((i) => i.id))
              }
            />
            <label htmlFor="pilih-semua" className="text-[14px] font-bold">
              Pilih Semua ({items.length})
            </label>
          </div>

          <ul className="space-y-3">
            {items.map((item) => {
              const price = Number(item.product.price);
              const checked = !unchecked.includes(item.id);
              return (
                <li
                  key={item.id}
                  data-testid="cart-item"
                  className="flex gap-3 rounded-xl bg-white p-4 shadow-[var(--shadow-card)]"
                >
                  <Checkbox
                    className="mt-1"
                    checked={checked}
                    aria-label={`Pilih ${item.product.name}`}
                    onCheckedChange={(next) =>
                      setUnchecked((prev) =>
                        next
                          ? prev.filter((id) => id !== item.id)
                          : [...prev, item.id]
                      )
                    }
                  />

                  <Link
                    href={`/product/${item.product_id}`}
                    className="shrink-0 overflow-hidden rounded-lg border border-line"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.product.image_url ?? `/api/thumb/${item.product_id}`}
                      alt={item.product.name}
                      width={80}
                      height={80}
                      className="size-20 object-cover"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${item.product_id}`}
                      className="line-clamp-2 text-[14px] transition-colors duration-200 hover:text-brand"
                    >
                      {item.product.name}
                    </Link>
                    <p className="mt-1 text-[12px] text-ink-muted">
                      {item.product.shop_name}
                    </p>
                    <p className="mt-2 text-[16px] font-extrabold">
                      {formatIDR(price * item.quantity)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between gap-3">
                    <button
                      type="button"
                      aria-label={`Hapus ${item.product.name}`}
                      onClick={() => void remove(item.id)}
                      className="grid size-8 place-items-center rounded-md text-ink-muted transition-colors duration-200 hover:bg-sale-soft hover:text-sale focus-visible:ring-2 focus-visible:ring-sale focus-visible:outline-none"
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </button>

                    <div className="flex h-8 items-center rounded-lg border border-line">
                      <button
                        type="button"
                        aria-label="Kurangi"
                        onClick={() => void setQuantity(item.id, item.quantity - 1)}
                        className="grid size-8 place-items-center rounded-l-lg text-brand transition-colors duration-200 hover:bg-brand-soft"
                      >
                        <Minus aria-hidden className="size-3.5" />
                      </button>
                      <span
                        aria-live="polite"
                        className="w-9 border-x border-line text-center text-[13px] font-bold"
                      >
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Tambah"
                        disabled={item.quantity >= item.product.stock}
                        onClick={() => void setQuantity(item.id, item.quantity + 1)}
                        className="grid size-8 place-items-center rounded-r-lg text-brand transition-colors duration-200 hover:bg-brand-soft disabled:text-ink-muted/40 disabled:hover:bg-transparent"
                      >
                        <Plus aria-hidden className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-[var(--shadow-card)] lg:sticky lg:top-40">
          <h2 className="text-[16px]">Ringkasan Belanja</h2>

          <dl className="mt-4 space-y-2 text-[13px]">
            <Row label={`Total Harga (${chosen.length} barang)`} value={itemsTotal} />
            <Row label="Ongkos Kirim" value={chosen.length ? SHIPPING_FEE : 0} />
            <Row label="Biaya Layanan" value={chosen.length ? SERVICE_FEE : 0} />
          </dl>

          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-[14px] font-bold">Total Tagihan</span>
            <span data-testid="cart-total" className="text-[18px] font-extrabold">
              {formatIDR(total)}
            </span>
          </div>

          <Button
            className="mt-4 w-full"
            size="lg"
            disabled={chosen.length === 0}
            data-testid="checkout-button"
            onClick={() =>
              router.push(`/checkout?items=${chosen.map((i) => i.id).join(",")}`)
            }
          >
            Beli ({chosen.length})
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-bold">{formatIDR(value)}</dd>
    </div>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: { href: string; label: string };
}) {
  return (
    <div className="toped-container py-16">
      <div className="mx-auto max-w-md rounded-xl bg-white p-10 text-center shadow-[var(--shadow-card)]">
        <ShoppingCart aria-hidden className="mx-auto size-12 text-ink-muted/50" />
        <h1 className="mt-4 text-[18px]">{title}</h1>
        <p className="mt-2 text-[13px] text-ink-muted">{body}</p>
        <Button className="mt-6" render={<Link href={action.href} />}>
          {action.label}
        </Button>
      </div>
    </div>
  );
}
