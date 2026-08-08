# Integración Administración de Bolsa

Repo existente: https://github.com/Ylikadev-web/Administraci-n-de-Bolsa

## Enfoque recomendado (fases)

### Fase A — Bridge (rápido)
- Entrada en menú **Tesorería / Config** → abre Bolsa (URL Vercel) en nueva pestaña o iframe.
- Tabla `modulos_externos` (`codigo=BOLSA`) editable por ADMIN_SISTEMAS.
- Misma gente (Itza, Nesim); auth separada al inicio si hace falta.

### Fase B — SSO ligero
- Mismo proveedor Auth (Supabase org) o magic-link bridge.
- Deep-link desde remisión/expediente → movimiento de bolsa sugerido.

### Fase C — Unificación (opcional)
- Mover schema de bolsas al mismo proyecto Supabase YLIKA como schema `bolsa`.
- Un solo login YLIKA Ops.

**No reescribimos Bolsa desde cero.** La reutilizamos; el ADMIN mueve URL/visibilidad.
