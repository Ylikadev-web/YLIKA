# Desarrollo Full Cloud — guía operativa

## Stack activo

- App: `web/` (Next.js)
- Hosting prod (luego): Vercel
- Datos (luego): Supabase
- Links temporales **sin usar tus dominios**: Cloudflare Tunnel (`cloudflared`)

## Links fijos temporales con Cloudflare (sin dominio propio)

Si ya tienes `cloudflared` en la computadora:

```bash
cd web
npm run dev
# en otra terminal:
cloudflared tunnel --url http://localhost:3000
```

Eso te da una URL `https://xxxxx.trycloudflare.com` compartible con el equipo.

Notas:
- La URL de *quick tunnel* puede cambiar al reiniciar (no es permanente).
- Para un hostname **estable** sin tocar `distribuidoramone.com.mx`, crea un tunnel nombrado en el dashboard de Cloudflare y un hostname en un dominio barato nuevo, o usa el subdomain `*.trycloudflare.com` solo para demos internas.
- Cuando migren: CNAME del dominio definitivo → Vercel; el código no cambia.

## Local

```bash
cd web
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Temas visuales

Configuración → Temas: Obsidian Glass, Frost, Aurora, Graphite.  
Persistencia vía `next-themes` (localStorage). Luego se guardará en perfil Supabase.

## Próximo (Fase 0 datos)

1. Crear proyecto Supabase (staging)
2. Conectar Vercel al repo / carpeta `web`
3. Auth + RLS multi-empresa
4. Migrar de tunnel temporal → dominio Vercel/Cloudflare
