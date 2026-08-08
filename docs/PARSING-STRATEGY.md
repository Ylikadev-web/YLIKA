# Estrategia de análisis de documentos (anti-token-burn)

## Principio

**Determinista primero · IA solo como fallback · humano confirma lo dudoso · reglas baratas en Postgres.**

No entrenamos un “cerebro” con PDFs de ejemplo que consumen tokens y al final alucina partidas.

## Capas

1. **Excel/CSV** → `xlsx` + `parse_column_aliases` (ya en código/migraciones).  
2. **Word** → mammoth → tablas → mismo mapper.  
3. **PDF/imagen** → Azure Document Intelligence *o* AWS Textract (Tables API) → filas → mapper.  
4. **Fallback LLM** → un solo call con JSON schema estricto, cache por hash SHA del archivo.  
5. **UI de confirmación** → si `confidence < 0.35`, Laura/Miguel amarran la partida; eso refuerza aliases, no un vector store.

## Cotizaciones proveedor

- Precios normalizados **con IVA 16%** (`incluye_iva` flag).  
- Match a partidas de lista limpia por tokens + número de partida si viene.  
- Comparativo ilumina mejor opción; cotización final usa refs **P1/P2** y markup interno invisible.

## Bases de licitación (Laura)

- Extraer requisitos candidatos (documentos exigidos, fechas, carácter, % nacional).  
- Cruzar con `documentos_empresa` (vigencia).  
- Laura confirma luz verde / no participamos / orden cotizar.
