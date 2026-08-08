# Bolsa nativa en YLIKA Ops

La funcionalidad de **Administración de Bolsa** vive ahora dentro de
`/app/tesoreria` (menú **Bolsa**), sobre el mismo Neon de YLIKA.

Repo de referencia (proyecto aparte, misma lógica de dominio):
https://github.com/Ylikadev-web/Administraci-n-de-Bolsa

## Qué está replicado

| Concepto | Implementación |
|----------|----------------|
| Bolsa propia | Alta libre + movimientos activos |
| Bolsa General | Una activa; movimientos con aprobación |
| Bolsa asignada | Solo admin (Nesim/Itza/Sistemas) asigna |
| Movimientos | ingreso / gasto / aportes · estados pendiente / activo / rechazado / anulado |
| Préstamos | naturaleza `prestamo` + plazo 7/15/30/60 |
| Saldo | Calculado desde movimientos `activo` |
| Archivar | Solo con saldo 0 |

## Roles

- `DIRECTOR`, `ADMIN_FINANZAS`, `ADMIN_SISTEMAS` → admin de bolsa (aprueban)
- Cualquier usuario autenticado → bolsas propias + ve General

## Tablas Neon

`bolsas`, `bolsa_miembros`, `bolsa_categorias`, `bolsa_movimientos`

No se embebe el otro proyecto por URL: son dos apps, misma capacidad aquí.
