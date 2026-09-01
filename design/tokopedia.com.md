# Design Taste — tokopedia.com

Diambil langsung dari situs asli lewat Playwright (headless Chrome, viewport 1440×900,
locale id-ID) pakai extractor dari skill `/taste`. Bukan tebakan.

Sumber data mentah: `design/tokopedia.com.json`
Halaman yang diukur: `/` (home), `/search?q=laptop gaming` (listing), `/cart` (redirect ke login).

---

## Design Map

```
Page background        #FFFFFF          (69% area)
App shell background   #F2F4F7          (31% area — kanvas di belakang kartu)
Surface / card         #FFFFFF
Border                 #E6E9F0
Primary (brand green)  #00AA5B          rgb(0,170,91) — bukan #03AC0E lama
Ink primary            #080808 / rgba(0,0,0,.7)
Ink muted              #656C7B          rgb(101,108,123)
Ink faint              rgba(77,83,94,.68)

Font                   Open Sauce One   (SATU family untuk seluruh situs)
Weights dipakai        400 (362×) · 700 (41×) · 800 (25×) · 900 (1×)
Size dominan           12px (390×) · 14px (34×) · 20px · 28px
h2                     28px / 800 / lh 33px
body                   14px / lh 18px

Radius                 8px (39×) · 4px (18×) · 12px (12×) · 16px (7×)
Shadow (satu-satunya)  rgba(0,0,0,0.1) 0px 1px 6px 0px
Spacing skala          8 · 12 · 10 · 6 · 16 · 24
Container              1440px viewport → konten ~1208px
Transition             0.28s (transform, background-color, color)
```

## Taste DNA

**1. Hijau itu aksen, bukan kanvas — RESTRAINT**
- Trigger: mau kasih warna brand ke sebuah permukaan.
- Decision: jangan. `#00AA5B` cuma muncul di 4 elemen background (0.1% area) —
  tombol Daftar, banner kategori, tab aktif, link "Lihat Semua".
- Reason: Header Tokopedia itu **putih**, bukan hijau. Ini pembeda paling
  besar dari Shopee (yang header-nya oranye penuh). Marketplace = ribuan
  gambar produk warna-warni; chrome yang netral bikin produk yang bicara.
- Evidence: `pageBackground: #FFFFFF`, accentCandidates 100% grayscale kecuali
  5 hit hijau.
- Trade-off: brand jadi kurang "teriak"; identitas harus dibawa logo + tipografi.

**2. Satu shadow, satu radius — SYSTEM OVER DECORATION**
- Trigger: mau bikin kartu terlihat terangkat.
- Decision: `0 1px 6px rgba(0,0,0,.1)`, radius 8px. Titik.
- Reason: Cuma ADA 2 varian shadow di seluruh homepage, dan yang kedua beda
  1% opacity (kemungkinan tak disengaja). Kedalaman dibawa oleh **border
  `#E6E9F0` + jarak**, bukan blur.
- Evidence: `effects.shadows` cuma 2 entri; `effects.radii` didominasi 8px.
- Trade-off: hierarki kedalaman datar — tidak bisa bedakan modal vs card vs
  popover lewat elevasi saja.

**3. 12px adalah body text — DENSITY**
- Trigger: milih ukuran font untuk teks kartu produk.
- Decision: 12px, weight 400. 14px hanya untuk nav & harga.
- Reason: 390 dari 430 elemen teks berukuran 12px. Tujuannya muat 5 kartu
  produk per baris dengan nama 2 baris + harga + rating + nama toko + badge,
  tanpa scroll horizontal.
- Evidence: `sizeDistribution` — 12px 390×, 14px 34×.
- Trade-off: tidak ramah untuk mata lelah; mengandalkan kontras tinggi
  (`rgba(0,0,0,.7)` di atas putih murni) supaya tetap terbaca.

**4. Bobot 800, bukan 600 — CONFIDENT TYPE**
- Trigger: bikin heading atau harga menonjol.
- Decision: langsung lompat 400 → 700/800. Tidak ada 500, hampir tidak ada 600.
- Reason: Open Sauce One itu geometris dan bulat; di 800 dia jadi tegas tanpa
  perlu diperbesar. Ini yang bikin harga "Rp1.735.000" menang lawan gambar
  produk padahal cuma 14px.
- Evidence: `weightDistribution` — 400:362, 700:41, 800:25, 600:1.
- Trade-off: tidak ada tingkat penekanan menengah; sesuatu itu tenang atau keras.

**5. Kanvas abu, konten putih — SEPARATION BY GROUND**
- Trigger: memisahkan section di halaman panjang.
- Decision: taruh section putih di atas ground `#F2F4F7`, jangan pakai
  garis pemisah atau shadow besar.
- Reason: 31% area halaman itu `#F2F4F7` — dia bukan warna aksen, dia lantai.
  Kartu jadi terbaca sebagai objek tanpa perlu elevasi.
- Evidence: sectionGaps 199px / 88px / 16px — jarak besar dikerjakan ground,
  bukan border.
- Trade-off: halaman terasa "boxy"; butuh disiplin ritme supaya tidak monoton.

## Pola UI yang ditiru

| Elemen | Perilaku asli |
|---|---|
| Top bar | strip `#F2F4F7` 32px: promo app kiri, link korporat kanan, 12px |
| Header | **putih**, sticky, logo wordmark hijau + "Kategori" + search 8px radius + cart + divider + Masuk (outline hijau) / Daftar (solid hijau) |
| Address row | `Dikirim ke <b>Jakarta Pusat</b>` dengan ikon pin, rata kanan |
| Hero | carousel 12px radius, dot indicator, chip "Lihat Promo Lainnya" pojok kanan bawah |
| Kartu produk | rasio 1:1 gambar, badge diskon pill merah kiri-atas, judul 2 baris clamp, harga 14/800, harga coret abu, baris ⭐ rating · N terjual, nama toko + badge verified |
| Listing | sidebar filter kiri 260px (accordion Kategori / Jenis toko / Lokasi / Harga) + tab Produk·Toko underline hijau + "Urutkan" select kanan |
| Grid | 5 kolom desktop, gap 12–16px |
