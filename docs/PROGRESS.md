# YLIKA Ops — Progress

> Actualizado con el flujo real: Laura → Ventas → Itza → Nesim → recotización → remisión → cobranza.

## Progress bar

```
████████████████████  Oleada áreas + Drive + usuarios (en curso)
```

| # | Entregable | Estado |
|---|------------|--------|
| … | (ver historial arriba) | ✅ |
| 23 | Propuesta por área (AZTK → YLIKA) | ✅ `docs/PROPUESTA-AREAS-YLIKA.md` |
| 24 | Admin usuarios + áreas (superusuario) | ✅ `/app/configuracion/usuarios` |
| 25 | Dashboard Inicio personalizado por roles | ✅ KPIs + áreas + bandeja |
| 26 | Google Drive structure + adapter | ✅ stub sin creds; real con `GOOGLE_DRIVE_*` |
| 27 | Wizard alta partidas-primero | ⬜ |
| 28 | Sync upload doc → subcarpeta Drive | ⬜ |
| 29 | Caja chica expediente (patrón AZTK) | ⬜ |

---

## Bloqueadores / lo que necesito de ti

1. **Google Drive:** cuenta de servicio GCP + carpeta raíz compartida → pegar en Vercel:
   - `GOOGLE_DRIVE_CLIENT_EMAIL`
   - `GOOGLE_DRIVE_PRIVATE_KEY`
   - `GOOGLE_DRIVE_FOLDER_ID`
2. Cuando puedas: **1 base PDF real** + Excel lista limpia + cotizaciones para afinar parser.
3. Confirmar si quieres rol dedicado `COMPRAS` separado de Ventas.
