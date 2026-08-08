# YLIKA Ops Platform

Plataforma ERP / BOS / CRM del grupo **YLIKA** (MONE · DAKAM · NARAMO).

## Progress

```
██████████░░░░░░░░░░  ~50%  Neon/Auth listos · falta tu DATABASE_URL
```

Detalle: [`docs/PROGRESS.md`](docs/PROGRESS.md) · Setup: [`docs/SETUP-NEON.md`](docs/SETUP-NEON.md)

## Stack activo

| Pieza | Tecnología |
|-------|------------|
| App | Next.js en `web/` |
| DB | **Neon Postgres** (Drizzle ORM) |
| Auth | **Auth.js** (credenciales + JWT) |
| Archivos | Vercel Blob o `uploads/` local |
| Deploy | Vercel (+ Cloudflare Tunnel para demos) |

### Arranque local

```bash
cd web
cp .env.example .env.local
# pega DATABASE_URL de Neon + AUTH_SECRET
npm install
npm run db:push
npm run db:seed
npm run dev
# login: miguel@ylika.local / ylika-admin
```

### Link temporal con Cloudflare (sin usar tus dominios)

```bash
cloudflared tunnel --url http://localhost:3000
```

Detalle: [`docs/DEV-CLOUD.md`](docs/DEV-CLOUD.md) · Parsing: [`docs/PARSING-STRATEGY.md`](docs/PARSING-STRATEGY.md)

### Dirección visual

- Material **glass** (blur + saturación, scrims translúcidos)
- Modales emergentes dentro de la app (estilo iOS / vibrancy)
- Temas en **Configuración**: Obsidian, Frost, Aurora, Graphite
- Tipografía Sora + Manrope · acentos YLIKA (teal / naranja / amarillo)

## Planificación (intacta)

| Doc | Contenido |
|-----|-----------|
| [`docs/PLAN-YLIKA.md`](docs/PLAN-YLIKA.md) | Propuesta A · Linux |
| [`docs/PLAN-YLIKA-CLOUD.md`](docs/PLAN-YLIKA-CLOUD.md) | Propuesta B · Full cloud |
| [`docs/YLIKA-Propuesta-Visual.pdf`](docs/YLIKA-Propuesta-Visual.pdf) | Wireframes iniciales |
| [`docs/YLIKA-Propuesta-Cloud.pdf`](docs/YLIKA-Propuesta-Cloud.pdf) | Resumen cloud |

## Privacidad

Mantener el repositorio **privado**.
