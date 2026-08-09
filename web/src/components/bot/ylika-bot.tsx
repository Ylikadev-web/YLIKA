"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Check, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PendienteItem } from "@/lib/db/pendientes";
import {
  chatBotAction,
  completarRecordatorioAction,
  getBotInboxAction,
} from "@/app/app/bot/actions";

const TONE: Record<PendienteItem["tone"], string> = {
  amber: "bg-[color-mix(in_srgb,var(--accent-2)_35%,transparent)]",
  cyan: "bg-[color-mix(in_srgb,var(--accent)_35%,transparent)]",
  rose: "bg-[color-mix(in_srgb,var(--danger)_30%,transparent)]",
  mint: "bg-[color-mix(in_srgb,#34d399_35%,transparent)]",
};

type Tab = "pendientes" | "chat" | "recordatorios";

type Msg = { id: string; rol: string; contenido: string };
type Rem = { id: string; texto: string; cuando: Date | string };

export function YlikaBot({
  items,
  userName,
}: {
  items: PendienteItem[];
  userName?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("pendientes");
  const [pulse, setPulse] = useState(true);
  const [pending, start] = useTransition();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reminders, setReminders] = useState<Rem[]>([]);
  const [draft, setDraft] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const dueReminders = reminders.filter(
    (r) => new Date(r.cuando).getTime() <= Date.now() + 36e5,
  );
  const badge = items.length + dueReminders.length;

  useEffect(() => {
    if (badge === 0) return;
    const t = setTimeout(() => setPulse(false), 4000);
    return () => clearTimeout(t);
  }, [badge]);

  useEffect(() => {
    if (!open) return;
    start(async () => {
      const data = await getBotInboxAction();
      setMessages(
        data.messages.map((m) => ({
          id: m.id,
          rol: m.rol,
          contenido: m.contenido,
        })),
      );
      setReminders(data.reminders);
    });
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, tab]);

  function send() {
    const text = draft.trim();
    if (!text || chatBusy) return;
    setDraft("");
    setChatBusy(true);
    setMessages((m) => [
      ...m,
      { id: `local-${Date.now()}`, rol: "user", contenido: text },
    ]);
    start(async () => {
      const fd = new FormData();
      fd.set("message", text);
      const res = await chatBotAction(fd);
      if (res.ok) {
        setMessages((m) => [
          ...m,
          {
            id: `bot-${Date.now()}`,
            rol: "bot",
            contenido: res.reply.text,
          },
        ]);
        const data = await getBotInboxAction();
        setReminders(data.reminders);
      }
      setChatBusy(false);
    });
  }

  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-50 lg:bottom-6 lg:right-6">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="pointer-events-auto mb-3 flex max-h-[min(560px,70vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[28px] glass-strong shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-4 py-3">
              <div>
                <p className="text-sm font-semibold">YLIKA Bot</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {userName ? `${userName} · ` : ""}
                  personalizado a tu rol
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-[var(--text-muted)] hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)]"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-1 border-b border-[var(--glass-border)] px-2 py-1.5">
              {(
                [
                  ["pendientes", "Pendientes"],
                  ["chat", "Chat"],
                  ["recordatorios", "Avisos"],
                ] as [Tab, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-medium",
                    tab === id
                      ? "bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-[var(--text)]"
                      : "text-[var(--text-muted)]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {tab === "pendientes" && (
                <ul className="space-y-1">
                  {items.length === 0 ? (
                    <li className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">
                      Nada en tu cola de rol.
                    </li>
                  ) : (
                    items.map((item) => (
                      <li key={item.id} className="group/pend relative">
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="nav-pending relative flex items-start gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)]"
                        >
                          <span
                            aria-hidden
                            className="pending-glow-ring pointer-events-none absolute inset-0 rounded-2xl"
                          />
                          <span
                            className={cn(
                              "relative z-[1] mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                              TONE[item.tone],
                            )}
                          />
                          <span className="relative z-[1] min-w-0">
                            <span className="block truncate text-sm font-medium">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)]">
                              {item.owner}
                            </span>
                          </span>
                        </Link>
                        {item.tip && (
                          <div className="pointer-events-none absolute left-2 right-2 top-full z-40 mt-1 hidden rounded-2xl border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass)_96%,transparent)] p-2.5 shadow-xl backdrop-blur-xl group-hover/pend:block">
                            {item.tip.que && (
                              <p className="text-[11px] font-medium leading-snug">
                                {item.tip.que}
                              </p>
                            )}
                            {item.tip.donde && (
                              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                                Dónde · {item.tip.donde}
                              </p>
                            )}
                            {item.tip.conQuien && (
                              <p className="text-[10px] text-[var(--text-muted)]">
                                Con · {item.tip.conQuien}
                              </p>
                            )}
                            {item.tip.cuando && (
                              <p className="text-[10px] text-[var(--accent)]">
                                {item.tip.cuando}
                              </p>
                            )}
                          </div>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              )}

              {tab === "chat" && (
                <div className="space-y-2 px-1 py-1">
                  {messages.length === 0 ? (
                    <p className="px-2 py-4 text-xs text-[var(--text-muted)]">
                      Prueba: “recuérdame cotizar con MEXIACEROS mañana a primera
                      hora” o “dame el CV de MONE”.
                    </p>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={cn(
                          "max-w-[92%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                          m.rol === "user"
                            ? "ml-auto bg-[color-mix(in_srgb,var(--accent)_22%,transparent)]"
                            : "glass-thin",
                        )}
                      >
                        {m.contenido}
                      </div>
                    ))
                  )}
                  <div ref={endRef} />
                </div>
              )}

              {tab === "recordatorios" && (
                <ul className="space-y-1">
                  {reminders.length === 0 ? (
                    <li className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">
                      Sin recordatorios. Pídelos en Chat.
                    </li>
                  ) : (
                    reminders.map((r) => (
                      <li
                        key={r.id}
                        className="glass-thin flex items-start justify-between gap-2 rounded-2xl px-3 py-2.5"
                      >
                        <div>
                          <p className="text-sm font-medium">{r.texto}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            {new Date(r.cuando).toLocaleString("es-MX")}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="rounded-full p-1.5 text-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_15%,transparent)]"
                          onClick={() =>
                            start(async () => {
                              const fd = new FormData();
                              fd.set("id", r.id);
                              await completarRecordatorioAction(fd);
                              setReminders((list) =>
                                list.filter((x) => x.id !== r.id),
                              );
                            })
                          }
                          aria-label="Marcar hecho"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>

            {tab === "chat" ? (
              <div className="flex items-center gap-2 border-t border-[var(--glass-border)] p-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                  placeholder="Instrucción o pregunta…"
                  className="glass-thin h-10 flex-1 rounded-2xl px-3 text-sm"
                  disabled={chatBusy || pending}
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={chatBusy || pending}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-2)] text-[#111]"
                  aria-label="Enviar"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-label="Abrir bot"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-2)] text-[#111] shadow-[0_12px_40px_color-mix(in_srgb,var(--accent-2)_45%,transparent)]"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        animate={
          pulse && badge
            ? {
                boxShadow: [
                  "0 0 0 0 rgba(255,209,0,0.45)",
                  "0 0 0 16px rgba(255,209,0,0)",
                ],
              }
            : undefined
        }
        transition={{ repeat: pulse ? Infinity : 0, duration: 1.6 }}
      >
        <Bot className="h-6 w-6" />
        {badge > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-bold text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </motion.button>
    </div>
  );
}
