const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** "Rp1.735.000" — tanpa spasi setelah Rp, persis seperti di Tokopedia. */
export function formatIDR(value: number | string): string {
  return rupiah.format(Number(value)).replace(/\s/g, "");
}

/** 1_250 → "1,2rb", 12_000 → "12rb" — format "terjual" di kartu produk. */
export function formatSold(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k >= 10 ? Math.floor(k) : k.toFixed(1).replace(".", ",")}rb`;
  }
  return String(n);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Harga sebelum diskon, dibulatkan ke ribuan supaya tidak terlihat palsu. */
export function originalPrice(price: number, discountPercent: number): number {
  if (!discountPercent) return price;
  return Math.round(price / (1 - discountPercent / 100) / 1000) * 1000;
}
