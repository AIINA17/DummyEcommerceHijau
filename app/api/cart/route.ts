import { NextRequest, NextResponse } from "next/server";

import { sql } from "@/lib/db";
import { getAuthUserId } from "@/lib/jwt";
import type { CartItem } from "@/lib/types";

const unauthorized = () =>
  NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

function toPositiveInt(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isInteger(n) && n > 0 ? n : null;
}

const SELECT_CART = `
  SELECT c.id, c.user_id, c.product_id, c.quantity, c.created_at,
         to_jsonb(p.*) AS product
    FROM cart c
    JOIN products p ON p.id = c.product_id
   WHERE c.user_id = $1
   ORDER BY c.created_at DESC`;

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return unauthorized();

  const rows = (await sql.query(SELECT_CART, [userId])) as CartItem[];
  return NextResponse.json({ success: true, data: rows });
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return unauthorized();

  const body = await request.json();
  const product_id = toPositiveInt(body?.product_id);
  const quantity = toPositiveInt(body?.quantity ?? 1);

  if (!product_id || !quantity) {
    return NextResponse.json(
      { success: false, error: "product_id dan quantity tidak valid" },
      { status: 400 }
    );
  }

  const stockRows = (await sql`
    SELECT stock, name FROM products WHERE id = ${product_id}
  `) as { stock: number; name: string }[];

  if (stockRows.length === 0) {
    return NextResponse.json(
      { success: false, error: "Produk tidak ditemukan" },
      { status: 404 }
    );
  }

  // UNIQUE (user_id, product_id) bikin "tambah lagi" jadi satu statement:
  // baris yang sudah ada quantity-nya ditambah, bukan duplikat baru.
  const rows = (await sql`
    INSERT INTO cart (user_id, product_id, quantity)
    VALUES (${userId}, ${product_id}, ${quantity})
    ON CONFLICT (user_id, product_id)
      DO UPDATE SET quantity = LEAST(cart.quantity + ${quantity}, ${stockRows[0].stock})
    RETURNING id
  `) as { id: number }[];

  return NextResponse.json({
    success: true,
    data: rows[0],
    message: "Ditambahkan ke keranjang",
  });
}

export async function PUT(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return unauthorized();

  const body = await request.json();
  const cart_id = toPositiveInt(body?.cart_id);
  const quantity = Number(body?.quantity);

  if (!cart_id || !Number.isInteger(quantity)) {
    return NextResponse.json(
      { success: false, error: "cart_id dan quantity wajib diisi" },
      { status: 400 }
    );
  }

  if (quantity <= 0) {
    const deleted = (await sql`
      DELETE FROM cart WHERE id = ${cart_id} AND user_id = ${userId} RETURNING id
    `) as { id: number }[];
    if (deleted.length === 0) {
      return NextResponse.json(
        { success: false, error: "Item tidak ditemukan" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Item dihapus" });
  }

  // Klausa user_id di WHERE sekaligus jadi cek kepemilikan — item milik orang
  // lain tidak akan cocok, jadi tidak perlu query terpisah.
  const rows = (await sql`
    UPDATE cart c
       SET quantity = LEAST(${quantity}, p.stock)
      FROM products p
     WHERE c.product_id = p.id
       AND c.id = ${cart_id}
       AND c.user_id = ${userId}
    RETURNING c.id, c.quantity
  `) as { id: number; quantity: number }[];

  if (rows.length === 0) {
    return NextResponse.json(
      { success: false, error: "Item tidak ditemukan" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: rows[0] });
}

export async function DELETE(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return unauthorized();

  const cartId = toPositiveInt(request.nextUrl.searchParams.get("cart_id"));
  if (!cartId) {
    return NextResponse.json(
      { success: false, error: "cart_id wajib diisi" },
      { status: 400 }
    );
  }

  const rows = (await sql`
    DELETE FROM cart WHERE id = ${cartId} AND user_id = ${userId} RETURNING id
  `) as { id: number }[];

  if (rows.length === 0) {
    return NextResponse.json(
      { success: false, error: "Item tidak ditemukan" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, message: "Item dihapus" });
}
