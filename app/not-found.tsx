import Link from "next/link";
import { PackageX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="toped-container py-20">
      <div className="mx-auto max-w-md rounded-xl bg-white p-10 text-center shadow-[var(--shadow-card)]">
        <PackageX aria-hidden className="mx-auto size-14 text-ink-muted/50" />
        <h1 className="mt-4 text-[22px]">Halamannya tidak ketemu</h1>
        <p className="mt-2 text-[13px] text-ink-muted">
          Mungkin produknya sudah dihapus penjual, atau alamatnya salah ketik.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="neutral" render={<Link href="/search" />}>
            Cari Produk
          </Button>
          <Button render={<Link href="/" />}>Ke Beranda</Button>
        </div>
      </div>
    </div>
  );
}
