"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("miguel@ylika.local");
  const [password, setPassword] = useState("ylika-admin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Credenciales incorrectas");
      return;
    }
    router.push(params.get("callbackUrl") || "/app");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen">
      <div className="app-atmosphere" aria-hidden />
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-12">
        <form
          onSubmit={onSubmit}
          className="glass relative w-full overflow-hidden rounded-[32px] p-8"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent)_22%,transparent),transparent)]" />
          <div className="relative mx-auto mb-5 h-16 w-16 overflow-hidden rounded-2xl ring-1 ring-[var(--glass-border)]">
            <Image
              src="/brand/ylika-logo.png"
              alt="YLIKA"
              fill
              className="object-cover"
              sizes="64px"
              priority
            />
          </div>
          <h1 className="display relative text-center text-2xl font-semibold">
            Entrar a YLIKA Ops
          </h1>
          <p className="relative mt-2 text-center text-sm text-[var(--text-muted)]">
            Neon + Auth.js · sin PC prendido
          </p>

          <label className="relative mt-8 block">
            <span className="text-xs text-[var(--text-muted)]">Email</span>
            <input
              className="glass-thin mt-1 h-11 w-full rounded-2xl px-3 text-sm outline-none"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="relative mt-4 block">
            <span className="text-xs text-[var(--text-muted)]">Password</span>
            <input
              className="glass-thin mt-1 h-11 w-full rounded-2xl px-3 text-sm outline-none"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error ? (
            <p className="relative mt-3 text-sm text-[var(--danger)]">{error}</p>
          ) : null}

          <Button type="submit" className="relative mt-6 w-full" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </Button>

          <p className="relative mt-4 text-center text-[11px] text-[var(--text-muted)]">
            Demo sin DB: miguel@ylika.local / ylika-admin
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
