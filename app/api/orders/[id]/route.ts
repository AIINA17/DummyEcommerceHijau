import { NextRequest, NextResponse } from "next/server";

import { sql } from "@/lib/db";
import { getAuthUserId } from "@/lib/jwt";
import type { Order } from "@/lib/types";

export async function GET(
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

  // user_id ikut di WHERE: pesanan milik orang lain tidak akan cocok, jadi
  // tidak bocor lewat perbedaan 403 vs 404.
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

  if (rows.length === 0) {
    return NextResponse.json(
      { success: false, message: "Order not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: rows[0] });
}
