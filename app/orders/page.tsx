import Link from "next/link";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";

import { StatusBadge } from "@/components/order/StatusBadge";
import { Button } from "@/components/ui/button";
import { sql } from "@/lib/db";
import { formatDate, formatIDR } from "@/lib/format";
import { currentUserId } from "@/lib/session";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Daftar Transaksi" };

export default async function OrdersPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/login?callbackUrl=/orders");

  const orders = (await sql`
    SELECT o.*,
           COALESCE(
             (SELECT jsonb_agg(to_jsonb(oi.*) ORDER BY oi.id)
                FROM order_items oi WHERE oi.order_id = o.id),
             '[]'::jsonb
           ) AS items
      FROM orders o
     WHERE o.user_id = ${userId}
     ORDER BY o.created_at DESC
  `) as Order[];

  return (
    <div className="toped-container py-4">
      <h1 className="mb-4 text-[24px]">Daftar Transaksi</h1>

      {orders.length === 0 ? (
        <div className="mx-auto max-w-md rounded-xl bg-white p-10 text-center shadow-[var(--shadow-card)]">
          <Package aria-hidden className="mx-auto size-12 text-ink-muted/50" />
          <h2 className="mt-4 text-[18px]">Belum ada transaksi</h2>
          <p className="mt-2 text-[13px] text-ink-muted">
            Semua pesananmu akan muncul di sini setelah checkout pertama.
          </p>
          <Button className="mt-6" render={<Link href="/search" />}>
            Mulai Belanja
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => {
            const preview = order.items.slice(0, 2);
            const rest = order.items.length - preview.length;

            return (
              <li
                key={order.id}
                data-testid="order-row"
                className="rounded-xl bg-white p-4 shadow-[var(--shadow-card)]"
              >
                <div className="flex flex-wrap items-center gap-3 border-b border-line pb-3">
                  <StatusBadge status={order.status} />
                  <p className="text-[12px] text-ink-muted">
                    {formatDate(order.created_at)}
                  </p>
                  <p className="text-[12px] text-ink-muted">
                    #{order.id}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-3">
                  <ul className="min-w-0 flex-1 space-y-2">
                    {preview.map((item) => (
                      <li key={item.id} className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image_snapshot ?? `/api/thumb/${item.product_id}`}
                          alt=""
                          width={48}
                          height={48}
                          className="size-12 shrink-0 rounded-lg border border-line object-cover"
                        />
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-[13px]">
                            {item.name_snapshot}
                          </p>
                          <p className="text-[12px] text-ink-muted">
                            {item.quantity} barang
                          </p>
                        </div>
                      </li>
                    ))}
                    {rest > 0 && (
                      <li className="text-[12px] text-ink-muted">
                        +{rest} produk lainnya
                      </li>
                    )}
                  </ul>

                  <div className="border-line sm:border-l sm:pl-6">
                    <p className="text-[12px] text-ink-muted">Total Belanja</p>
                    <p className="text-[16px] font-extrabold">
                      {formatIDR(Number(order.total))}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={`/order/${order.id}`} />}
                  >
                    Lihat Detail
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
