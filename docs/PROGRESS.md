# YLIKA Ops — Progress

> Actualizado con el flujo real: Laura → Ventas → Itza → Nesim → recotización → remisión → cobranza.

## Progress bar

```
███████████████░░░░░  ~70%  Vercel producción online
```

| # | Entregable | Estado |
|---|------------|--------|
| 1 | Plan A/B + PDF visual | ✅ |
| 2 | UI glass iOS + temas | ✅ |
| 3 | Schema Postgres (Drizzle) expediente/cotizaciones/remisiones/workflow | ✅ |
| 4 | Workflow editable + roles | ✅ |
| 5 | Pipeline Comercial + comparativo iluminado | ✅ **persistente Neon** |
| 6 | Parser Excel determinista | ✅ |
| 7 | **Neon + Auth.js + Blob/local storage** | ✅ conectado · schema + seed aplicados |
| 8 | Vercel deploy + Tunnel/dominio | ✅ https://ylika-ops.vercel.app |
| 9 | Módulo Laura: docs empresa + caducidad + luz verde | ✅ DB + UI (falta upload Storage) |
| 10 | Parse PDF/Word/imagen (Document AI / Textract) + confirmación humana | ⬜ |
| 11 | Generar PDF cotización final (sin mostrar %) | ⬜ |
| 12 | Remisiones + folio + handoff Itza | ⬜ |
| 13 | Embed / bridge **Administración de Bolsa** | ⬜ plan listo |
| 14 | Análisis bases licitación (cumplimos / no) | ⬜ tras explicar muestras reales |

---

## Flujo modelado (gobierno)

```
Llegada licitación
  → Laura: revisión requisitos + docs empresa (vigencia)
  → Luz verde / no participamos
  → Orden de cotizar (Laura → Compras/Ventas: Miguel, Fernando…)
  → Carga cotizaciones proveedores (auto-match partidas)
  → Comparativo iluminado → cotización final (markup interno, refs P1/P2)
  → Laura pasa a Itza (Admin/Finanzas)
  → Itza: propuesta económica + técnica
  → Nesim: envía
  → Si ganamos: RECOTIZACIÓN (mejores precios) → compra → remisión → Itza cobranza
```

Roles editables solo por `ADMIN_SISTEMAS` (Miguel en perfil Sistemas).

---

## Parsing: qué recomiendo (y qué NO)

**No** alimentar una “base de conocimiento” con ejemplos que queman tokens. Eso ya te falló.

| Formato | Motor | Efectividad |
|---------|--------|-------------|
| Excel / CSV | **Parser determinista** (`xlsx` + aliases en Postgres) | ★★★★★ |
| Word tablas | mammoth → HTML tables → mismo mapper | ★★★★ |
| PDF nativo con tablas | **Azure Document Intelligence** o AWS Textract Tables | ★★★★ |
| PDF escaneado / imagen | OCR (Document AI) → tablas → mapper | ★★★ |
| Casos raros | LLM **solo fallback** con JSON schema + cache por hash archivo | ★★ |

Regla de oro: el humano confirma matches dudosos una vez → el alias/regla se guarda en `parse_column_aliases` (barato, permanente).

---

## Bolsa

Repo: `Ylikadev-web/Administraci-n-de-Bolsa` (Next + Supabase propio).  
Integración: módulo `BOLSA` en menú Tesorería (URL/embed configurable por ADMIN). Misma org/usuarios Itza–Nesim; proyectos Supabase pueden ser separados al inicio (bridge por SSO/link) o unificarse después.

---

## Bloqueadores / lo que necesito de ti

1. **Crear proyecto Supabase** y pegar URL + publishable key en `web/.env.local` (o autenticar Supabase MCP en Cursor Desktop).
2. Cuando puedas: **1 base de licitación real** (PDF) + **1 lista limpia Excel** + **1–2 cotizaciones proveedor** (Excel preferido) para afinar el parser sin alucinaciones.
3. Confirmar emails de Laura, Fernando, Itza, Nesim (y el tuyo) para seed de usuarios.
4. URL actual de deploy de Bolsa (si ya está en Vercel) para el embed.
