# Setup Neon + Auth.js + archivos (5–10 min)

El código ya está cableado. Tú solo creas la DB en la nube y pegas la URL.

## 1. Crear Postgres en Neon (gratis)

1. Entra a https://console.neon.tech y crea cuenta (GitHub login OK).
2. **New Project** → nombre `ylika-ops` → región cercana (p. ej. US East).
3. Copia la **connection string** (modo pooled / con `-pooler` si la ofrecen).

Alternativa: en Vercel → tu proyecto → **Storage / Marketplace → Neon** → Connect.

## 2. Variables en `web/.env.local`

```bash
cd web
cp .env.example .env.local
```

Edita:

```env
DATABASE_URL=postgresql://...@ep-....neon.tech/neondb?sslmode=require
AUTH_SECRET=pega-salida-de-openssl-rand-base64-32
AUTH_URL=http://localhost:3000
```

Generar secret:

```bash
openssl rand -base64 32
```

## 3. Crear tablas + usuario admin

```bash
cd web
npm run db:push
npm run db:seed
```

Seed crea empresas MONE/DAKAM/NARAMO, roles y:

- email: `miguel@ylika.local` (o `SEED_ADMIN_EMAIL`)
- password: `ylika-admin` (o `SEED_ADMIN_PASSWORD`)

## 4. Correr app

```bash
npm run dev
```

Login en http://localhost:3000/login

## 5. Archivos en la nube (opcional ahora)

- **Vercel Blob:** en Vercel → Storage → Blob → crea store → copia `BLOB_READ_WRITE_TOKEN` a `.env.local` y a Vercel env.
- Sin token: los archivos van a `web/uploads/` (solo local).

Cloudflare R2 se puede enchufar después con el mismo `storeFile()`.

## 6. Deploy Vercel

1. Importa el repo; **Root Directory** = `web`
2. Env vars: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL=https://tu-dominio.vercel.app`
3. Deploy

Tunnel temporal (PC prendido solo mientras demuestras):

```bash
cloudflared tunnel --url http://localhost:3000
```

## Demo sin Neon

Si aún no pegas `DATABASE_URL`, el login demo `miguel@ylika.local` / `ylika-admin` igual entra (modo sin DB). El pipeline UI ya funciona; persistencia real llega al conectar Neon.
