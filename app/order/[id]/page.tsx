import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Receipt } from "lucide-react";

import { PayNowButton } from "@/components/order/PayNowButton";
import { StatusBadge } from "@/components/order/StatusBadge";
import { Button } from "@/components/ui/button";
import { PAYMENT_METHODS, SERVICE_FEE, SHIPPING_FEE } from "@/lib/constants";
import { sql } from "@/lib/db";
import { formatDate, formatIDR } from "@/lib/format";
import { currentUserId } from "@/lib/session";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Detail Pesanan" };

function methodLabel(id: string): string {
  return PAYMENT_METHODS.find((m) => m.id === id)?.label ?? "Belum dipilih";
}

export default async function OrderPage({ params }: PageProps<"/order/[id]">) {
  const { id } = await params;
  const orderId = Number(id);

  const userId = await currentUserId();
  if (!userId) redirect(`/login?callbackUrl=/order/${id}`);
  if (!Number.isInteger(orderId) || orderId <= 0) notFound();

  const rows = (await sql`
    SELECT o.*,
           COALESCE(
             (SELECT jsonb_agg(to_jsonb(oi.*) ORDER BY oi.id)
                FROM order_items oi WHERE oi.order_id = o.id),
             '[]'::jsonb
           ) AS items
      FROM orders o
     WHERE o.id = ${orderId} AND o.user_id = ${userId}
  `) as Order[];

  if (rows.length === 0) notFound();

  const order = rows[0];
  const itemsTotal = Number(order.total) - SERVICE_FEE - SHIPPING_FEE;

  return (
    <div className="toped-container py-4">
      {order.status === "paid" && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-brand-soft p-4">
          <CheckCircle2 aria-hidden className="size-6 shrink-0 text-brand" />
          <div>
            <p className="text-[15px] font-extrabold text-brand">
              Pembayaran berhasil
            </p>
            <p className="text-[13px] text-ink-muted">
              Pesananmu sedang disiapkan penjual.
            </p>
          </div>
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
        <section className="rounded-xl bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-[20px]">Pesanan #{order.id}</h1>
              <p className="mt-1 text-[12px] text-ink-muted">
                {formatDate(order.created_at)}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <ul className="mt-5 divide-y divide-line border-t border-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-3 py-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image_snapshot ?? `/api/thumb/${item.product_id}`}
                  alt=""
                  width={64}
                  height={64}
                  className="size-16 shrink-0 rounded-lg border border-line object-cover"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${item.product_id}`}
                    className="line-clamp-2 text-[14px] transition-colors duration-200 hover:text-brand"
                  >
                    {item.name_snapshot}
                  </Link>
                  <p className="mt-1 text-[12px] text-ink-muted">
                    {item.quantity} × {formatIDR(Number(item.price_at_purchase))}
                  </p>
                </div>
                <p className="text-[14px] font-extrabold">
                  {formatIDR(Number(item.price_at_purchase) * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-3 lg:sticky lg:top-40">
          <div className="rounded-xl bg-white p-5 shadow-[var(--shadow-card)]">
            <h2 className="flex items-center gap-2 text-[16px]">
              <Receipt aria-hidden className="size-4 text-brand" />
              Rincian Pembayaran
            </h2>

            <dl className="mt-4 space-y-2 text-[13px]">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Metode</dt>
                <dd className="font-bold">{methodLabel(order.payment_method)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Total Harga</dt>
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
              <span data-testid="order-total" className="text-[18px] font-extrabold">
                {formatIDR(Number(order.total))}
              </span>
            </div>

            {order.status === "pending" && (
              <div className="mt-4">
                <PayNowButton orderId={order.id} />
                <p className="mt-2 text-center text-[11px] text-ink-muted">
                  Saldo TokoKu Pay akan dipotong sebesar tagihan.
                </p>
              </div>
            )}
          </div>

          <Button
            variant="neutral"
            className="w-full"
            render={<Link href="/orders" />}
          >
            Lihat Semua Transaksi
          </Button>
        </aside>
      </div>
    </div>
  );
}
