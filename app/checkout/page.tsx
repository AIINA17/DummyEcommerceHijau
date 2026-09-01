"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { MapPin, Truck, Wallet } from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/components/cart-store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PAYMENT_METHODS, SERVICE_FEE, SHIPPING_FEE } from "@/lib/constants";
import { formatIDR } from "@/lib/format";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

function CheckoutView() {
  const router = useRouter();
  const params = useSearchParams();
  const { status } = useSession();
  const { items, loading, refresh } = useCart();

  const [user, setUser] = useState<User | null>(null);
  const [method, setMethod] = useState<string>(PAYMENT_METHODS[0].id);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/user")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j?.success && setUser(j.data))
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=/cart");
  }, [status, router]);

  // ?items=1,2 memilih baris keranjang tertentu. Tanpa parameter itu, seluruh
  // keranjang yang di-checkout.
  const selectedIds = useMemo(() => {
    const raw = params.get("items");
    if (!raw) return null;
    return raw.split(",").map(Number).filter(Number.isInteger);
  }, [params]);

  const chosen = useMemo(
    () => (selectedIds ? items.filter((i) => selectedIds.includes(i.id)) : items),
    [items, selectedIds]
  );

  const itemsTotal = chosen.reduce(
    (sum, i) => sum + Number(i.product.price) * i.quantity,
    0
  );
  const total = itemsTotal + SERVICE_FEE + SHIPPING_FEE;

  const balance = user ? Number(user.balance) : 0;
  const walletShort = method === "TOKOKUPAY" && balance < total;

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: chosen.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
          })),
          payment_method: method,
          clear_cart: true,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error(json.message ?? "Gagal membuat pesanan");
        return;
      }

      await refresh();
      router.push(`/order/${json.data.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && items.length === 0) {
    return (
      <div className="toped-container grid gap-4 py-4 lg:grid-cols-[1fr_340px]">
        <div className="toped-shimmer h-96 rounded-xl" />
        <div className="toped-shimmer h-72 rounded-xl" />
      </div>
    );
  }

  if (chosen.length === 0) {
    return (
      <div className="toped-container py-16">
        <div className="mx-auto max-w-md rounded-xl bg-white p-10 text-center shadow-[var(--shadow-card)]">
          <h1 className="text-[18px]">Tidak ada barang untuk dibayar</h1>
          <p className="mt-2 text-[13px] text-ink-muted">
            Pilih dulu barangnya di keranjang, baru lanjut ke pembayaran.
          </p>
          <Button className="mt-6" render={<Link href="/cart" />}>
            Ke Keranjang
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="toped-container py-4">
      <h1 className="mb-4 text-[24px]">Pengiriman</h1>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          <section className="rounded-xl bg-white p-5 shadow-[var(--shadow-card)]">
            <h2 className="flex items-center gap-2 text-[16px]">
              <MapPin aria-hidden className="size-4 text-brand" />
              Alamat Pengiriman
            </h2>
            <p className="mt-3 text-[14px] font-bold">
              {user?.username ?? "—"}
              {user?.phone && (
                <span className="ml-2 font-normal text-ink-muted">{user.phone}</span>
              )}
            </p>
            <p className="mt-1 text-[13px] text-ink-muted">
              {user?.address ?? "Alamat belum diisi — lengkapi di halaman profil."}
            </p>
            <Button
              variant="link"
              size="xs"
              className="mt-2 px-0"
              render={<Link href="/profile" />}
            >
              Ubah alamat
            </Button>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-[16px]">Barang yang Dibeli</h2>
            <ul className="mt-4 divide-y divide-line">
              {chosen.map((item) => (
                <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.product.image_url ?? `/api/thumb/${item.product_id}`}
                    alt=""
                    width={56}
                    height={56}
                    className="size-14 shrink-0 rounded-lg border border-line object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-[13px]">{item.product.name}</p>
                    <p className="mt-0.5 text-[12px] text-ink-muted">
                      {item.quantity} × {formatIDR(Number(item.product.price))}
                    </p>
                  </div>
                  <p className="text-[14px] font-extrabold">
                    {formatIDR(Number(item.product.price) * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-brand-soft px-3 py-2.5 text-[12px]">
              <Truck aria-hidden className="size-4 shrink-0 text-brand" />
              <span>
                <b>Reguler</b> — estimasi tiba 2–4 hari ·{" "}
                {formatIDR(SHIPPING_FEE)}
              </span>
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-[16px]">Metode Pembayaran</h2>
            <RadioGroup
              value={method}
              onValueChange={(v) => setMethod(String(v))}
              className="mt-4 space-y-2"
            >
              {PAYMENT_METHODS.map((pm) => {
                const active = method === pm.id;
                const isWallet = pm.id === "TOKOKUPAY";
                return (
                  <Label
                    key={pm.id}
                    htmlFor={pm.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-[border-color,background-color] duration-200",
                      active
                        ? "border-brand bg-brand-soft/60"
                        : "border-line hover:border-ink-muted/40"
                    )}
                  >
                    <RadioGroupItem value={pm.id} id={pm.id} className="mt-0.5" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-[14px] font-bold">
                        {isWallet && (
                          <Wallet aria-hidden className="size-4 text-brand" />
                        )}
                        {pm.label}
                      </span>
                      <span className="mt-0.5 block text-[12px] font-normal text-ink-muted">
                        {isWallet && user
                          ? `Saldo ${formatIDR(balance)} · ${pm.hint}`
                          : pm.hint}
                      </span>
                      {isWallet && active && walletShort && (
                        <span className="mt-1.5 block text-[12px] font-bold text-sale">
                          Saldo kurang {formatIDR(total - balance)}. Pilih metode
                          lain dulu.
                        </span>
                      )}
                    </span>
                  </Label>
                );
              })}
            </RadioGroup>
          </section>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-[var(--shadow-card)] lg:sticky lg:top-40">
          <h2 className="text-[16px]">Ringkasan Transaksi</h2>

          <dl className="mt-4 space-y-2 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">
                Total Harga ({chosen.length} barang)
              </dt>
              <dd className="font-bold">{formatIDR(itemsTotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Ongkos Kirim</dt>
              <dd className="font-bold">{formatIDR(SHIPPING_FEE)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Biaya Layanan</dt>
              <dd className="font-bold">{formatIDR(SERVICE_FEE)}</dd>
            </div>
          </dl>

          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-[14px] font-bold">Total Tagihan</span>
            <span data-testid="checkout-total" className="text-[18px] font-extrabold">
              {formatIDR(total)}
            </span>
          </div>

          <Button
            className="mt-4 w-full"
            size="lg"
            disabled={submitting || walletShort}
            data-testid="pay-button"
            onClick={() => void submit()}
          >
            {submitting ? "Memproses…" : "Bayar Sekarang"}
          </Button>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-muted">
            Ini situs demo. Tidak ada uang sungguhan yang berpindah.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="toped-container grid gap-4 py-4 lg:grid-cols-[1fr_340px]">
          <div className="toped-shimmer h-96 rounded-xl" />
          <div className="toped-shimmer h-72 rounded-xl" />
        </div>
      }
    >
      <CheckoutView />
    </Suspense>
  );
}
