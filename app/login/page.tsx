"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setPending(false);

    if (res?.error) {
      setError("Username atau password salah");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
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
          name="username"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Masukkan username"
          className="h-11"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password"
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

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Memproses…" : "Masuk"}
      </Button>

      <p className="rounded-lg bg-ground px-3 py-2.5 text-center text-[12px] text-ink-muted">
        Akun demo — username <b className="text-ink">demo</b>, password{" "}
        <b className="text-ink">demo123</b>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Masuk"
      subtitle="Belum punya akun? Daftarnya cuma butuh 10 detik."
      footer={
        <>
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="font-bold text-brand transition-colors duration-200 hover:text-brand-hover"
          >
            Daftar
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="toped-shimmer h-64 rounded-lg" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
