"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/components/cart-store";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/format";
import type { Product } from "@/lib/types";

export function BuyBox({ product }: { product: Product }) {
  const router = useRouter();
  const { status } = useSession();
  const { add } = useCart();

  const [qty, setQty] = useState(1);
  const [pending, startTransition] = useTransition();

  const price = Number(product.price);
  const soldOut = product.stock <= 0;
  const subtotal = price * qty;

  function clamp(next: number) {
    setQty(Math.min(Math.max(next, 1), Math.max(product.stock, 1)));
  }

  async function addToCart(): Promise<boolean> {
    if (status !== "authenticated") {
      toast.info("Masuk dulu untuk mulai belanja");
      router.push(`/login?callbackUrl=/product/${product.id}`);
      return false;
    }
    const ok = await add(product.id, qty);
    if (ok) toast.success(`${product.name} masuk keranjang`);
    else toast.error("Gagal menambahkan ke keranjang");
    return ok;
  }

  return (
    <div className="h-fit rounded-xl bg-white p-4 shadow-[var(--shadow-card)] lg:sticky lg:top-40">
      <h2 className="text-[16px]">Atur jumlah</h2>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-9 items-center rounded-lg border border-line">
          <button
            type="button"
            aria-label="Kurangi jumlah"
            disabled={qty <= 1}
            onClick={() => clamp(qty - 1)}
            className="grid size-9 place-items-center rounded-l-lg text-brand transition-colors duration-200 hover:bg-brand-soft disabled:text-ink-muted/40 disabled:hover:bg-transparent"
          >
            <Minus aria-hidden className="size-4" />
          </button>
          <input
            aria-label="Jumlah"
            inputMode="numeric"
            value={qty}
            onChange={(e) => clamp(Number(e.target.value.replace(/\D/g, "")) || 1)}
            className="h-full w-12 border-x border-line text-center text-[14px] font-bold outline-none"
          />
          <button
            type="button"
            aria-label="Tambah jumlah"
            disabled={qty >= product.stock}
            onClick={() => clamp(qty + 1)}
            className="grid size-9 place-items-center rounded-r-lg text-brand transition-colors duration-200 hover:bg-brand-soft disabled:text-ink-muted/40 disabled:hover:bg-transparent"
          >
            <Plus aria-hidden className="size-4" />
          </button>
        </div>

        <p className="text-[12px] text-ink-muted">
          Sisa <b className="text-ink">{product.stock}</b> buah
        </p>
      </div>

      <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
        <span className="text-[13px] text-ink-muted">Subtotal</span>
        <span
          data-testid="buybox-subtotal"
          className="text-[20px] font-extrabold"
        >
          {formatIDR(subtotal)}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <Button
          className="w-full"
          size="lg"
          disabled={soldOut || pending}
          data-testid="buy-now"
          onClick={() =>
            startTransition(async () => {
              if (await addToCart()) router.push("/cart");
            })
          }
        >
          {soldOut ? "Stok Habis" : "Beli Langsung"}
        </Button>

        <Button
          variant="outline"
          className="w-full"
          size="lg"
          disabled={soldOut || pending}
          data-testid="add-to-cart"
          onClick={() => startTransition(async () => void (await addToCart()))}
        >
          <ShoppingCart aria-hidden className="size-4" />
          Keranjang
        </Button>
      </div>
    </div>
  );
}
