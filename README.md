# YLIKA Ops Platform

Plataforma ERP / BOS / CRM del grupo **YLIKA** (MONE · DAKAM · NARAMO).

## Desarrollo activo — Full Cloud

| Pieza | Ahora | Luego |
|-------|--------|--------|
| App | `web/` Next.js | Deploy Vercel |
| Datos | — | Supabase (Postgres + Auth + Storage) |
| Links temporales | **Cloudflare Tunnel** (`*.trycloudflare.com`) | Dominio propio / Vercel |
| UI | Glass iOS-like + temas | Preferencias en perfil |

### Arranque local

```bash
cd web
npm install
npm run dev
```

### Link temporal con Cloudflare (sin usar tus dominios)

```bash
# con el dev server corriendo en :3000
cloudflared tunnel --url http://localhost:3000
```

Detalle: [`docs/DEV-CLOUD.md`](docs/DEV-CLOUD.md)

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
