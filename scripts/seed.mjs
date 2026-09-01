// Bikin skema + isi data awal ke Neon.
//   npm run db:setup
//
// Aman dijalankan ulang: tabel pakai IF NOT EXISTS, products di-TRUNCATE
// dan diisi ulang, user demo di-upsert.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

config({ path: join(root, ".env.local") });

if (!process.env.DATABASE_URL) {
  console.error(
    "\n  DATABASE_URL kosong.\n" +
      "  Copy .env.example jadi .env.local, lalu tempel connection string Neon.\n"
  );
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

// PRNG deterministik supaya angka "terjual"/diskon selalu sama tiap seed.
function rng(seed) {
  let s = seed * 2654435761 % 2147483647;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const SHOPS = {
  "Gadget & Tech": [
    ["Sinar Elektronik", "Jakarta Pusat"],
    ["Gadget Store ID", "Jakarta Barat"],
    ["Nusantara Tech", "Surabaya"],
    ["Kirana Komputer", "Bandung"],
  ],
  Lifestyle: [
    ["Urban Wear ID", "Jakarta Selatan"],
    ["Toko Gaya Kita", "Bandung"],
    ["Beauty Corner", "Tangerang"],
  ],
  "Home & Living": [
    ["Rumah Rapi", "Bekasi"],
    ["Dapur Sejahtera", "Semarang"],
    ["Griya Perabot", "Depok"],
  ],
  "Lain-lain": [
    ["Serba Ada Jaya", "Jakarta Timur"],
    ["Warung Kita", "Yogyakarta"],
  ],
};

// Nama produk sering tidak memuat kata yang dipakai orang saat mencari:
// "Acer Nitro 5" tidak mengandung kata "laptop". Tanpa kata kunci ini,
// pencarian "laptop gaming" tidak mengembalikan apa pun padahal barangnya ada.
const KEYWORDS = [
  [/nitro|rog strix|macbook|thinkpad|ideapad/i, "laptop notebook komputer"],
  [/nitro|rog strix|ideapad gaming|playstation|nintendo|redragon/i, "gaming"],
  [/iphone|galaxy s\d/i, "handphone hp smartphone ponsel"],
  [/airpods|headphone|earbuds|jbl|sony wh/i, "audio earphone headset"],
  [/tv|qled/i, "televisi tv layar"],
  [/kamera|fujifilm|drone|dji/i, "kamera fotografi"],
  [/watch|g-shock|fossil/i, "jam tangan aksesoris"],
  [/t-shirt|jeans|hoodie|uniqlo|levi|roughneck/i, "baju pakaian fashion"],
  [/jordan|ultraboost|converse|chuck taylor/i, "sepatu sneakers fashion"],
  [/air fryer|cookware|tefal|philips|dyson|vacuum/i, "peralatan dapur rumah tangga"],
  [/meja|kursi|ikea|ergotone|lampu/i, "furniture perabot rumah"],
  [/sunscreen|serum|skintific|somethinc|wardah/i, "skincare kecantikan perawatan"],
  [/helm|kyt|oli|shell/i, "otomotif motor"],
  [/matras|yoga|hydro flask/i, "olahraga fitness"],
];

function keywordsFor(name) {
  const hits = KEYWORDS.filter(([re]) => re.test(name)).map(([, words]) => words);
  return [...new Set(hits.join(" ").split(" ").filter(Boolean))].join(" ");
}

const BLURB = {
  "Gadget & Tech":
    "Garansi resmi 1 tahun. Dikirim dengan packing kayu anti benturan. Barang 100% original, bukan refurbish.",
  Lifestyle:
    "Bahan premium, jahitan rapi, dan nyaman dipakai harian. Tersedia semua ukuran, silakan cek tabel ukuran sebelum membeli.",
  "Home & Living":
    "Material kokoh dan mudah dirawat. Sudah termasuk buku panduan pemakaian dan kartu garansi toko.",
  "Lain-lain":
    "Stok selalu ready dan dikirim di hari yang sama untuk pesanan sebelum jam 3 sore.",
};

const products = JSON.parse(readFileSync(join(root, "data/products.json"), "utf8"));

const enriched = products.map((p) => {
  const rand = rng(p.id);
  const shops = SHOPS[p.category] ?? SHOPS["Lain-lain"];
  const [shop_name, shop_city] = shops[Math.floor(rand() * shops.length)];

  // Barang mahal jarang didiskon besar dan jarang laku ribuan — bikin angkanya
  // proporsional supaya katalog terasa masuk akal, bukan random.
  const cheap = p.price < 1_000_000;
  const discount_percent =
    rand() < 0.65 ? Math.floor(rand() * (cheap ? 45 : 22)) + 5 : 0;
  const sold = Math.floor(rand() * (cheap ? 4000 : 320)) + 3;
  const stock = Math.floor(rand() * 120) + 5;

  return {
    ...p,
    description: `${p.name}. ${BLURB[p.category] ?? BLURB["Lain-lain"]}`,
    keywords: [p.category, keywordsFor(p.name)].filter(Boolean).join(" "),
    stock,
    image_url: `/api/thumb/${p.id}`,
    sold,
    discount_percent,
    shop_name,
    shop_city,
  };
});

async function main() {
  console.log("→ Bikin tabel…");
  const schema = readFileSync(join(here, "schema.sql"), "utf8");
  for (const stmt of schema.split(";").map((s) => s.trim()).filter(Boolean)) {
    await sql.query(stmt);
  }

  console.log("→ Isi products…");
  // Pesanan lama menunjuk ke products, jadi hapusnya harus lewat CASCADE.
  await sql.query("TRUNCATE products RESTART IDENTITY CASCADE");
  for (const p of enriched) {
    await sql.query(
      `INSERT INTO products
         (id, name, description, price, category, rating, stock, image_url,
          keywords, sold, discount_percent, shop_name, shop_city)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        p.id, p.name, p.description, p.price, p.category, p.rating, p.stock,
        p.image_url, p.keywords, p.sold, p.discount_percent, p.shop_name,
        p.shop_city,
      ]
    );
  }
  await sql.query(
    "SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM products))"
  );

  console.log("→ Bikin user demo…");
  const hash = await bcrypt.hash("demo123", 10);
  await sql.query(
    `INSERT INTO users (username, password, email, phone, address, balance)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (username) DO UPDATE
       SET password = EXCLUDED.password, balance = EXCLUDED.balance`,
    [
      "demo",
      hash,
      "demo@tokoku.test",
      "081234567890",
      "Jl. Merdeka No. 17, Jakarta Pusat, DKI Jakarta 10110",
      50_000_000,
    ]
  );

  const [{ count }] = await sql.query("SELECT COUNT(*)::int AS count FROM products");
  console.log(`\n  Selesai. ${count} produk siap.`);
  console.log("  Login demo → username: demo · password: demo123\n");
}

main().catch((err) => {
  console.error("\nSeed gagal:", err.message, "\n");
  process.exit(1);
});
