"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Package, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BRAND } from "@/lib/constants";
import { formatDate, formatIDR } from "@/lib/format";
import type { User } from "@/lib/types";

const FIELDS = [
  { key: "username", label: "Username", type: "text", placeholder: "Username kamu" },
  { key: "email", label: "Email", type: "email", placeholder: "nama@email.com" },
  { key: "phone", label: "No. HP", type: "tel", placeholder: "08xxxxxxxxxx" },
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const { status } = useSession();

  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=/profile");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/user")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j?.success) return;
        setUser(j.data);
        setForm({
          username: j.data.username ?? "",
          email: j.data.email ?? "",
          phone: j.data.phone ?? "",
          address: j.data.address ?? "",
        });
      })
      .catch(() => {});
  }, [status]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Gagal menyimpan profil");
        return;
      }

      setUser(json.data);
      toast.success("Profil tersimpan");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <div className="toped-container grid gap-4 py-4 lg:grid-cols-[280px_1fr]">
        <div className="toped-shimmer h-64 rounded-xl" />
        <div className="toped-shimmer h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="toped-container py-4">
      <h1 className="mb-4 text-[24px]">Profil Saya</h1>

      <div className="grid items-start gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3">
          <div className="rounded-xl bg-white p-5 text-center shadow-[var(--shadow-card)]">
            <span className="mx-auto grid size-20 place-items-center rounded-full bg-brand-soft text-[28px] font-extrabold text-brand">
              {user.username.slice(0, 1).toUpperCase()}
            </span>
            <p className="mt-3 truncate text-[16px] font-extrabold">{user.username}</p>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              Bergabung {formatDate(user.created_at).split(" pukul")[0]}
            </p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-brand to-[#04703d] p-5 text-white">
            <p className="flex items-center gap-2 text-[12px] font-bold text-white/75">
              <Wallet aria-hidden className="size-4" />
              {BRAND.wallet}
            </p>
            <p
              data-testid="wallet-balance"
              className="mt-2 text-[24px] leading-none font-extrabold"
            >
              {formatIDR(Number(user.balance))}
            </p>
            <p className="mt-2 text-[11px] text-white/70">
              Saldo demo, tidak bisa dicairkan.
            </p>
          </div>

          <Button
            variant="neutral"
            className="w-full"
            render={<Link href="/orders" />}
          >
            <Package aria-hidden className="size-4" />
            Daftar Transaksi
          </Button>
        </aside>

        <form
          onSubmit={save}
          className="rounded-xl bg-white p-5 shadow-[var(--shadow-card)]"
        >
          <h2 className="text-[16px]">Ubah Biodata</h2>
          <p className="mt-1 text-[12px] text-ink-muted">
            Alamat di sini yang dipakai saat checkout.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [field.key]: e.target.value }))
                  }
                  className="h-11"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-1.5">
            <Label htmlFor="address">Alamat Pengiriman</Label>
            <Textarea
              id="address"
              rows={3}
              placeholder="Jalan, nomor rumah, kelurahan, kota, kode pos"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-line pt-5">
            <Button
              type="button"
              variant="neutral"
              onClick={() =>
                setForm({
                  username: user.username ?? "",
                  email: user.email ?? "",
                  phone: user.phone ?? "",
                  address: user.address ?? "",
                })
              }
            >
              Batal
            </Button>
            <Button type="submit" disabled={saving} data-testid="save-profile">
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
