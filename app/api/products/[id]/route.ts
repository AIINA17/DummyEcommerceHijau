import { NextResponse } from "next/server";

import { sql } from "@/lib/db";
import type { Product } from "@/lib/types";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json(
      { success: false, message: "Product not found" },
      { status: 404 }
    );
  }

  const rows = (await sql`
    SELECT * FROM products WHERE id = ${productId}
  `) as Product[];

  if (rows.length === 0) {
    return NextResponse.json(
      { success: false, message: "Product not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: rows[0] });
}
