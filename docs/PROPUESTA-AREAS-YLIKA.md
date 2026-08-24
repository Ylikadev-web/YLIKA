# YLIKA Ops — Propuesta por área + Drive + usuarios

> Aprendido de ERP Grupo AZTK V3, conservando el workflow YLIKA:  
> **Laura → Ventas → Itza → Nesim → (si gana) recotización → compra → remisión → cobranza**.

---

## 1. Qué aprendimos de AZTK (y qué adaptamos)

| Patrón AZTK | Adaptación YLIKA |
|-------------|------------------|
| Mesas operativas + 3–4 KPIs | Dashboard por área con métricas y pendientes propios |
| Folios estructurados | Mantener `YLK-{EMPRESA}-{AÑO}-{SEQ}` |
| Badges de estado con color | Ya existen; reforzar por dueño de etapa |
| Catálogo clientes / proveedores | Ya; enriquecer tipo gobierno vs privado |
| Expediente con muchos submódulos | **No** copiar 16 tabs; mantener pestañas actuales + Drive |
| Bolsas de socios / caja | Ya hay Bolsa; opcional caja chica de expediente después |
| APUs / explosión insumos | Solo si entra obra; adquisiciones siguen con lista limpia |
| EscritorioDrive | **Sí**: Drive ordenado por expediente/área |
| Superusuario | **Sí**: alta de usuarios + áreas + roles |

**No copiar:** multi-entidad jurídica compleja, 16 submódulos de licitación, motor APU pesado al inicio, calificación fiscal 0–100.

---

## 2. Áreas del sistema (mapa completo)

Cada área tiene: **dueño típico**, **dashboard**, **alertas**, **pendientes**, **carpeta Drive**.

### A. Sistemas (superusuario)
- **Dueño:** Miguel (`ADMIN_SISTEMAS`)
- **Dashboard:** salud del sistema, usuarios activos, deploys, errores auth, docs por vencer globales
- **Puede:** crear usuarios, asignar áreas/roles/empresas, temas, workflow
- **Drive:** `00-Sistemas/` (credenciales de integración, plantillas)

### B. Licitaciones (Laura)
- **Rol:** `LICITACIONES`
- **Dashboard:** requisitos por revisar, docs empresa por vencer, órdenes de cotizar emitidas, “no participamos”
- **Alertas:** constancias ≤30 días, junta de aclaraciones, fecha de fallo
- **Pendientes:** REVISION_REQUISITOS, ORDEN_COTIZAR
- **Drive:** `02-Licitaciones-Laura/` (bases, aclaraciones, constancias usadas)

### C. Comercial / Ventas (Miguel, Fernando)
- **Rol:** `COMPRAS_VENTAS`
- **Dashboard:** órdenes por cotizar, cotizaciones incompletas, comparativos abiertos, entregas hoy/mañana
- **Alertas:** partida sin proveedor, cotización sin P1, entrega hoy
- **Pendientes:** ORDEN_COTIZAR → ENTREGA
- **Drive:** `03-Cotizaciones-Proveedores/`, `04-Comparativo-Final/`
- **Alta sugerida:** wizard ① partidas → ② cliente/contexto → ③ cotizar

### D. Propuestas / Admin Finanzas (Itza)
- **Rol:** `ADMIN_FINANZAS`
- **Dashboard:** cola PROPUESTA_ADMIN, cobranza abierta, facturas draft, bolsa pendiente de aprobar
- **Alertas:** propuesta >N días sin mover, factura sin timbrar
- **Drive:** `05-Propuesta-Itza/`, `08-Cobranza/`

### E. Dirección (Nesim)
- **Rol:** `DIRECTOR`
- **Dashboard:** REVISION_DIRECTOR, enviadas esta semana, ganadas/perdidas, montos
- **Alertas:** propuesta lista para firma/envío
- **Drive:** `06-Envio-Nesim/` (acuse, fallo)

### F. Compras
- **Rol:** `COMPRAS_VENTAS` (sub-vista) — futuro rol `COMPRAS` dedicado
- **Dashboard:** proveedores, OCs, recotización post-ganada, marcas
- **Drive:** `07-Compra-Remision/OC/`

### G. Entregas / Logística
- **Dashboard:** calendario, remisiones abiertas, % cumplimiento
- **Alertas:** entrega hoy / retrasada
- **Drive:** `07-Compra-Remision/Remisiones/`

### H. Clientes
- **Dashboard:** clientes gobierno vs privado, saldo/crédito (futuro), expedientes por cliente
- **Drive:** anexos por cliente (opcional)

### I. Tesorería / Bolsa
- **Dashboard:** propias / general / asignadas / aprobaciones
- **Aprendido AZTK:** caja chica con “por comprobar” — fase 2
- **Drive:** `09-Tesoreria/` (comprobantes)

### J. Documentos (transversal)
- **Dashboard:** índice de archivos por expediente, sync Drive status
- **Drive raíz:** ver §3

### K. Proyectos / Obra (fase posterior)
- **Privado → Proyectos; Gobierno obra → Obra**
- AZTK aporta estimaciones/finiquito cuando YLIKA entre a obra real

---

## 3. Google Drive — estructura canónica

```
YLIKA Ops/
  {EMPRESA}/          # MONE | DAKAM | NARAMO
    {AÑO}/
      {CODIGO}/       # YLK-MONE-2026-00003
        01-Bases/
        02-Licitaciones-Laura/
        03-Cotizaciones-Proveedores/
        04-Comparativo-Final/
        05-Propuesta-Itza/
        06-Envio-Nesim/
        07-Compra-Remision/
        08-Cobranza/
        09-Tesoreria/
```

- Al crear expediente → crea carpeta + subcarpetas; guarda `driveFolderId` en DB.
- Al subir/generar doc → copia a la subcarpeta del área + `driveFileId` en `documentos`.
- Fuente técnica sigue siendo Blob/local; Drive = archivo humano ordenado.

**Credenciales:** `GOOGLE_DRIVE_CLIENT_EMAIL`, `GOOGLE_DRIVE_PRIVATE_KEY`, `GOOGLE_DRIVE_FOLDER_ID` (raíz compartida).

---

## 4. Usuarios y dashboards personalizados

1. Superusuario crea usuario (email, nombre, password temporal).
2. Asigna **1..N áreas** (= roles actuales + flag área dashboard).
3. Asigna empresas (MONE/DAKAM/NARAMO).
4. Al entrar a Inicio: ve KPIs + pendientes **solo de sus áreas**.
5. Nav puede filtrarse por áreas asignadas (fase 2).

---

## 5. Roadmap de implementación (esta oleada)

| # | Entrega | Estado |
|---|---------|--------|
| 1 | Propuesta documentada | ✅ este doc |
| 2 | Schema áreas / drive IDs | 🚧 |
| 3 | UI Config → Usuarios (CRUD + roles) | 🚧 |
| 4 | Inicio personalizado por roles | 🚧 |
| 5 | Drive adapter + ensureExpedienteFolders | 🚧 |
| 6 | Wizard alta partidas-primero | siguiente |
| 7 | Sync upload → Drive por tipo doc | siguiente |
| 8 | Caja chica expediente (estilo AZTK) | después |
| 9 | Estimaciones obra | después |

---

## 6. Principio rector

> AZTK aporta **mesas, KPIs, Drive y rigor operativo**.  
> YLIKA conserva **el workflow humano Laura→Ventas→Itza→Nesim** y no se diluye en 20 submódulos.
