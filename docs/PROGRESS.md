# YLIKA Ops — Progress

> Flujo: **Laura → Ventas → Itza → Nesim → (si gana) recotización → compra → remisión → cobranza**.  
> Actualizado: wizard partidas-primero + sync Drive en uploads.

---

## Expectativa final (visión completa del ERP operativo)

```
████████████░░░░░░░░  58%
```

**Qué significa “100%” para mí (expectativa final):**  
el equipo abre el día en un Inicio por rol, abre o crea expediente en minutos (partidas primero), cotiza/compara sin Excel paralelo, Itza arma propuesta, Nesim envía, y si ganan: compra → remisión → cobranza con **todo el expediente espejado en Google Drive** y alertas reales (constancias, entregas, cobranza). Sin módulos de obra/APU hasta que los necesiten.

| Criterio de “listo para operación diaria” | Meta |
|-------------------------------------------|------|
| Workflow Laura→…→cobranza usable sin workarounds | 100% |
| Drive real (no stub) + sync de docs clave | 100% |
| Dashboards por área con pendientes accionables | 100% |
| Admin usuarios/áreas por Miguel | 100% |
| Parsers PDF/Excel confiables con muestras reales | ~80% (iterativo) |
| Caja chica / rol COMPRAS dedicado / obra | Fase 2 (fuera del 100% operativo) |

---

## Progress bars por gate / sección

### Gate 0 — Fundación (auth, DB, shell, empresas, folios)
```
████████████████████  100%
```
Auth.js, Neon/Drizzle, AppShell, MONE/DAKAM/NARAMO, folios `YLK-…`, bitácora.

### Gate 1 — Comercial núcleo (expediente, partidas, cotización, comparativo)
```
██████████████████░░  90%
```
✅ Expediente + tabs · ✅ lista limpia Excel · ✅ cotizaciones P1… · ✅ comparativo · ✅ cotización final  
✅ **Wizard alta: partidas → contexto (cliente opcional)**  
⬜ Afinar match de partidas con más Excels reales

### Gate 2 — Workflow de roles (Laura → Ventas → Itza → Nesim)
```
████████████████░░░░  80%
```
✅ Estatus + pipeline · ✅ tareas / bandeja · ✅ dashboard Inicio por rol  
⬜ Alertas duras (junta, fallo, constancias ≤30d) · ⬜ handoff UI más explícito por dueño

### Gate 3 — Post-ganada (recotización → compra → remisión → cobranza)
```
███████████████░░░░░  75%
```
✅ Recotización · ✅ remisiones · ✅ cobranza/factura draft · ✅ proveedores/marcas alta  
⬜ Rol `COMPRAS` dedicado · ⬜ OC formal más rica · ⬜ % cumplimiento entregas en dashboard

### Gate 4 — Google Drive (espejo del expediente)
```
████████████░░░░░░░░  60%
```
✅ Estructura canónica · ✅ adapter + stub · ✅ carpeta al crear expediente  
✅ **Sync lista limpia + cotización proveedor → subcarpeta Drive**  
⬜ Credenciales `GOOGLE_DRIVE_*` en Vercel (bloqueador tuyo)  
⬜ Sync bases PDF / propuesta / remisión / factura · ⬜ UI “Abrir en Drive” visible en docs

### Gate 5 — Sistemas / usuarios / áreas (superusuario)
```
██████████████████░░  90%
```
✅ Propuesta áreas · ✅ CRUD usuarios/roles · ✅ home personalizado  
⬜ Temas/workflow config UI · ⬜ auditoría de cambios de rol

### Gate 6 — Documentos & parsing
```
██████████████░░░░░░  70%
```
✅ Excel lista limpia / cotización · ✅ índice documentos  
⬜ Parser PDF bases (necesita 1 PDF real) · ⬜ preview unificado

### Gate 7 — Tesorería / Bolsa / caja chica
```
████████████░░░░░░░░  55%
```
✅ Bolsa integrada · ✅ vistas tesorería  
⬜ Caja chica por expediente (patrón AZTK, fase 2)

### Gate 8 — UX / presencia (login, motion, nav)
```
██████████████████░░  88%
```
✅ Black Hole · ✅ menú usuario/logout · ✅ pings pipeline  
⬜ Pulido mobile de wizard · ⬜ empty-states por área

### Gate 9 — Proyectos / Obra (fase posterior)
```
██░░░░░░░░░░░░░░░░░░  10%
```
Solo mapa en propuesta. No priorizar hasta que entre obra real.

---

## Checklist entregables recientes

| # | Entregable | Estado |
|---|------------|--------|
| 23 | Propuesta por área (AZTK → YLIKA) | ✅ `docs/PROPUESTA-AREAS-YLIKA.md` |
| 24 | Admin usuarios + áreas | ✅ `/app/configuracion/usuarios` |
| 25 | Dashboard Inicio por roles | ✅ |
| 26 | Drive structure + adapter | ✅ stub / real con env |
| 27 | Wizard alta partidas-primero | ✅ `/app/comercial/nuevo` |
| 28 | Sync upload → Drive (lista limpia + cotiz.) | ✅ best-effort |
| 29 | Caja chica expediente | ⬜ fase 2 |
| 30 | Credenciales Drive en Vercel | ⬜ tú |
| 31 | Alertas operativas (constancias/entregas) | ⬜ |
| 32 | Rol COMPRAS separado | ⬜ confirmar |

---

## Bloqueadores / lo que necesito de ti

1. **Google Drive** en Vercel: `GOOGLE_DRIVE_CLIENT_EMAIL`, `GOOGLE_DRIVE_PRIVATE_KEY`, `GOOGLE_DRIVE_FOLDER_ID` (carpeta raíz compartida con la service account).
2. **1 base PDF real** + Excel lista limpia + 1–2 cotizaciones para afinar parsers.
3. Confirmar si quieres rol dedicado **`COMPRAS`** separado de Ventas.
