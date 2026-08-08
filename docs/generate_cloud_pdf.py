#!/usr/bin/env python3
"""Lightweight PDF for YLIKA Propuesta B — Full Cloud (GitHub / Supabase / Vercel)."""

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

OUT = Path(__file__).resolve().parent / "YLIKA-Propuesta-Cloud.pdf"
LOGO = Path(__file__).resolve().parent / "logo-ylika-sm.png"

TEAL = HexColor("#0AA3A8")
ORANGE = HexColor("#F39200")
YELLOW = HexColor("#FFD100")
INK = HexColor("#1A1D21")
SLATE = HexColor("#3D4450")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F3F4F6")
LINE = HexColor("#D1D5DB")
SIDEBAR = HexColor("#111315")
CARD = HexColor("#FFFFFF")
CLOUD = HexColor("#EEF6FF")

W, H = letter


def header(c, title, n, total):
    c.setFillColor(SIDEBAR)
    c.rect(0, H - 48, W, 48, fill=1, stroke=0)
    c.setFillColor(ORANGE)
    c.rect(0, H - 52, W, 4, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(36, H - 30, "YLIKA")
    c.setFont("Helvetica", 9)
    c.setFillColor(HexColor("#C5C9CE"))
    c.drawString(78, H - 30, "· Propuesta B · Full Cloud")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawRightString(W - 36, H - 30, f"{title}   {n}/{total}")


def footer(c):
    c.setStrokeColor(LINE)
    c.setLineWidth(0.5)
    c.line(36, 32, W - 36, 32)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7)
    c.drawString(36, 18, "Complementa PLAN-YLIKA.md · no la reemplaza · PDF liviano")
    c.drawRightString(W - 36, 18, "GitHub · Supabase · Vercel")


def title(c, x, y, text, color=INK):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(x, y, text)
    return y - 16


def body(c, x, y, text, size=9, color=SLATE, leading=12, max_w=540):
    c.setFillColor(color)
    c.setFont("Helvetica", size)
    words = text.split()
    line = ""
    for w in words:
        test = (line + " " + w).strip()
        if c.stringWidth(test, "Helvetica", size) > max_w:
            c.drawString(x, y, line)
            y -= leading
            line = w
        else:
            line = test
    if line:
        c.drawString(x, y, line)
        y -= leading
    return y


def bullet(c, x, y, text, size=8.5):
    c.setFillColor(ORANGE)
    c.circle(x + 3, y + 3, 2, fill=1, stroke=0)
    return body(c, x + 12, y, text, size=size, max_w=520)


def box(c, x, y, w, h, fill=SURFACE, stroke=LINE, r=4):
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(0.8)
    c.roundRect(x, y, w, h, r, fill=1, stroke=1)


def page_cover(c, total):
    c.setFillColor(SIDEBAR)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(ORANGE)
    c.rect(0, H - 8, W, 8, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.rect(0, H - 12, 100, 4, fill=1, stroke=0)
    c.setFillColor(YELLOW)
    c.rect(100, H - 12, 50, 4, fill=1, stroke=0)

    if LOGO.exists():
        c.drawImage(str(LOGO), W / 2 - 55, H / 2 + 70, width=110, height=110, mask="auto")

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(W / 2, H / 2 + 30, "Propuesta B — Full Cloud")
    c.setFillColor(HexColor("#B8BDC4"))
    c.setFont("Helvetica", 11)
    c.drawCentredString(W / 2, H / 2 + 8, "GitHub  ·  Supabase  ·  Vercel")
    c.setFillColor(ORANGE)
    c.setFont("Helvetica", 9)
    c.drawCentredString(W / 2, H / 2 - 18, "Alternativa a la propuesta con servidor Linux (intacta)")

    box(c, 72, 120, W - 144, 100, fill=HexColor("#1C1F23"), stroke=HexColor("#333"), r=6)
    c.setFillColor(HexColor("#C5C9CE"))
    c.setFont("Helvetica", 8)
    lines = [
        "Mismo modelo de entidades y menú que la Propuesta A.",
        "Sin PC Linux central: Cursor → GitHub → Vercel + Supabase.",
        "Cloudflare sigue en DNS (dominio oculto app.distribuidoramone.com.mx).",
        "Ideal para MVP rápido; migrable a self-host si más adelante lo piden.",
    ]
    ly = 195
    for ln in lines:
        c.drawString(90, ly, ln)
        ly -= 16

    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7)
    c.drawCentredString(W / 2, 48, "Documento liviano · Agosto 2026 · Sin implementación")
    c.showPage()


def page_opinion(c, n, total):
    header(c, "Opinión", n, total)
    y = H - 72
    y = title(c, 36, y, "¿Conviene full cloud para YLIKA?")
    y = body(
        c,
        36,
        y,
        "Sí, como ruta preferida para arrancar con Cursor y un equipo pequeño. "
        "Menos ops, previews por PR, Postgres administrado. El modelo de negocio "
        "(expediente, partidas, cotizaciones, multi-empresa) no cambia.",
        max_w=540,
    )
    y -= 12

    # comparison table header
    y = title(c, 36, y, "Comparativo rápido A vs B")
    cols = [("Criterio", 120), ("A · Linux + Tunnel", 200), ("B · Full Cloud", 200)]
    x0 = 36
    box(c, x0, y - 18, 540, 18, fill=HexColor("#EEF2F4"))
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 7)
    cx = x0 + 6
    for name, w in cols:
        c.drawString(cx, y - 12, name)
        cx += w
    y -= 18

    rows = [
        ("Velocidad MVP", "Media", "Alta"),
        ("Mantenimiento", "Tú (Docker, backups)", "Proveedores"),
        ("PC Linux", "Recomendado", "No necesario"),
        ("DB", "Postgres propio", "Supabase Postgres"),
        ("Deploy", "Tunnel / Docker", "git push → Vercel"),
        ("Previews PR", "Manual", "Nativo Vercel"),
        ("Control datos", "Máximo local", "Cloud (región elegible)"),
        ("Costo inicial", "HW o VPS", "Free tiers / bajo"),
        ("Lock-in", "Bajo", "Moderado (Postgres portable)"),
    ]
    for i, (a, b, d) in enumerate(rows):
        bg = CARD if i % 2 == 0 else SURFACE
        box(c, x0, y - 16, 540, 16, fill=bg, stroke=LINE, r=0)
        c.setStrokeColor(LINE)
        c.setLineWidth(0.3)
        c.rect(x0, y - 16, 540, 16, fill=0, stroke=1)
        c.setFillColor(SLATE)
        c.setFont("Helvetica", 7)
        c.drawString(x0 + 6, y - 11, a)
        c.drawString(x0 + 126, y - 11, b)
        c.setFillColor(TEAL)
        c.drawString(x0 + 326, y - 11, d)
        y -= 16

    y -= 16
    box(c, 36, y - 70, 540, 70, fill=HexColor("#FFF8EB"))
    c.setFillColor(ORANGE)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(48, y - 18, "Recomendación")
    c.setFillColor(SLATE)
    c.setFont("Helvetica", 8)
    body(
        c,
        48,
        y - 36,
        "Empezar con Propuesta B para Fases 0–2 (MVP expediente + cotizaciones). "
        "Si política o volumen lo exigen, migrar Postgres/archivos a la Propuesta A. "
        "Opción híbrida: app en Vercel + DB Supabase hoy; DB en Linux después.",
        size=8,
        max_w=510,
    )
    footer(c)
    c.showPage()


def page_architecture(c, n, total):
    header(c, "Arquitectura", n, total)
    y = H - 72
    y = title(c, 36, y, "Flujo full cloud")
    y -= 4

    nodes = [
        (40, y - 80, 120, 70, "Cursor / Laptop", "Editas Next.js\n+ migraciones", TEAL),
        (180, y - 80, 120, 70, "GitHub privado", "PRs · historial\nCI opcional", ORANGE),
        (320, y - 80, 110, 70, "Vercel", "Next.js prod\n+ Preview PRs", YELLOW),
        (450, y - 80, 120, 70, "Supabase", "Postgres · Auth\nStorage · RLS", TEAL),
    ]
    for bx, by, bw, bh, t, s, col in nodes:
        box(c, bx, by, bw, bh, fill=CARD)
        c.setFillColor(col)
        c.rect(bx, by + bh - 4, bw, 4, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(bx + 8, by + bh - 20, t)
        c.setFillColor(SLATE)
        c.setFont("Helvetica", 7)
        for i, line in enumerate(s.split("\n")):
            c.drawString(bx + 8, by + bh - 36 - i * 11, line)

    c.setStrokeColor(MUTED)
    c.setLineWidth(1)
    for x1, x2 in [(160, 180), (300, 320), (430, 450)]:
        c.line(x1, y - 45, x2, y - 45)

    y -= 100
    box(c, 40, y - 48, 530, 48, fill=CLOUD)
    c.setFillColor(HexColor("#2563EB"))
    c.setFont("Helvetica-Bold", 8)
    c.drawString(52, y - 18, "Cloudflare (ya lo tienes)")
    c.setFillColor(SLATE)
    c.setFont("Helvetica", 7.5)
    c.drawString(52, y - 34, "DNS → CNAME a Vercel · TLS · subdominio oculto · Access opcional (OTP/SSO delante de la app)")

    y -= 70
    y = title(c, 36, y, "Responsabilidad por servicio")
    items = [
        "GitHub: código, PRs, colaboración con Cursor.",
        "Vercel: hosting Next.js, env vars, Deployment Protection, dominios.",
        "Supabase: PostgreSQL (mismo ER), Auth, Storage de expedientes, RLS multi-empresa.",
        "Cloudflare: DNS de distribuidoramone.com.mx; no reemplaza a Vercel.",
        "shadcn/ui: componentes; identidad visual YLIKA (teal/naranja/negro) intacta.",
    ]
    for it in items:
        y = bullet(c, 40, y, it)
        y -= 2

    y -= 10
    y = title(c, 36, y, "Ambientes")
    box(c, 40, y - 55, 250, 55, fill=CARD)
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(52, y - 16, "Staging")
    c.setFillColor(SLATE)
    c.setFont("Helvetica", 7)
    c.drawString(52, y - 32, "Vercel Preview / branch")
    c.drawString(52, y - 44, "Supabase proyecto ylika-staging")
    box(c, 310, y - 55, 260, 55, fill=CARD)
    c.setFillColor(ORANGE)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(322, y - 16, "Production")
    c.setFillColor(SLATE)
    c.setFont("Helvetica", 7)
    c.drawString(322, y - 32, "Vercel main → app.dominio")
    c.drawString(322, y - 44, "Supabase proyecto ylika-prod")

    footer(c)
    c.showPage()


def page_security_phases(c, n, total):
    header(c, "Seguridad y fases", n, total)
    y = H - 72
    y = title(c, 36, y, "Multi-empresa con RLS (Supabase)")
    for t in [
        "Auth Supabase → sesión del usuario.",
        "Tabla usuario_empresa (empresa × rol).",
        "RLS: solo filas de empresas donde el usuario es miembro.",
        "Storage: paths expedientes/{empresa_id}/{expediente_id}/… con políticas iguales.",
        "Roles de módulo (Comercial, Compras…) además del login.",
    ]:
        y = bullet(c, 40, y, t)

    y -= 12
    y = title(c, 36, y, "Link oculto — capas")
    box(c, 36, y - 75, 540, 75, fill=SURFACE)
    c.setFillColor(SLATE)
    c.setFont("Helvetica", 7.5)
    lines = [
        "1. Subdominio no publicitado (app. / ops.) en Cloudflare DNS.",
        "2. Vercel Deployment Protection (password / auth de equipo) en previews y opcional prod.",
        "3. Cloudflare Access opcional delante (misma idea Zero Trust que la Propuesta A).",
        "4. RBAC dentro de la app por módulo y empresa.",
    ]
    for i, ln in enumerate(lines):
        c.drawString(48, y - 18 - i * 14, ln)

    y -= 95
    y = title(c, 36, y, "Fases (misma lógica, otra infra)")
    phases = [
        ("0", "Supabase staging/prod + Vercel + dominio + Auth/RLS"),
        ("1", "MVP expediente + lista limpia + Storage docs"),
        ("2", "Cotizaciones y comparativo"),
        ("3+", "Proyectos, pedido, entregas, licitaciones, tesorería"),
    ]
    for ph, desc in phases:
        box(c, 40, y - 28, 530, 26, fill=CARD)
        c.setFillColor(ORANGE)
        c.roundRect(48, y - 22, 28, 14, 2, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 7)
        c.drawCentredString(62, y - 18, ph)
        c.setFillColor(SLATE)
        c.setFont("Helvetica", 8)
        c.drawString(88, y - 17, desc)
        y -= 32

    y -= 6
    y = title(c, 36, y, "Cuándo elegir cada una")
    y = body(c, 36, y, "Elige B (Cloud) si quieren velocidad y poco sysadmin. Elige A (Linux) si los datos deben quedarse en oficina. Híbrido: Vercel + Supabase ahora; mover DB después.", max_w=540)

    footer(c)
    c.showPage()


def page_checklist(c, n, total):
    header(c, "Decisión", n, total)
    y = H - 72
    y = title(c, 36, y, "Checklist para validar con tu jefe")
    y -= 4
    checks = [
        "¿Aceptamos Postgres + archivos en Supabase (región elegida)?",
        "¿Presupuesto mensual cloud OK vs mini-PC/VPS?",
        "¿Un login YLIKA con switch MONE/DAKAM/NARAMO?",
        "¿Cloudflare Access además de Auth de la app?",
        "¿Empezamos B y dejamos A como plan B de migración?",
    ]
    for t in checks:
        box(c, 40, y - 28, 530, 26, fill=CARD)
        c.setStrokeColor(LINE)
        c.setLineWidth(1)
        c.rect(52, y - 20, 10, 10, fill=0, stroke=1)
        c.setFillColor(SLATE)
        c.setFont("Helvetica", 8)
        c.drawString(72, y - 18, t)
        y -= 32

    y -= 10
    box(c, 36, y - 100, 540, 100, fill=HexColor("#EEF9F9"))
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(48, y - 20, "Documentos relacionados (ninguno borrado)")
    c.setFillColor(SLATE)
    c.setFont("Helvetica", 8)
    for i, ln in enumerate(
        [
            "docs/PLAN-YLIKA.md — Propuesta A (servidor Linux + Tunnel)",
            "docs/YLIKA-Propuesta-Visual.pdf — UI / menú / ER compartidos",
            "docs/PLAN-YLIKA-CLOUD.md — detalle narrativo Propuesta B",
            "docs/YLIKA-Propuesta-Cloud.pdf — este resumen visual",
            "Siguiente paso: elegir A, B o híbrido → luego Fase 0",
        ]
    ):
        c.drawString(48, y - 40 - i * 12, ln)

    footer(c)
    c.showPage()


def main():
    if OUT.exists():
        OUT.unlink()
    c = canvas.Canvas(str(OUT), pagesize=letter)
    c.setTitle("YLIKA — Propuesta B Full Cloud")
    c.setAuthor("YLIKA Planning")
    c.setPageCompression(1)
    total = 5
    page_cover(c, total)
    page_opinion(c, 2, total)
    page_architecture(c, 3, total)
    page_security_phases(c, 4, total)
    page_checklist(c, 5, total)
    c.save()
    print(f"Wrote {OUT} ({OUT.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
