# YLIKA — Plataforma ERP / BOS / CRM

Repositorio del grupo **YLIKA** (MONE · DAKAM · NARAMO).

## Estado actual

Este repo está en **fase de planificación**. Aún no hay código de aplicación.

## Documentos

| Archivo | Descripción |
|---------|-------------|
| [`docs/PLAN-YLIKA.md`](docs/PLAN-YLIKA.md) | Plan maestro: arquitectura, entidades, menú, tipos de solicitud, fases |
| [`docs/YLIKA-Propuesta-Visual.pdf`](docs/YLIKA-Propuesta-Visual.pdf) | Propuesta visual liviana (wireframes por módulo) |
| [`Designer.png`](Designer.png) | Logo de marca YLIKA |

Para regenerar el PDF:

```bash
pip install reportlab
python3 docs/generate_proposal_pdf.py
```

## Privacidad del repo

Se recomienda mantener este repositorio en **privado** (código interno, roles, procesos comerciales).

## Próximo paso

Validar el plan y el modelo entidad-relación; después iniciar Fase 0 (infra + auth + multi-empresa).
