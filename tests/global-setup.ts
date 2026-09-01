import { execFileSync } from "node:child_process";

/**
 * Kembalikan database ke keadaan awal sebelum suite jalan.
 *
 * Tes belanja betulan memotong stok dan saldo TokoKu Pay. Tanpa reset, run
 * kedua mulai dengan saldo yang sudah terpakai dan stok yang sudah berkurang —
 * lama-lama saldo tidak cukup dan tes pembayaran gagal, padahal aplikasinya
 * baik-baik saja. Suite harus bisa dijalankan berkali-kali dengan hasil sama.
 */
export default function globalSetup() {
  execFileSync("node", ["scripts/seed.mjs"], { stdio: "inherit" });
}
