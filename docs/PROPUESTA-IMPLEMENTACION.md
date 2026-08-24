# YLIKA Ops — Propuesta de implementación (auditada)

> Para: Miguel / equipo YLIKA  
> Fecha: 2026-08-24  
> Base: estado real del código en prod (`ylika-ops.vercel.app`) + objetivo compartido con dirección  
> Relacionados: `PROGRESS.md`, `PROPUESTA-AREAS-YLIKA.md`

---

## 1. Objetivo (norte)

**Facilitar el control y la gestión, en tiempo y forma, de solicitudes de clientes privados y gubernamentales**, de modo que:

1. Cada solicitud viva en **un expediente** (código `YLK-…`).
2. **Toda la información relevante** quede guardada y recuperable (app + Drive).
3. El flujo humano **Laura → Ventas → Itza → Nesim → (si gana) recotización → compra → remisión → cobranza** sea el pasillo principal.
4. “Administrar toda la empresa” sea la visión de largo plazo; **no el criterio de la próxima oleada**.

### Qué *no* es el objetivo inmediato

- Clonar AZTK (16 submódulos, APU, catálogo jurídico pesado, obra completa).
- Un dashboard bonito sin expediente completo detrás.
- Optimizar módulos que el equipo aún no usa a diario (Obra / Proyectos).

---

## 2. Auditoría del sistema hoy

### 2.1 Lo que ya sostiene el objetivo

| Capacidad | Evidencia en producto | Juicio |
|-----------|----------------------|--------|
| Identidad de solicitud | Folio, empresas MONE/DAKAM/NARAMO, sector gob/privado | Sólido |
| Pipeline de estatus | `workflow.ts` + UI pipeline | Sólido (faltan alertas duras) |
| Partidas + cotización + comparativo | Comercial / Excel import | Sólido; match Excel afinable |
| Alta orientada a operación | Wizard partidas → contexto | Recién entregado |
| Memoria parcial | Bitácora + `documentos` + tabs expediente | Parcial: no todo se espeja aún |
| Espejo humano (Drive) | Adapter + carpetas al crear; sync lista limpia / cotiz. | **Incompleto** hasta credenciales + más tipos |
| Gobernanza | Usuarios/roles, Inicio por área | Casi listo |
| Post-ganada | Recotización, remisión, cobranza draft | Usable; OC/compras menos maduros |
| Tesorería / Bolsa | Integrado | Suficiente para fase 1 |
| Obra / Proyectos | Placeholder | Correcto dejarlo dormido |

### 2.2 Huecos vs “guardar toda la información de cada solicitud”

| Qué debería quedar guardado | Hoy | Riesgo si no se cierra |
|-----------------------------|-----|------------------------|
| Bases / PDF convocatoria | Upload/meta débil; sin parser PDF | Laura pierde el “por qué” |
| Requisitos / checklist Laura | Existe panel; alertas de vencimiento débiles | Fuera de tiempo en CompraNet |
| Lista limpia + partidas | Sí (+ sync Drive si hay creds) | Bajo |
| Cotizaciones proveedor (archivos) | Sí parse + doc; sync Drive parcial | Medio |
| Comparativo / cot. final | Generado en app; PDF/Drive flojo | Auditoría comercial |
| Propuesta Itza (econ/técnica) | Flujo existe; archivo canónico + Drive | Medio-alto |
| Acuse / envío Nesim / fallo | Estatus sí; evidencia documental floja | Disputas “¿quién envió qué?” |
| OC / compra post-ganada | Parcial | Compras en Excel paralelo |
| Remisión / entrega | Sí | Bajo-medio |
| Factura / cobranza | Draft; no ciclo completo | Cobranza a medias |
| Constancias empresa (vigencia) | Tabla `documentos_empresa`; alertas UI faltan | Licitación muerta por doc vencido |
| Notas / decisiones / handoffs | Bitácora | Falta “quién debe actuar hoy” más duro |
| Cliente completo (contacto, RFC, historial) | Catálogo básico | Medio |

### 2.3 Nota sobre AZTK (auditoría de encaje)

AZTK demuestra que el objetivo de dirección (**control empresarial + expediente + Drive**) es viable.  
Para YLIKA, copiar **patrones** (mesas, KPIs, Drive, folios) aporta; copiar **amplitud** resta foco.

**Recomendación de producto:** YLIKA gana si el expediente es más completo y más rápido que AZTK en *su* pasillo de 4–5 personas — no si tiene más menús.

### 2.4 Bloqueadores externos (no son código)

1. Credenciales Google Drive en Vercel (`GOOGLE_DRIVE_*`).
2. 1 base PDF real + Excels reales (lista limpia + cotizaciones).
3. Decisión: ¿rol `COMPRAS` separado de Ventas? (default propuesto: **sí, pero fase B**).

---

## 3. Principios de implementación (auditados)

1. **Expediente primero** — toda feature nueva debe escribir en expediente, bitácora y (cuando aplique) Drive.
2. **Un dueño por etapa** — la UI debe decir *quién actúa ahora*, no solo el estatus.
3. **Gobierno y privado comparten esqueleto** — varían requisitos/folios externos, no el modelo mental.
4. **Drive = archivo humano; DB = fuente operativa** — nunca al revés.
5. **No abrir Obra/APU** hasta que exista un proyecto real que lo pida.
6. **Cada oleada cierra un hueco de memoria o de tiempo** (no cosmético).

---

## 4. Propuesta: 3 oleadas

### Oleada A — “Expediente completo” (prioridad máxima)

**Meta:** que cualquier solicitud abierta tenga un lugar obvio donde vive *toda* su evidencia, y que el equipo deje de usar carpetas sueltas / WhatsApp como archivo.

| # | Entrega | Por qué | Criterio de aceptación |
|---|---------|---------|------------------------|
| A1 | Activar Google Drive real | Sin esto el espejo no existe | Crear expediente → carpeta real en Drive; link visible en UI |
| A2 | Checklist de documentos por etapa | Garantiza “qué falta guardar” | Por estatus: lista de docs requeridos + % completo |
| A3 | Upload unificado → tipo → subcarpeta Drive | Cierra el hueco de memoria | Bases, propuesta, fallo, OC, remisión, factura sincronizan |
| A4 | Panel “Archivo del expediente” | Una sola vista de verdad | Lista docs + estado Drive + abrir en Drive + bitácora de uploads |
| A5 | Campos clave de plazos | Tiempo y forma | Junta, apertura, fallo, vigencia oferta; alertas en Inicio |
| A6 | Cliente obligatorio antes de enviar | Datos mínimos | Bloquear `ENVIADA` si falta cliente/contacto mínimo |

**Fuera de A:** caja chica, rol COMPRAS, parser PDF inteligente, obra.

**Dependencia tuya:** A1 (creds Drive). Sin A1, A3–A4 quedan a medias (stub).

---

### Oleada B — “Tiempo y forma” (control operativo)

**Meta:** que Laura, Ventas, Itza y Nesim vean *qué se atrasa* y *qué les toca hoy*, sin buscar en la lista general.

| # | Entrega | Por qué | Criterio de aceptación |
|---|---------|---------|------------------------|
| B1 | Alertas duras de vencimiento | Constancias / fechas | Badge + bandeja: ≤30 días constancias; junta/fallo próximos |
| B2 | Handoff explícito | Menos “¿ya lo pasó?” | Acción “Enviar a {siguiente}” escribe bitácora + asigna responsable |
| B3 | Bandeja por rol endurecida | Inicio accionable | Solo pendientes de mi etapa; click abre expediente en tab correcto |
| B4 | Privado vs gobierno: plantillas de checklist | Mismo motor, distinta lista | Plantilla GOB vs PRIV al crear |
| B5 | OC post-ganada más formal | Cierra compra | Folio OC, proveedor, partidas, PDF/meta + Drive |
| B6 | Cobranza: estados reales | Cierra el ciclo | Facturada / parcial / cobrada / vencida + monto |

**Opcional B7:** rol `COMPRAS` dedicado (si confirmas).

---

### Oleada C — “Empresa” (ampliar sin romper el pasillo)

**Meta:** acercarse al “administrar la empresa” de dirección *después* de que A+B estén en uso real 2–4 semanas.

| # | Entrega | Notas |
|---|---------|-------|
| C1 | Caja chica por expediente (patrón AZTK) | Solo si Tesorería lo pide |
| C2 | Historial por cliente (todas las solicitudes) | Valor comercial / gobierno recurrente |
| C3 | Reportes semanales (ganadas, ciclo, montos) | Para Nesim / dirección |
| C4 | Parser PDF de bases (asistido) | Requiere PDFs reales; nunca bloqueante |
| C5 | Nav filtrada por áreas asignadas | Cosmético útil |
| C6 | Obra / estimaciones | Solo con proyecto real |

---

## 5. Orden recomendado de ejecución (siguiente trabajo en código)

```
A1 Drive creds (tú) ──► A2 checklist docs ──► A3 sync todos los tipos
        │                        │
        └────────► A4 archivo UI ◄┘
                         │
                    A5 plazos + A6 cliente mínimo
                         │
              B1 alertas ──► B2 handoff ──► B3 bandeja
                         │
                    B5 OC ──► B6 cobranza estados
                         │
                    C* según uso real
```

---

## 6. Definición de “listo para operación diaria” (DoD)

Se declara listo cuando, en una solicitud gobierno de punta a punta:

1. Se crea en &lt;5 min con partidas.
2. Laura marca requisitos y sube bases → quedan en expediente + Drive.
3. Ventas carga cotizaciones y genera comparativo/final sin Excel paralelo obligatorio.
4. Itza y Nesim avanzan con handoff visible; envío deja evidencia.
5. Si gana: OC → remisión → cobranza con docs en el mismo expediente.
6. Cualquier persona del equipo abre el expediente y **reconstruye la historia** sin preguntar por WhatsApp.

Hasta entonces, el % de expectativa final (~58% hoy) no debe leerse como “casi ERP grande”, sino como “pasillo usable, memoria incompleta”.

---

## 7. Qué recomiendo *no* implementar ahora

| Idea | Por qué aplazar |
|------|-----------------|
| Clonar mesas AZTK 1:1 | Diluye el pasillo YLIKA |
| Motor APU / explosión de insumos | No es el negocio diario actual |
| Multi-entidad jurídica compleja | Ya tienen 3 empresas; basta |
| Calificación fiscal 0–100 | Ruido vs tiempo/forma |
| Obra / proyectos ricos | Sin demanda operativa |
| Reescribir UI “tipo AZTK” | Cosmético; no guarda información |
| WhatsApp bot / omnichannel | Prematuro antes del expediente completo |

---

## 8. Métricas simples (para auditar progreso después)

| Métrica | Objetivo práctico |
|---------|-------------------|
| % expedientes con carpeta Drive real | → 100% nuevos |
| % expedientes con checklist ≥80% en su etapa | → ≥90% activos |
| Tiempo mediano REVISION_REQUISITOS → ENVIADA | Bajar tras B1–B3 |
| % ganadas sin huecos doc (bases+cotiz+propuesta+fallo) | → ≥95% |
| Consultas “¿dónde está el archivo de…?” | Deberían caer a casi 0 |

---

## 9. Pedidos concretos a ti (Miguel)

1. **Pegar `GOOGLE_DRIVE_*` en Vercel** y compartir la carpeta raíz con la service account.  
2. Subir **1 PDF de bases** + **1 lista limpia** + **1–2 cotizaciones** (anonimizados si hace falta).  
3. Confirmar: ¿Oleada A tal cual? ¿Rol `COMPRAS` en B o después?  
4. Validar con Laura/Itza el **checklist mínimo** de docs por etapa (15 min de reunión basta).

---

## 10. Veredicto

El sistema de tu jefe y el tuyo comparten el *qué*.  
La propuesta correcta para el tuyo es **profundizar el expediente y el tiempo/forma**, no ensanchar el menú.

**Prioridad auditada:** Oleada A (memoria completa) → Oleada B (control de plazos y handoffs) → Oleada C (empresa).  
Si solo hubiera capacidad para una cosa esta semana: **Drive real + checklist de documentos + archivo del expediente**.
