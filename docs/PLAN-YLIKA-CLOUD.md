# YLIKA Platform — Propuesta B: Full Cloud

> Alternativa a la propuesta on-prem / servidor Linux (`PLAN-YLIKA.md`).  
> **No reemplaza** la propuesta anterior; conviven para decisión.  
> Stack: **GitHub · Supabase · Vercel** (+ Cloudflare DNS que ya tienes).  
> Versión: 1.0 · Agosto 2026 · Sin código de aplicación.

---

## 1. Opinión directa

**Para arrancar con Cursor y un equipo pequeño, full cloud es la opción más práctica.**

| Criterio | Propuesta A (Linux + Tunnel) | Propuesta B (Full Cloud) |
|----------|------------------------------|---------------------------|
| Velocidad para desarrollar | Media (hay que montar servidor) | **Alta** (cuentas + `git push`) |
| Mantenimiento | Tú: updates, backups, disco, Docker | Proveedores (menos ops) |
| Costo fijo inicial | Hardware o VPS | Casi $0 al inicio (free tiers) |
| Costo a escala | Predecible (luz/VPS) | Crece con uso (DB, bandwidth, seats) |
| Control de datos | Máximo (disco propio) | En Supabase/Vercel (región elegible) |
| Acceso oculto + roles | Cloudflare Access + app roles | Vercel + Supabase Auth/RLS (+ opcional CF Access) |
| Encaje con el modelo ER | Igual (PostgreSQL) | **Igual** (Supabase = Postgres) |
| Riesgo operativo | PC apagado / falla local | Caída o cambio de precios del vendor |

**Recomendación:** empezar por **Propuesta B** para MVP (Fases 0–2), y dejar abierta la puerta a migrar Postgres a self-host más adelante si el volumen o la política lo piden. El modelo de entidades **no cambia**.

---

## 2. Arquitectura full cloud

```
[Tu laptop / Cursor Cloud]
         │  git push
         ▼
[GitHub privado] ──CI──► [Vercel]
                           │  Next.js (App Router) + shadcn/ui
                           │  Server Actions / Route Handlers
                           ▼
                      [Supabase]
                           ├── PostgreSQL (+ RLS multi-empresa)
                           ├── Auth (email / magic link / SSO luego)
                           ├── Storage (bases, cotizaciones, PDFs)
                           └── Realtime (opcional: alertas de fechas)
                           │
[Cloudflare] DNS ──────────┘
  distribuidoramone.com.mx → CNAME a Vercel
  app.distribuidoramone.com.mx (subdominio no publicitado)
```

### Piezas

| Pieza | Servicio | Rol |
|-------|----------|-----|
| Código | **GitHub** (private) | Source of truth + PRs + Cursor |
| App | **Vercel** | Hosting Next.js, previews por PR, env vars |
| DB + Auth + Files | **Supabase** | Postgres, login, Storage, RLS |
| DNS / TLS | **Cloudflare** (ya lo tienes) | Dominio, proxy opcional, Access opcional |
| UI kit | **shadcn/ui** | Componentes; tema YLIKA propio |

No necesitas PC Linux central ni Docker en oficina para esta ruta.

---

## 3. Mapeo del stack (vs Propuesta A)

| Capa | Propuesta A | Propuesta B (esta) |
|------|-------------|---------------------|
| Frontend | Next.js en Docker | Next.js en **Vercel** |
| API | Route Handlers locales | Mismos Route Handlers / Server Actions en Vercel |
| Auth | Auth.js + CF Access | **Supabase Auth** (+ CF Access opcional delante) |
| DB | Postgres self-host | **Supabase Postgres** |
| ORM | Drizzle / Prisma | Drizzle / Prisma **o** cliente Supabase + SQL |
| Archivos | Disco / MinIO / R2 | **Supabase Storage** (o R2 si prefieres) |
| Deploy | Docker + Tunnel | `git push` → deploy Vercel |
| Secretos | `.env` en servidor | Vercel Env + Supabase Dashboard |

El **modelo entidad-relación** de `PLAN-YLIKA.md` se reutiliza 1:1 (mismas tablas: empresa, solicitud, expediente, partida, cotizacion_*, etc.).

---

## 4. Multi-empresa y seguridad en Supabase

### 4.1 Auth + roles

1. Usuario inicia sesión con Supabase Auth.  
2. Tabla `usuario_empresa` (usuario ↔ empresa ↔ rol).  
3. **RLS (Row Level Security)** en cada tabla sensible:

```text
política típica:
  el usuario solo ve filas cuya empresa_id
  esté en sus membresías activas
```

4. Roles de app (`ADMIN`, `COMERCIAL`, `COMPRAS`, …) en claims o tabla `rol` — no solo “logged in”.

### 4.2 Link oculto

| Capa | Qué hacer |
|------|-----------|
| DNS | Subdominio no enlazado en el sitio público (`app.` o `ops.`) |
| Vercel | Proyecto privado del equipo; Deployment Protection (password / Vercel Auth) en preview y opcional en prod |
| Cloudflare Access | (Opcional pero fuerte) OTP/SSO antes de llegar a Vercel |
| App | RBAC fino por módulo × empresa |

### 4.3 Storage de expedientes

Buckets sugeridos:

- `expedientes/{empresa_id}/{expediente_id}/…`  
- Políticas: solo miembros de esa empresa  
- Tipos: bases, lista limpia, cotizaciones, fallos, contratos  

---

## 5. Flujo de desarrollo con Cursor

```
1. Cursor edita Next.js + migraciones SQL/Drizzle
2. Push a rama → Vercel Preview URL (pruebas)
3. Merge a main → producción en app.distribuidoramone.com.mx
4. Migraciones Supabase (CLI o dashboard) versionadas en /supabase/migrations
```

Ventaja clara vs servidor propio: **cada PR tiene ambiente preview** con su propia validación (y, si se configura, branch DB o proyecto staging).

### Ambientes recomendados

| Ambiente | Vercel | Supabase |
|----------|--------|----------|
| `preview` | Deployment por PR | Proyecto `ylika-staging` (barato) |
| `production` | Branch `main` | Proyecto `ylika-prod` |

No mezclar prod y pruebas en la misma DB.

---

## 6. Costos y límites (orden de magnitud)

Los free tiers alcanzan para prototipo interno pequeño. Al uso real (PDFs, varios usuarios concurrentes):

| Servicio | Qué vigilar |
|----------|-------------|
| Supabase | Tamaño DB, Storage, egress, MAU de Auth |
| Vercel | Bandwidth, Serverless/Edge execution, team seats |
| Cloudflare | Access seats si lo activas |

**Regla práctica:** MVP en free/pro bajo; revisar factura al cerrar Fase 2 (cotizaciones + Storage activo).

---

## 7. Qué ganas y qué cedes

### Ganas
- Arranque en horas, no en días de sysadmin  
- Backups y HA básicos del proveedor  
- Previews por PR (calidad con Cursor)  
- Mismo Postgres → mismo ER y reportes SQL  
- Menos puntos de falla “se apagó la mini-PC”

### Cedes
- Dependencia de Vercel/Supabase (vendor lock-in moderado; Postgres es portable)  
- Datos fuera de tu oficina (elige región cercana, ej. US East / compatible)  
- Costos variables con el crecimiento  
- Menos control fino de red que un Tunnel 100% propio  

**Mitigación de lock-in:** esquema SQL en migraciones propias; Storage con paths claros; Next.js estándar. Si un día migran a Propuesta A, exportan Postgres + archivos.

---

## 8. Fases (misma lógica de negocio, otra infra)

| Fase | En Full Cloud |
|------|----------------|
| **0** | Repo privado, proyectos Supabase (staging/prod), Vercel + dominio CF, Auth + RLS multi-empresa |
| **1** | MVP expediente (solicitud → partidas → docs en Storage) |
| **2** | Cotizaciones + comparativo |
| **3** | Proyectos + responsables |
| **4–6** | Pedido, entregas, cobranza, licitaciones/obra, tesorería |

El menú con submenús y la UI YLIKA de la Propuesta A **siguen vigentes**.

---

## 9. Checklist de decisión

Elige **Propuesta B (Cloud)** si:
- [ ] Quieren velocidad con Cursor y poco mantenimiento de servidores  
- [ ] Aceptan datos en Supabase (con RLS bien hecho)  
- [ ] El equipo es pequeño / mediano al inicio  

Quédate / cambia a **Propuesta A (Linux)** si:
- [ ] Política interna exige datos solo en oficina  
- [ ] Ya tienen mini-PC/VPS confiable y alguien que lo opere  
- [ ] Quieren costo casi fijo y control total de red  

**Opción híbrida viable:** App en Vercel + Postgres/Storage en Supabase hoy; más adelante solo mover DB a Linux si hace falta (la app casi no cambia).

---

## 10. Variables de entorno (referencia, no secretos reales)

```bash
# Vercel
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # solo server
NEXT_PUBLIC_APP_URL=https://app.distribuidoramone.com.mx
```

Nunca commitear service role. Solo Vercel env (Production / Preview).

---

## 11. Archivos de esta propuesta

| Archivo | Contenido |
|---------|-----------|
| `docs/PLAN-YLIKA-CLOUD.md` | Este documento |
| `docs/YLIKA-Propuesta-Cloud.pdf` | Resumen visual liviano Propuesta B |
| `docs/PLAN-YLIKA.md` | Propuesta A (intacta) |
| `docs/YLIKA-Propuesta-Visual.pdf` | UI / ER compartidos (intacta) |

**Siguiente paso:** decidir A, B o híbrido; el modelo de entidades ya está listo en ambos caminos.
