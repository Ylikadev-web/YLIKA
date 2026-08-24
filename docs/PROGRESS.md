# YLIKA Ops — Progress

> Flujo: **Laura → Ventas → Itza → Nesim → (si gana) recotización → compra → remisión → cobranza**.  
> Propuesta: [`PROPUESTA-IMPLEMENTACION.md`](./PROPUESTA-IMPLEMENTACION.md)  
> **Prioridad acordada:** estructura del sistema primero · Drive diferido (después se enciende el espejo).

---

## Expectativa final (visión operativa diaria)

```
██████████████░░░░░░  68%
```

El % no baja por diferir Drive: la app ya guarda archivos en expediente. Drive solo añade espejo humano.

| Criterio “listo para operación diaria” | Estado |
|----------------------------------------|--------|
| Workflow Laura→…→cobranza usable | ~85% → **siguiente foco Oleada B** |
| Memoria completa por solicitud (en app) | ~75% (Archivo + checklist) |
| Drive espejo | ⏸ Diferido (código stub listo) |
| Dashboards por área accionables | ~80% |
| Admin usuarios/áreas | ~90% |
| Parsers PDF/Excel | ~70% |
| Caja chica / COMPRAS / obra | Fase 2 / C |

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

### Gate 2 — Workflow roles ← **prioridad estructura**
```
█████████████████░░░  85%
```
✅ Pipeline · bandeja · bloqueo ENVIADA  
⬜ Handoff explícito · bandeja endurecida · plantillas GOB/PRIV (Oleada B)

### Gate 3 — Post-ganada ← **prioridad estructura**
```
███████████████░░░░░  75%
```
✅ Recotización / remisión / cobranza draft  
⬜ OC formal · estados cobranza reales (Oleada B)

### Gate 4 — Google Drive
```
████████████░░░░░░░░  60%  ⏸ en pausa
```
Código/UI listos; **no pedimos creds ahora**. Se retoma en C0.

### Gate 5 — Usuarios / áreas
```
██████████████████░░  90%
```

### Gate 6 — Documentos (en app)
```
████████████████░░░░  82%
```
✅ Archivo · checklist · upload tipado (sin depender de Drive)

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

## Oleadas

| Oleada | Foco | Estado |
|--------|------|--------|
| A | Memoria en expediente (Archivo, plazos, cliente mín.) | ✅ cerrada (Drive ON diferido) |
| **B** | **Estructura operativa (handoffs, OC, cobranza, alertas)** | **← siguiente** |
| C | Empresa + **Drive ON (C0)** + caja chica / reportes | Después de usar B |

### Siguiente cola (B) — sin Drive

1. B2 Handoff explícito entre roles  
2. B3 Bandeja Inicio más accionable  
3. B1 Alertas constancias / plazos endurecidas  
4. B4 Plantillas checklist GOB vs PRIV  
5. B5 OC formal post-ganada  
6. B6 Estados de cobranza  

---

## Bloqueadores / lo que necesito de ti

1. ~~Google Drive creds~~ — **no ahora** (decisión tuya).  
2. Confirmar: ¿arranquemos Oleada B en ese orden?  
3. ¿Rol `COMPRAS` en B o después?
