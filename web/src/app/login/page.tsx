"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, Suspense, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BlackHoleBackdrop } from "@/components/fx/black-hole-backdrop";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("miguel@ylika.local");
  const [password, setPassword] = useState("ylika-admin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [focusField, setFocusField] = useState<"email" | "password" | null>(
    null,
  );

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
      setShake(true);
      window.setTimeout(() => setShake(false), 500);
      return;
    }
    router.push(params.get("callbackUrl") || "/app");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BlackHoleBackdrop />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md items-center px-4 py-12">
        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            x: shake ? [0, -10, 10, -8, 8, 0] : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 28,
            x: { duration: 0.45 },
          }}
          className="glass relative w-full overflow-hidden rounded-[32px] p-8"
        >
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent)_22%,transparent),transparent)]"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            className="relative mx-auto mb-5 h-16 w-16 overflow-hidden rounded-2xl ring-1 ring-[var(--glass-border)]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.12, type: "spring", stiffness: 420 }}
          >
            <Image
              src="/brand/ylika-logo.png"
              alt="YLIKA"
              fill
              className="object-cover"
              sizes="64px"
              priority
            />
          </motion.div>

          <motion.h1
            className="display relative text-center text-2xl font-semibold"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            Entrar a YLIKA Ops
          </motion.h1>
          <motion.p
            className="relative mt-2 text-center text-sm text-[var(--text-muted)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.26 }}
          >
            Neon + Auth.js · sin PC prendido
          </motion.p>

          <label className="relative mt-8 block">
            <span className="text-xs text-[var(--text-muted)]">Email</span>
            <motion.div
              animate={{
                boxShadow:
                  focusField === "email"
                    ? "0 0 0 2px color-mix(in srgb, var(--accent) 45%, transparent)"
                    : "0 0 0 0 transparent",
              }}
              className="mt-1 rounded-2xl"
            >
              <input
                className="glass-thin h-11 w-full rounded-2xl px-3 text-sm outline-none"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusField("email")}
                onBlur={() => setFocusField(null)}
                autoComplete="username"
                required
              />
            </motion.div>
          </label>

          <label className="relative mt-4 block">
            <span className="text-xs text-[var(--text-muted)]">Password</span>
            <motion.div
              animate={{
                boxShadow:
                  focusField === "password"
                    ? "0 0 0 2px color-mix(in srgb, var(--accent) 45%, transparent)"
                    : "0 0 0 0 transparent",
              }}
              className="mt-1 rounded-2xl"
            >
              <input
                className="glass-thin h-11 w-full rounded-2xl px-3 text-sm outline-none"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusField("password")}
                onBlur={() => setFocusField(null)}
                autoComplete="current-password"
                required
              />
            </motion.div>
          </label>

          <AnimatePresence>
            {error ? (
              <motion.p
                key="err"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="relative mt-3 text-sm text-[var(--danger)]"
              >
                {error}
              </motion.p>
            ) : null}
          </AnimatePresence>

          <Button
            type="submit"
            className={cn("relative mt-6 w-full", !loading && "cta-pulse")}
            disabled={loading}
          >
            {loading ? (
              <motion.span
                className="inline-flex items-center gap-2"
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{ duration: 1.1, repeat: Infinity }}
              >
                Entrando…
              </motion.span>
            ) : (
              "Entrar"
            )}
          </Button>

          <p className="relative mt-4 text-center text-[11px] text-[var(--text-muted)]">
            Demo sin DB: miguel@ylika.local / ylika-admin
          </p>
        </motion.form>
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
