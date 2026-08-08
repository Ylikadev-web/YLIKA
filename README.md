# YLIKA — Plataforma ERP / BOS / CRM

Repositorio del grupo **YLIKA** (MONE · DAKAM · NARAMO).

## Estado actual

Este repo está en **fase de planificación**. Aún no hay código de aplicación.

## Dos propuestas de infraestructura (conviven)

| | Propuesta A | Propuesta B |
|---|-------------|-------------|
| Enfoque | Servidor Linux + Cloudflare Tunnel | **Full cloud** |
| Stack | GitHub · Postgres propio · Docker · CF | **GitHub · Supabase · Vercel** (+ CF DNS) |
| Doc | [`docs/PLAN-YLIKA.md`](docs/PLAN-YLIKA.md) | [`docs/PLAN-YLIKA-CLOUD.md`](docs/PLAN-YLIKA-CLOUD.md) |
| PDF | [`docs/YLIKA-Propuesta-Visual.pdf`](docs/YLIKA-Propuesta-Visual.pdf) | [`docs/YLIKA-Propuesta-Cloud.pdf`](docs/YLIKA-Propuesta-Cloud.pdf) |

El **modelo de entidades, menú y UI** son compartidos (definidos en A; B solo cambia el hosting).

## Documentos

| Archivo | Descripción |
|---------|-------------|
| [`docs/PLAN-YLIKA.md`](docs/PLAN-YLIKA.md) | Propuesta A: Linux, ER, menú, tipos, fases |
| [`docs/PLAN-YLIKA-CLOUD.md`](docs/PLAN-YLIKA-CLOUD.md) | Propuesta B: GitHub + Supabase + Vercel |
| [`docs/YLIKA-Propuesta-Visual.pdf`](docs/YLIKA-Propuesta-Visual.pdf) | Wireframes UI (~60 KB) |
| [`docs/YLIKA-Propuesta-Cloud.pdf`](docs/YLIKA-Propuesta-Cloud.pdf) | Resumen visual cloud (~liviano) |
| [`Designer.png`](Designer.png) | Logo de marca YLIKA |

Regenerar PDFs:

```bash
pip install reportlab
python3 docs/generate_proposal_pdf.py
python3 docs/generate_cloud_pdf.py
```

## Privacidad del repo

Se recomienda mantener este repositorio en **privado** (código interno, roles, procesos comerciales).

## Próximo paso

Elegir A, B o híbrido; validar el modelo entidad-relación; después Fase 0.
