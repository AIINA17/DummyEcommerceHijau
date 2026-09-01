import { NextRequest, NextResponse } from "next/server";

import { sql, transaction } from "@/lib/db";
import { getAuthUserId } from "@/lib/jwt";
import type { Order } from "@/lib/types";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId(req);
  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;
  const orderId = Number(id);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json(
      { success: false, message: "Order not found" },
      { status: 404 }
    );
  }

  const rows = (await sql`
    SELECT id, total, status, payment_method
      FROM orders
     WHERE id = ${orderId} AND user_id = ${userId}
  `) as Pick<Order, "id" | "total" | "status" | "payment_method">[];

  if (rows.length === 0) {
    return NextResponse.json(
      { success: false, message: "Order not found" },
      { status: 404 }
    );
  }

  const order = rows[0];

  if (order.status === "paid") {
    return NextResponse.json({ success: true, data: order });
  }
  if (order.status === "cancelled") {
    return NextResponse.json(
      { success: false, message: "Pesanan sudah dibatalkan" },
      { status: 400 }
    );
  }

  const total = Number(order.total);

  try {
    // "WHERE status = 'pending'" bikin ini idempoten: klik bayar dua kali
    // hanya memotong saldo sekali, karena percobaan kedua tidak update baris
    // mana pun dan seluruh transaksi ikut batal.
    const results = await transaction([
      sql`UPDATE users SET balance = balance - ${total} WHERE id = ${userId}`,
      sql`
        UPDATE orders
           SET status = 'paid', updated_at = now()
         WHERE id = ${orderId} AND user_id = ${userId} AND status = 'pending'
        RETURNING id
      `,
    ]);

    const updated = results[1] as { id: number }[];
    if (updated.length === 0) {
      return NextResponse.json(
        { success: false, message: "Pesanan sudah diproses" },
        { status: 409 }
      );
    }
  } catch (error) {
    if (String((error as Error).message).includes("users_balance_check")) {
      return NextResponse.json(
        { success: false, message: "Saldo TokoKu Pay tidak mencukupi" },
        { status: 400 }
      );
    }
    console.error("Pay order error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memproses pembayaran" },
      { status: 500 }
    );
  }

  const [paid] = (await sql`
    SELECT * FROM orders WHERE id = ${orderId}
  `) as Order[];

  return NextResponse.json({ success: true, data: paid });
}
