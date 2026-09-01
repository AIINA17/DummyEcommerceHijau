import { neon, neonConfig } from "@neondatabase/serverless";

// Neon HTTP driver: tiap query = satu request HTTPS, jadi aman dipakai di
// route handler serverless tanpa perlu mengurus connection pool.
neonConfig.fetchConnectionCache = true;

// URL palsu kalau env belum diisi supaya `next build` tetap bisa jalan —
// yang gagal nanti adalah query-nya, dengan pesan yang jelas, bukan seluruh
// proses build.
// Pakai truthiness, bukan `??`: DATABASE_URL="" di .env.local adalah string
// kosong, dan `neon("")` melempar saat modul dimuat — yang berarti seluruh
// halaman jadi 500, bukan cuma query-nya.
const connectionString =
  process.env.DATABASE_URL || "postgresql://unset:unset@unset.neon.tech/unset";

if (!process.env.DATABASE_URL) {
  console.warn(
    "[db] DATABASE_URL belum diisi. Copy .env.example jadi .env.local lalu tempel connection string Neon."
  );
}

/**
 * sql`SELECT * FROM products WHERE id = ${id}`
 *
 * Interpolasi di tagged template otomatis jadi parameter terpisah ($1, $2, …),
 * jadi nilai dari user tidak pernah menyatu ke dalam string SQL.
 */
export const sql = neon(connectionString);

/**
 * Jalankan beberapa statement dalam satu transaksi. Neon HTTP mengirimnya
 * sebagai satu batch — kalau salah satu gagal, semuanya di-rollback di server.
 * Dipakai saat membuat order: potong stok, potong saldo, dan insert order
 * harus jadi satu kesatuan.
 */
export const transaction = sql.transaction.bind(sql);
