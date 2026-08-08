# YLIKA Ops Platform

Plataforma ERP / BOS / CRM del grupo **YLIKA** (MONE · DAKAM · NARAMO).

## Progress

```
████████░░░░░░░░░░░░  ~40%  Fundación + workflow + UI expediente demo
```

Detalle vivo: [`docs/PROGRESS.md`](docs/PROGRESS.md)

## Desarrollo activo — Full Cloud

| Pieza | Ahora | Luego |
|-------|--------|--------|
| App | `web/` Next.js (glass UI + pipeline) | Deploy Vercel |
| Datos | Migraciones en `supabase/migrations` | Proyecto Supabase + Auth |
| Links temporales | **Cloudflare Tunnel** | Dominio propio / Vercel |
| Bolsa | Plan bridge | Embed `Administraci-n-de-Bolsa` |

### Arranque local

```bash
cd web
cp .env.example .env.local   # pegar keys Supabase cuando las tengas
npm install
npm run dev
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
