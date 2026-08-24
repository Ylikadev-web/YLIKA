# YLIKA Ops — Progress

> Flujo: **Laura → Ventas → Itza → Nesim → (si gana) recotización → compra → remisión → cobranza**.  
> Propuesta: [`PROPUESTA-IMPLEMENTACION.md`](./PROPUESTA-IMPLEMENTACION.md) · Oleada A en curso.

---

## Expectativa final (visión operativa diaria)

```
██████████████░░░░░░  68%
```

Antes ~58%. Subió con Archivo + checklist docs + plazos + bloqueo ENVIADA + upload unificado.

| Criterio “listo para operación diaria” | Estado |
|----------------------------------------|--------|
| Workflow Laura→…→cobranza usable | ~85% |
| Drive real + sync docs clave | ~65% (código listo; **falta creds Vercel**) |
| Dashboards por área accionables | ~80% (+ alertas plazos) |
| Admin usuarios/áreas | ~90% |
| Memoria completa por solicitud | ~70% (Archivo + checklist; falta uso real + Drive ON) |
| Parsers PDF/Excel | ~70% |
| Caja chica / COMPRAS / obra | Fase 2 |

---

## Progress bars por gate

### Gate 0 — Fundación
```
████████████████████  100%
```

### Gate 1 — Comercial núcleo
```
██████████████████░░  92%
```
✅ Wizard partidas-primero · ✅ cotización/comparativo · ⬜ afinar match Excel reales

### Gate 2 — Workflow roles
```
█████████████████░░░  85%
```
✅ Pipeline · ✅ bandeja · ✅ **bloqueo ENVIADA sin cliente/contacto** · ⬜ handoff UI más rico (Oleada B)

### Gate 3 — Post-ganada
```
███████████████░░░░░  75%
```
Sin cambio esta oleada (OC formal / rol COMPRAS = B)

### Gate 4 — Google Drive
```
██████████████░░░░░░  72%
```
✅ Carpetas al crear · ✅ sync lista limpia/cotiz · ✅ **upload unificado → Drive** · ✅ UI Abrir Drive  
⬜ **Credenciales `GOOGLE_DRIVE_*` en Vercel (tú)** · ⬜ regenerar PDF cot.final → sync

### Gate 5 — Usuarios / áreas
```
██████████████████░░  90%
```

### Gate 6 — Documentos & parsing
```
████████████████░░░░  82%
```
✅ **Tab Archivo** · ✅ **checklist docs por etapa + %** · ✅ upload tipado  
⬜ Parser PDF bases · ⬜ preview unificado

### Gate 7 — Tesorería / Bolsa
```
████████████░░░░░░░░  55%
```

### Gate 8 — UX
```
██████████████████░░  88%
```

### Gate 9 — Obra
```
██░░░░░░░░░░░░░░░░░░  10%
```

---

## Oleada A — checklist de entregas

| # | Entrega | Estado |
|---|---------|--------|
| A1 | Drive real (creds) | ⬜ **bloqueador tuyo** · UI/código listos |
| A2 | Checklist docs por etapa | ✅ |
| A3 | Upload unificado + sync Drive | ✅ |
| A4 | Panel Archivo del expediente | ✅ tab `Archivo` |
| A5 | Plazos (junta/apertura/fallo/vigencia) + alertas Inicio | ✅ |
| A6 | Bloquear ENVIADA sin cliente mínimo | ✅ |

**Oleada B (aún no):** handoffs, alertas constancias endurecidas, OC formal, estados cobranza, rol COMPRAS.  
**Oleada C (aún no):** caja chica, historial cliente, reportes, parser PDF, obra.

---

## Bloqueadores / lo que necesito de ti

1. **Google Drive** en Vercel: `GOOGLE_DRIVE_CLIENT_EMAIL`, `GOOGLE_DRIVE_PRIVATE_KEY`, `GOOGLE_DRIVE_FOLDER_ID`.
2. **1 base PDF** + Excel lista limpia + cotizaciones (afinar parsers).
3. Confirmar checklist mínimo con Laura/Itza (15 min).
4. ¿Rol `COMPRAS` en Oleada B?
