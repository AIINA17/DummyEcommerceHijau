"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const rules = [
    { label: "Minimal 3 karakter", ok: username.trim().length >= 3 },
    { label: "Password minimal 6 karakter", ok: password.length >= 6 },
    { label: "Konfirmasi password cocok", ok: !!confirm && password === confirm },
  ];
  const valid = rules.every((r) => r.ok);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!valid) return;

    setPending(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.message ?? "Pendaftaran gagal");
        return;
      }

      // Langsung login setelah daftar — tidak masuk akal menyuruh user
      // mengetik ulang kredensial yang baru saja dia buat.
      const signInRes = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        toast.success("Akun dibuat. Silakan masuk.");
        router.push("/login");
        return;
      }

      toast.success("Selamat datang di TokoKu!");
      router.push("/");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Daftar"
      subtitle="Sudah punya akun? Masuk saja, lebih cepat."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-bold text-brand transition-colors duration-200 hover:text-brand-hover"
          >
            Masuk
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <p
            role="alert"
            data-testid="auth-error"
            className="flex items-center gap-2 rounded-lg bg-sale-soft px-3 py-2.5 text-[13px] font-bold text-sale"
          >
            <AlertCircle aria-hidden className="size-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Pilih username unik"
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="h-11 pr-11"
            />
            <button
              type="button"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-md text-ink-muted transition-colors duration-200 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              {showPassword ? (
                <EyeOff aria-hidden className="size-4" />
              ) : (
                <Eye aria-hidden className="size-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Ulangi Password</Label>
          <Input
            id="confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Ketik ulang password"
            className="h-11"
          />
        </div>

        <ul className="space-y-1.5">
          {rules.map((rule) => (
            <li
              key={rule.label}
              className={cn(
                "flex items-center gap-2 text-[12px] transition-colors duration-200",
                rule.ok ? "text-brand" : "text-ink-muted"
              )}
            >
              <Check
                aria-hidden
                className={cn(
                  "size-3.5 transition-opacity duration-200",
                  rule.ok ? "opacity-100" : "opacity-35"
                )}
              />
              {rule.label}
            </li>
          ))}
        </ul>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!valid || pending}
        >
          {pending ? "Mendaftarkan…" : "Daftar"}
        </Button>
      </form>
    </AuthShell>
  );
}
