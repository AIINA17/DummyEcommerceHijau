import "server-only";

import { sql } from "@/lib/db";
import type { Product } from "@/lib/types";

// Server Component membaca database langsung — tidak lewat /api. Route handler
// tetap ada untuk klien (fetch dari browser, JWT, dan tes Playwright).

export interface ProductFilter {
  q?: string;
  category?: string;
  min?: number;
  max?: number;
  rating?: number;
  sort?: string;
  limit?: number;
  offset?: number;
}

const SORTS: Record<string, string> = {
  price_asc: "price ASC",
  price_desc: "price DESC",
  rating_desc: "rating DESC, sold DESC",
  sold_desc: "sold DESC",
  newest: "id DESC",
};

/**
 * Setiap kata di query harus muncul di nama ATAU deskripsi, tanpa peduli
 * urutannya — "gaming laptop" dan "laptop gaming" sama-sama ketemu. Kalau
 * query dicocokkan sebagai satu frasa utuh, dua-duanya nihil.
 */
const WHERE = `
  WHERE (
          cardinality($1::text[]) = 0
          OR NOT EXISTS (
            SELECT 1
              FROM unnest($1::text[]) AS t(term)
             WHERE name || ' ' || COALESCE(description, '') || ' ' || keywords
                   NOT ILIKE '%' || term || '%'
          )
        )
    AND ($2 = '' OR category = $2)
    AND ($3::bigint IS NULL OR price >= $3)
    AND ($4::bigint IS NULL OR price <= $4)
    AND ($5::numeric IS NULL OR rating >= $5)`;

/** "  laptop   gaming " → ["laptop", "gaming"] */
export function searchTerms(q: string | undefined): string[] {
  return (q ?? "").trim().split(/\s+/).filter(Boolean);
}

function filterParams(filter: ProductFilter) {
  return [
    searchTerms(filter.q),
    filter.category ?? "",
    filter.min ?? null,
    filter.max ?? null,
    filter.rating ?? null,
  ];
}

export async function getProducts(filter: ProductFilter = {}): Promise<Product[]> {
  const orderBy = SORTS[filter.sort ?? ""] ?? "sold DESC";
  const limit = Math.min(Math.max(filter.limit ?? 60, 1), 100);

  return (await sql.query(
    `SELECT * FROM products
     ${WHERE}
     ORDER BY ${orderBy}
     LIMIT $6 OFFSET $7`,
    [...filterParams(filter), limit, filter.offset ?? 0]
  )) as Product[];
}

export async function countProducts(filter: ProductFilter = {}): Promise<number> {
  const rows = (await sql.query(
    `SELECT COUNT(*)::int AS count FROM products ${WHERE}`,
    filterParams(filter)
  )) as { count: number }[];
  return rows[0]?.count ?? 0;
}

export async function getProduct(id: number): Promise<Product | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const rows = (await sql`SELECT * FROM products WHERE id = ${id}`) as Product[];
  return rows[0] ?? null;
}

/** Produk lain dari kategori yang sama, tanpa produk yang sedang dibuka. */
export async function getRelated(product: Product, limit = 6): Promise<Product[]> {
  return (await sql`
    SELECT * FROM products
     WHERE category = ${product.category} AND id <> ${product.id}
     ORDER BY sold DESC
     LIMIT ${limit}
  `) as Product[];
}

export async function getCategoryCounts(): Promise<
  { category: string; count: number }[]
> {
  return (await sql`
    SELECT category, COUNT(*)::int AS count
      FROM products
     GROUP BY category
     ORDER BY count DESC
  `) as { category: string; count: number }[];
}
