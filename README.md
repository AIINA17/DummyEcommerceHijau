# TokoKu — Dummy Marketplace (Tokopedia lookalike)

Kembaran dari `DummyEcommerce` (yang bergaya Shopee), tapi UI, warna, dan pola
interaksinya mengikuti **Tokopedia**. Fitur dan model datanya sengaja dibuat
setara supaya keduanya bisa dibandingkan berdampingan.

| | DummyEcommerce | DummyTokopedia |
|---|---|---|
| Kiblat desain | Shopee | Tokopedia |
| Warna utama | Oranye `#ee4d2d` | Hijau `#00AA5B` |
| Header | Berwarna penuh | **Putih**, aksen hijau seperlunya |
| Database | Supabase | **Neon** (driver HTTP serverless) |
| Komponen UI | CSS manual (1.500 baris) | **shadcn/ui** + Tailwind v4 |
| Font | Plus Jakarta Sans | **Open Sauce One** (font asli Tokopedia) |
| Wallet | ShopKu Pay | TokoKu Pay |
| Tes | — | **Playwright** (20 tes E2E) |

## Menjalankan

```bash
cp .env.example .env.local     # isi DATABASE_URL dari Neon + NEXTAUTH_SECRET
npm install
npm run db:setup               # bikin tabel + isi 50 produk + user demo
npm run dev                    # http://localhost:3000
```

Akun demo: **demo** / **demo123** (saldo TokoKu Pay Rp50.000.000).

### Perintah lain

```bash
npm run build       # build produksi
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # Playwright E2E (otomatis build + start di port 3100)
npm run test:report # buka laporan HTML tes terakhir
```

## Struktur

```
app/
  page.tsx              beranda — carousel, kategori, promo, rekomendasi
  search/               hasil pencarian + sidebar filter + urutkan
  product/[id]/         halaman produk + buy box + produk terkait
  cart/                 keranjang, seleksi item, stepper jumlah
  checkout/             alamat, metode bayar, ringkasan tagihan
  order/[id]/           detail pesanan + bayar pesanan pending
  orders/               riwayat transaksi
  login/ register/      autentikasi
  profile/              biodata + saldo wallet
  api/                  route handler (dipakai browser & klien JWT)
components/
  ui/                   shadcn/ui
  layout/ product/ order/ auth/ home/ shared/
lib/
  db.ts                 klien Neon (sql + transaction)
  queries.ts            akses data untuk Server Component
  auth.ts jwt.ts        NextAuth credentials + bearer token
design/
  tokopedia.com.md      design token & taste DNA hasil ukur situs asli
  tokopedia.com.json    data mentah dari extractor
  screenshots/          bukti tangkapan layar referensi
scripts/
  schema.sql seed.mjs   skema + data awal
tests/e2e/              spesifikasi Playwright
```

## Desainnya dari mana?

Bukan tebakan. Situs `tokopedia.com` dibuka dengan Playwright, lalu DOM-nya
diukur: warna, ukuran font, bobot, radius, shadow, jarak, dan lebar kontainer.
Hasilnya ada di [`design/tokopedia.com.md`](design/tokopedia.com.md) beserta
alasan di balik tiap keputusan, dan diterjemahkan jadi token CSS di
[`app/globals.css`](app/globals.css).

Beberapa temuan yang mengubah desain:

- Hijau Tokopedia sekarang **`#00AA5B`**, bukan `#03AC0E` yang banyak beredar.
- Header-nya **putih**, bukan hijau — ini pembeda terbesar dari Shopee.
- Hanya ada **satu** shadow di seluruh situs: `0 1px 6px rgba(0,0,0,.1)`.
- Body text-nya **12px**, dan bobot langsung lompat 400 → 700/800.

## Catatan teknis

**Transaksi order.** Pembuatan pesanan mengurangi stok, memotong saldo, dan
menulis order dalam satu transaksi Neon. Yang menjaga dari dua permintaan
bersamaan bukan pengecekan di aplikasi, melainkan `CHECK` constraint
(`stock >= 0`, `balance >= 0`) — kalau stok jadi minus, statement-nya gagal dan
seluruh transaksi di-rollback.

**Harga tidak dipercaya dari client.** API order hanya menerima `product_id` dan
`quantity`; harga dan nama selalu dibaca ulang dari database. Ada tes Playwright
yang khusus memverifikasi ini.

**Gambar produk.** Katalog dummy tidak punya foto asli, jadi `/api/thumb/[id]`
membangkitkan SVG dari nama produk dengan warna per kategori. Tinggal ganti
kolom `image_url` kalau nanti punya gambar sungguhan.

**Pencarian per kata.** Query dipecah jadi kata, dan setiap kata harus muncul di
nama, deskripsi, atau kolom `keywords` — jadi "laptop gaming" dan "gaming laptop"
sama-sama ketemu. Kolom `keywords` menyimpan kata yang tidak ada di nama produk
("laptop" untuk "Acer Nitro 5") dan sengaja dipisah dari `description` supaya
tidak ikut terbaca user di halaman produk.

**Tes bisa diulang.** `tests/global-setup.ts` menjalankan ulang seed sebelum
suite mulai. Tanpa itu, run kedua mewarisi saldo dan stok yang sudah terpakai run
pertama, lalu gagal karena saldo habis — bukan karena aplikasinya rusak.

Semua produk, toko, dan transaksi di sini fiktif. Ini proyek latihan, bukan
situs komersial, dan tidak berafiliasi dengan Tokopedia.
