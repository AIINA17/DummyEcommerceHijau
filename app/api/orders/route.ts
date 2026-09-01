import { NextRequest, NextResponse } from "next/server";

import { SERVICE_FEE, SHIPPING_FEE } from "@/lib/constants";
import { sql, transaction } from "@/lib/db";
import { getAuthUserId } from "@/lib/jwt";
import type { Order, Product } from "@/lib/types";

const SELECT_ORDERS = `
  SELECT o.*,
         COALESCE(
           (SELECT jsonb_agg(to_jsonb(oi.*) ORDER BY oi.id)
              FROM order_items oi
             WHERE oi.order_id = o.id),
           '[]'::jsonb
         ) AS items
    FROM orders o
   WHERE o.user_id = $1
   ORDER BY o.created_at DESC`;

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const rows = (await sql.query(SELECT_ORDERS, [userId])) as Order[];
  return NextResponse.json({ success: true, data: rows });
}

function toPositiveInt(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isInteger(n) && n > 0 ? n : null;
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Body JSON tidak valid" },
      { status: 400 }
    );
  }

  const { items, payment_method, clear_cart } = (body ?? {}) as {
    items?: unknown;
    payment_method?: unknown;
    clear_cart?: unknown;
  };

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { success: false, message: "Tidak ada barang yang dipesan" },
      { status: 400 }
    );
  }

  // Hanya product_id & quantity yang dipercaya dari client. Harga dan nama
  // SELALU dibaca ulang dari database di bawah, supaya request yang dimodifikasi
  // tidak bisa membeli barang dengan harga karangan sendiri.
  const requested: { product_id: number; quantity: number }[] = [];
  for (const raw of items) {
    const product_id = toPositiveInt((raw as Record<string, unknown>)?.product_id);
    const quantity = toPositiveInt((raw as Record<string, unknown>)?.quantity);
    if (!product_id || !quantity) {
      return NextResponse.json(
        { success: false, message: "Format items tidak valid" },
        { status: 400 }
      );
    }
    requested.push({ product_id, quantity });
  }

  const method =
    typeof payment_method === "string" && payment_method.trim()
      ? payment_method.toUpperCase().replace(/\s/g, "_")
      : "UNSELECTED";

  const productIds = requested.map((i) => i.product_id);
  const products = (await sql`
    SELECT id, name, price, stock, image_url
      FROM products
     WHERE id = ANY(${productIds}::int[])
  `) as Pick<Product, "id" | "name" | "price" | "stock" | "image_url">[];

  const byId = new Map(products.map((p) => [p.id, p]));

  for (const item of requested) {
    const product = byId.get(item.product_id);
    if (!product) {
      return NextResponse.json(
        { success: false, message: `Produk ${item.product_id} tidak ditemukan` },
        { status: 404 }
      );
    }
    if (product.stock < item.quantity) {
      return NextResponse.json(
        { success: false, message: `Stok "${product.name}" tidak mencukupi` },
        { status: 400 }
      );
    }
  }

  const itemsTotal = requested.reduce(
    (sum, item) => sum + Number(byId.get(item.product_id)!.price) * item.quantity,
    0
  );
  const total = itemsTotal + SERVICE_FEE + SHIPPING_FEE;
  const payNow = method === "TOKOKUPAY";

  if (payNow) {
    const [{ balance }] = (await sql`
      SELECT balance FROM users WHERE id = ${userId}
    `) as { balance: number }[];

    if (Number(balance) < total) {
      return NextResponse.json(
        { success: false, message: "Saldo TokoKu Pay tidak mencukupi" },
        { status: 400 }
      );
    }
  }

  // Semua penulisan dijalankan dalam SATU transaksi. Pengecekan di atas cuma
  // untuk pesan error yang enak dibaca — yang benar-benar menjaga dari dua
  // request bersamaan adalah CHECK constraint (stock >= 0, balance >= 0):
  // kalau stok jadi minus, statement-nya gagal dan seluruh transaksi rollback.
  const statements = [
    ...requested.map(
      (item) => sql`
        UPDATE products SET stock = stock - ${item.quantity}
         WHERE id = ${item.product_id}
      `
    ),
  ];

  if (payNow) {
    statements.push(sql`
      UPDATE users SET balance = balance - ${total} WHERE id = ${userId}
    `);
  }

  statements.push(sql`
    WITH new_order AS (
      INSERT INTO orders (user_id, payment_method, status, total)
      VALUES (${userId}, ${method}, ${payNow ? "paid" : "pending"}, ${total})
      RETURNING id
    )
    INSERT INTO order_items
      (order_id, product_id, quantity, price_at_purchase, name_snapshot, image_snapshot)
    SELECT new_order.id, x.product_id, x.quantity, x.price, x.name, x.image
      FROM new_order,
           unnest(
             ${requested.map((i) => i.product_id)}::int[],
             ${requested.map((i) => i.quantity)}::int[],
             ${requested.map((i) => Number(byId.get(i.product_id)!.price))}::bigint[],
             ${requested.map((i) => byId.get(i.product_id)!.name)}::text[],
             ${requested.map((i) => byId.get(i.product_id)!.image_url)}::text[]
           ) AS x(product_id, quantity, price, name, image)
    RETURNING order_id
  `);

  if (clear_cart) {
    statements.push(sql`
      DELETE FROM cart
       WHERE user_id = ${userId} AND product_id = ANY(${productIds}::int[])
    `);
  }

  let orderId: number;
  try {
    const results = await transaction(statements);
    const inserted = results.find(
      (r) => Array.isArray(r) && r[0] && "order_id" in r[0]
    ) as { order_id: number }[];
    orderId = inserted[0].order_id;
  } catch (error) {
    const message = String((error as Error).message);
    if (message.includes("products_stock_check")) {
      return NextResponse.json(
        { success: false, message: "Stok habis saat proses pembayaran" },
        { status: 409 }
      );
    }
    if (message.includes("users_balance_check")) {
      return NextResponse.json(
        { success: false, message: "Saldo TokoKu Pay tidak mencukupi" },
        { status: 400 }
      );
    }
    console.error("Create order error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membuat pesanan" },
      { status: 500 }
    );
  }

  const [order] = (await sql.query(
    `SELECT o.*,
            COALESCE(
              (SELECT jsonb_agg(to_jsonb(oi.*) ORDER BY oi.id)
                 FROM order_items oi WHERE oi.order_id = o.id),
              '[]'::jsonb
            ) AS items
       FROM orders o WHERE o.id = $1`,
    [orderId]
  )) as Order[];

  return NextResponse.json({ success: true, data: order });
}
