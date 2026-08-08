# Opciones de backend (sin PC prendido)

Supabase cloud está atorado para crear proyecto. Todas estas opciones viven en la nube: **tu laptop puede apagarse**.

## Docker: ¿sí o no?

| Dónde corre Docker | ¿PC apagado OK? | Nota |
|--------------------|-----------------|------|
| Tu PC de casa | ❌ No | Si se apaga, cae la DB |
| VPS barato (Hetzner/DO ~$4–6/mes) | ✅ Sí | Tú operas backups/updates |
| No usar Docker; managed cloud | ✅ Sí | Recomendado para YLIKA ahora |

**Conclusión:** Docker solo tiene sentido en un **VPS siempre encendido**, no en tu PC. Para ir rápido con Vercel: **managed Postgres**.

---

## Opciones recomendadas

### 1) Neon + Auth.js (o Clerk) + Cloudflare R2 / Vercel Blob ★ recomendada

| Pieza | Servicio |
|-------|----------|
| Postgres | **Neon** (serverless, free tier, escala a cero) |
| Auth | **Auth.js** (gratis en tu app) o **Clerk** (más pulido, free tier) |
| Archivos | **Cloudflare R2** (ya tienes CF) o **Vercel Blob** |
| App | **Vercel** |

**Por qué:** Encaja con Vercel, no depende de Supabase, el SQL que ya escribimos se reutiliza (casi 1:1). Auth y Storage se montan aparte (como ya planeábamos roles en nuestras tablas).

- Crear DB: https://console.neon.tech  
- O desde Vercel → Storage/Marketplace → Neon

### 2) Neon desde Vercel Marketplace (todo en un click)

Igual que (1), pero la DB se crea desde el dashboard de Vercel y las env vars (`DATABASE_URL`) se inyectan solas. Ideal si ya vas a poner el repo en Vercel.

### 3) Railway o Render (Postgres managed)

Postgres “siempre prendido” con un costo bajo. Bien si prefieres instancia clásica. Auth/Storage igual aparte (Auth.js + R2).

### 4) Supabase self-host en VPS (Docker en la nube)

Recuperas Auth+Storage+Postgres “estilo Supabase”, pero **tú** mantienes el servidor. Más ops; solo si más adelante quieren el pack completo sin el cloud de Supabase.

### 5) Firebase / Appwrite

Posible, pero **cambia el modelo** (menos Postgres relacional). No recomendado: ya tenemos expediente/partidas/RLS pensado en SQL.

---

## Qué pasa con las migraciones actuales

Están en SQL Postgres (`supabase/migrations/…`).

- Con **Neon/Railway/Render**: se aplican con `psql` o Drizzle migrate (quitamos solo lo específico de `auth.users` de Supabase y lo adaptamos a Auth.js/Clerk).
- El modelo de negocio (expediente, workflow, remisiones) **no se tira**.

---

## Si Supabase “se desatranca”

A veces el free tier bloquea por: proyectos pausados, límite de orgs, verificación de email, o región. Puedes:
1. Revisar https://supabase.com/dashboard si hay proyecto pausado que liberar  
2. Probar otra org / cuenta  
3. Mientras tanto avanzar con Neon (no esperamos)

---

## Decisión sugerida para YLIKA

**Neon (Postgres) + Auth.js + R2 + Vercel.**  
PC apagado = OK. Mismo flujo Laura→Itza→Nesim. Cuando digas “vamos con Neon”, adapto Auth/RLS y dejamos de depender de crear proyecto en Supabase.
