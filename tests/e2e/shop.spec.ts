import { expect, test, type Page } from "@playwright/test";

const DEMO = { username: "demo", password: "demo123" };

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Username").fill(DEMO.username);
  await page.getByLabel("Password", { exact: true }).fill(DEMO.password);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page.getByRole("button", { name: "Menu akun" })).toBeVisible();
}

/**
 * Kosongkan keranjang lewat API. Data uji hidup di database sungguhan, jadi
 * tanpa ini sisa dari run sebelumnya bocor ke tes berikutnya dan bikin
 * assertion "keranjang kosong" gagal padahal aplikasinya benar.
 */
async function clearCart(page: Page) {
  const res = await page.request.get("/api/cart");
  const { data } = await res.json();
  for (const item of data ?? []) {
    await page.request.delete(`/api/cart?cart_id=${item.id}`);
  }
}

/**
 * Locator yang hanya menghitung elemen yang benar-benar terlihat.
 *
 * Saat React melakukan streaming SSR, isi Suspense sempat ada DUA KALI di DOM:
 * salinan siaran yang masih tersembunyi, dan salinan yang sudah dipasang.
 * Locator biasa ikut menghitung keduanya, jadi jumlah kartu dan daftar harga
 * bisa terbaca dobel kalau kebetulan diambil di jendela waktu itu.
 */
function visible(page: Page, testId: string) {
  return page.getByTestId(testId).filter({ visible: true });
}

/**
 * Tunggu sampai grid produk berhenti berubah, lalu kembalikan locator-nya.
 *
 * Navigasi di /search dilakukan client-side: URL berganti lebih dulu, grid
 * sempat kosong (skeleton), baru terisi. Mengecek "jumlahnya sudah berubah"
 * saja tidak cukup — nilai 0 di tengah transisi ikut lolos. Yang benar adalah
 * menunggu dua pengambilan berturut-turut memberi angka sama dan bukan nol.
 */
async function settledCards(page: Page) {
  const cards = visible(page, "product-card");
  await expect
    .poll(async () => {
      const first = await cards.count();
      if (first === 0) return 0;
      await page.waitForTimeout(150);
      return first === (await cards.count()) ? first : 0;
    })
    .toBeGreaterThan(0);
  return cards;
}

/** "Rp1.735.000" → 1735000 */
function toNumber(text: string): number {
  return Number(text.replace(/\D/g, ""));
}

test.describe("Halaman publik", () => {
  test("beranda menampilkan semua blok utama", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/TokoKu/);
    await expect(page.getByRole("region", { name: "Promo pilihan" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Kategori Populer" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Promo Guncang" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Rekomendasi Untukmu" })
    ).toBeVisible();

    await expect(visible(page, "product-card").first()).toBeVisible();
  });

  test("pencarian dari header membawa ke hasil yang cocok", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Cari produk").fill("iphone");
    await page.getByLabel("Cari produk").press("Enter");

    await expect(page).toHaveURL(/\/search\?q=iphone/);
    await expect(page.getByText(/untuk\s+“?iphone/i)).toBeVisible();

    const titles = await (await settledCards(page)).allInnerTexts();
    expect(titles.length).toBeGreaterThan(0);
    expect(titles.every((t) => /iphone/i.test(t))).toBe(true);
  });

  test("query multi-kata cocok tanpa peduli urutan", async ({ page }) => {
    // Nama produknya "Acer Nitro 5", bukan "laptop gaming" — yang mencocokkan
    // adalah kata kunci di deskripsi, dan tiap kata dicek terpisah.
    for (const q of ["laptop gaming", "gaming laptop"]) {
      await page.goto(`/search?q=${encodeURIComponent(q)}`);
      expect(await (await settledCards(page)).count()).toBeGreaterThan(0);
    }
  });

  test("filter kategori mempersempit hasil", async ({ page }) => {
    await page.goto("/search");
    const before = await (await settledCards(page)).count();

    await page.getByRole("checkbox", { name: "Home & Living" }).click();
    await expect(page).toHaveURL(/category=Home/);

    const after = await (await settledCards(page)).count();
    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThan(before);
  });

  test("urutkan harga terendah benar-benar menaik", async ({ page }) => {
    await page.goto("/search?sort=price_asc");
    await settledCards(page);

    // Baca elemen harga langsung, bukan seluruh teks kartu — teks kartu juga
    // memuat harga coret, dan urutan kemunculannya tidak dijamin.
    const prices = (await visible(page, "card-price").allInnerTexts()).map(
      toNumber
    );

    expect(prices.length).toBeGreaterThan(1);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test("dropdown urutkan menampilkan label, bukan nilai mentah", async ({
    page,
  }) => {
    await page.goto("/search");
    // toContainText, bukan toHaveText: teks trigger juga memuat glyph panah.
    const trigger = page.getByRole("combobox", { name: "Urutkan hasil" });
    await expect(trigger).toContainText("Paling Sesuai");

    await page.goto("/search?sort=price_asc");
    await expect(trigger).toContainText("Harga Terendah");
  });

  test("halaman produk memuat detail dan produk terkait", async ({ page }) => {
    await page.goto("/search");
    await visible(page, "product-card").first().click();

    await expect(page).toHaveURL(/\/product\/\d+/);
    await expect(page.getByTestId("product-price")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Detail Produk" })).toBeVisible();
    await expect(page.getByTestId("add-to-cart")).toBeVisible();
  });

  test("subtotal di buy box ikut jumlah yang dipilih", async ({ page }) => {
    await page.goto("/product/1");

    const unit = toNumber(await page.getByTestId("product-price").innerText());
    await page.getByLabel("Tambah jumlah").click();

    await expect(page.getByTestId("buybox-subtotal")).toHaveText(
      new RegExp(String(unit * 2).replace(/\B(?=(\d{3})+(?!\d))/g, "\\."))
    );
  });

  test("URL yang tidak ada menampilkan halaman 404 sendiri", async ({ page }) => {
    await page.goto("/product/999999");
    await expect(
      page.getByRole("heading", { name: /tidak ketemu/i })
    ).toBeVisible();
  });
});

test.describe("Autentikasi", () => {
  test("kredensial salah menampilkan pesan error, bukan crash", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Username").fill("demo");
    await page.getByLabel("Password", { exact: true }).fill("password-salah");
    await page.getByRole("button", { name: "Masuk" }).click();

    await expect(page.getByTestId("auth-error")).toHaveText(
      /Username atau password salah/
    );
  });

  test("halaman yang butuh login mengalihkan ke /login", async ({ page }) => {
    await page.goto("/orders");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login demo berhasil dan menampilkan menu akun", async ({ page }) => {
    await login(page);
  });
});

test.describe("Alur belanja", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await clearCart(page);
  });

  test("tambah ke keranjang, ubah jumlah, lalu hapus", async ({ page }) => {
    await page.goto("/product/3");
    await page.getByTestId("add-to-cart").click();
    await expect(page.getByText("masuk keranjang")).toBeVisible();

    await page.goto("/cart");
    const row = page.getByTestId("cart-item").first();
    await expect(row).toBeVisible();

    const totalBefore = toNumber(await page.getByTestId("cart-total").innerText());
    await row.getByRole("button", { name: "Tambah" }).click();
    await expect
      .poll(async () => toNumber(await page.getByTestId("cart-total").innerText()))
      .toBeGreaterThan(totalBefore);

    await row.getByRole("button", { name: /^Hapus/ }).click();
    await expect(page.getByText("Keranjang kamu masih kosong")).toBeVisible();
  });

  test("checkout pakai TokoKu Pay memotong saldo dan menandai lunas", async ({
    page,
  }) => {
    await page.goto("/profile");
    const balanceBefore = toNumber(
      await page.getByTestId("wallet-balance").innerText()
    );

    await page.goto("/product/27");
    await page.getByTestId("add-to-cart").click();
    await expect(page.getByText("masuk keranjang")).toBeVisible();

    await page.goto("/cart");
    await page.getByTestId("checkout-button").click();

    await expect(page).toHaveURL(/\/checkout/);
    const total = toNumber(await page.getByTestId("checkout-total").innerText());

    await page.getByTestId("pay-button").click();

    await expect(page).toHaveURL(/\/order\/\d+/);
    await expect(page.getByTestId("order-status")).toHaveText("Selesai");
    await expect(page.getByTestId("order-total")).toHaveText(
      new RegExp(String(total).replace(/\B(?=(\d{3})+(?!\d))/g, "\\."))
    );

    // Saldo berkurang persis sebesar tagihan — bukan sekadar "berubah".
    await page.goto("/profile");
    await expect
      .poll(async () => toNumber(await page.getByTestId("wallet-balance").innerText()))
      .toBe(balanceBefore - total);

    // Keranjang dikosongkan setelah checkout berhasil.
    await page.goto("/cart");
    await expect(page.getByText("Keranjang kamu masih kosong")).toBeVisible();
  });

  test("bayar pakai VA membuat pesanan pending yang bisa dilunasi", async ({
    page,
  }) => {
    await page.goto("/product/31");
    await page.getByTestId("add-to-cart").click();
    // Tanpa menunggu konfirmasi, navigasi bisa membatalkan POST /api/cart
    // dan keranjang sampai di /cart dalam keadaan kosong.
    await expect(page.getByText("masuk keranjang")).toBeVisible();

    await page.goto("/cart");
    await page.getByTestId("checkout-button").click();

    await page.getByRole("radio", { name: /BCA Virtual Account/ }).click();
    await page.getByTestId("pay-button").click();

    await expect(page).toHaveURL(/\/order\/\d+/);
    await expect(page.getByTestId("order-status")).toHaveText(
      "Menunggu Pembayaran"
    );

    await page.getByTestId("pay-now").click();
    await expect(page.getByTestId("order-status")).toHaveText("Selesai");
  });

  test("pesanan muncul di daftar transaksi", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.getByTestId("order-row").first()).toBeVisible();
  });

  test("profil bisa disimpan dan nilainya bertahan setelah reload", async ({
    page,
  }) => {
    const address = `Jl. Uji Coba No. ${Date.now() % 1000}, Jakarta Pusat`;

    await page.goto("/profile");
    await page.getByLabel("Alamat Pengiriman").fill(address);
    await page.getByTestId("save-profile").click();
    await expect(page.getByText("Profil tersimpan")).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Alamat Pengiriman")).toHaveValue(address);
  });
});

test.describe("Keamanan API", () => {
  test("endpoint privat menolak permintaan tanpa login", async ({ request }) => {
    for (const path of ["/api/cart", "/api/orders", "/api/user"]) {
      expect((await request.get(path)).status(), path).toBe(401);
    }
  });

  test("harga diambil dari server, bukan dari body permintaan", async ({
    page,
    request,
  }) => {
    await login(page);

    const real = await request.get("/api/products/1");
    const { data: product } = await real.json();

    // Klien mengirim harga karangan; server harus mengabaikannya.
    const res = await page.request.post("/api/orders", {
      data: {
        items: [{ product_id: 1, quantity: 1, price: 1 }],
        payment_method: "COD",
      },
    });

    expect(res.ok()).toBe(true);
    const { data: order } = await res.json();
    expect(Number(order.items[0].price_at_purchase)).toBe(Number(product.price));
  });

  test("pesanan milik orang lain tidak bisa dibuka", async ({ page }) => {
    await login(page);
    const res = await page.request.get("/api/orders/999999");
    expect(res.status()).toBe(404);
  });
});
