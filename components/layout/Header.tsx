"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  ChevronDown,
  LayoutGrid,
  LogOut,
  MapPin,
  Package,
  Search,
  ShoppingCart,
  User as UserIcon,
  Wallet,
} from "lucide-react";

import { useCart } from "@/components/cart-store";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BRAND, CATEGORIES } from "@/lib/constants";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";

const CORPORATE_LINKS = [
  `Tentang ${BRAND.name}`,
  "Mulai Berjualan",
  "Promo",
  `${BRAND.name} Care`,
];

function TopBar() {
  return (
    <div className="hidden h-8 items-center border-b border-line bg-ground md:flex">
      <div className="toped-container flex items-center justify-between text-[12px]">
        <p className="text-ink-muted">
          <span className="font-bold text-ink">Gratis Ongkir + Banyak Promo</span>{" "}
          belanja di aplikasi
        </p>
        <nav className="flex items-center gap-6">
          {CORPORATE_LINKS.map((label) => (
            <Link
              key={label}
              href="/"
              className="text-ink-muted transition-colors duration-200 hover:text-brand"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  // Query di URL adalah sumber kebenaran. Nilainya ditulis langsung ke DOM,
  // bukan disimpan di state: input tidak perlu di-mount ulang tiap URL berubah,
  // jadi tidak ada kedipan elemen ganda dan kursor tidak lompat saat mengetik.
  const query = params.get("q") ?? "";

  useEffect(() => {
    const input = inputRef.current;
    // Jangan timpa apa yang sedang diketik user.
    if (input && input !== document.activeElement) input.value = query;
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const next = inputRef.current?.value.trim() ?? "";
        router.push(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
      }}
      className="relative min-w-0 flex-1"
    >
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
      />
      <input
        ref={inputRef}
        name="q"
        defaultValue={query}
        placeholder={`Cari di ${BRAND.name}`}
        aria-label="Cari produk"
        className={cn(
          "h-10 w-full rounded-lg border border-line bg-white pr-3 pl-9 text-[14px]",
          "placeholder:text-ink-muted",
          "transition-[border-color,box-shadow] duration-200",
          "hover:border-ink-muted/40",
          "focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
        )}
      />
    </form>
  );
}

function CategoryMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hidden items-center gap-1 rounded-md px-1 text-[14px] font-medium text-ink transition-colors duration-200 hover:text-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none lg:flex">
        Kategori
        <ChevronDown aria-hidden className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-[12px] text-ink-muted">
          Belanja per kategori
        </DropdownMenuLabel>
        {CATEGORIES.map((c) => (
          <DropdownMenuItem
            key={c}
            render={<Link href={`/search?category=${encodeURIComponent(c)}`} />}
          >
            <LayoutGrid aria-hidden className="size-4 text-ink-muted" />
            {c}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AccountMenu() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/user")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (alive && j?.success) setBalance(Number(j.data.balance));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [session?.user?.id]);

  const username = session?.user?.name ?? "Pengguna";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-md py-1 pr-1 pl-2 text-[14px] transition-colors duration-200 hover:bg-ground focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        aria-label="Menu akun"
      >
        <span className="grid size-7 place-items-center rounded-full bg-brand-soft text-[12px] font-bold text-brand">
          {username.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden max-w-24 truncate font-medium sm:inline">
          {username}
        </span>
        <ChevronDown aria-hidden className="size-4 text-ink-muted" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-2">
          <p className="truncate text-[14px] font-bold">{username}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-muted">
            <Wallet aria-hidden className="size-3.5 text-brand" />
            {BRAND.wallet}
            <span className="ml-auto font-bold text-ink">
              {balance === null ? "—" : formatIDR(balance)}
            </span>
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/profile" />}>
          <UserIcon aria-hidden className="size-4 text-ink-muted" />
          Profil Saya
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/orders" />}>
          <Package aria-hidden className="size-4 text-ink-muted" />
          Daftar Transaksi
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut aria-hidden className="size-4" />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const { status } = useSession();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-white">
      <TopBar />

      <div className="border-b border-line">
        <div className="toped-container flex h-16 items-center gap-4">
          <Logo />
          <CategoryMenu />
          {/* useSearchParams butuh Suspense boundary; fallback-nya kotak
              berukuran sama supaya header tidak bergeser saat hydrate. */}
          <Suspense
            fallback={<div className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-white" />}
          >
            <SearchBar />
          </Suspense>

          <Link
            href="/cart"
            aria-label={`Keranjang${count ? `, ${count} barang` : " kosong"}`}
            className="relative grid size-10 shrink-0 place-items-center rounded-md text-ink transition-colors duration-200 hover:bg-ground focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <ShoppingCart aria-hidden className="size-6" strokeWidth={1.6} />
            {count > 0 && (
              <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-sale px-1 text-[10px] leading-4 font-bold text-white">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          <div className="hidden h-8 w-px bg-line sm:block" />

          {status === "authenticated" ? (
            <AccountMenu />
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-5"
                render={<Link href="/login" />}
              >
                Masuk
              </Button>
              <Button size="sm" className="h-9 px-5" render={<Link href="/register" />}>
                Daftar
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="hidden border-b border-line bg-white md:block">
        <div className="toped-container flex h-9 items-center justify-end gap-1.5 text-[12px] text-ink-muted">
          <MapPin aria-hidden className="size-3.5 text-brand" />
          Dikirim ke <span className="font-bold text-ink">Jakarta Pusat</span>
        </div>
      </div>
    </header>
  );
}
