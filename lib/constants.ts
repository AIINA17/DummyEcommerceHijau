// Angka yang dipakai bersama tampilan checkout dan API order, supaya yang
// dilihat user selalu sama dengan yang benar-benar dipotong dari saldo.
export const SERVICE_FEE = 1000;
export const SHIPPING_FEE = 9000;

export const BRAND = {
  name: "TokoKu",
  wallet: "TokoKu Pay",
  tagline: "Mulai aja dulu",
} as const;

export const CATEGORIES = [
  "Gadget & Tech",
  "Home & Living",
  "Lifestyle",
  "Lain-lain",
] as const;

export const PAYMENT_METHODS = [
  {
    id: "TOKOKUPAY",
    label: "TokoKu Pay",
    hint: "Saldo langsung terpotong, pesanan otomatis dibayar",
  },
  { id: "BCA_VA", label: "BCA Virtual Account", hint: "Bayar dalam 24 jam" },
  { id: "MANDIRI_VA", label: "Mandiri Virtual Account", hint: "Bayar dalam 24 jam" },
  { id: "COD", label: "Bayar di Tempat (COD)", hint: "Bayar saat barang sampai" },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];
