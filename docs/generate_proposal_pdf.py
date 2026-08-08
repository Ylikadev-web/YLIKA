#!/usr/bin/env python3
"""Generate a lightweight visual proposal PDF for YLIKA ERP/BOS/CRM."""

from pathlib import Path

from reportlab.lib.colors import Color, HexColor, white, black
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).resolve().parent / "YLIKA-Propuesta-Visual.pdf"
LOGO = Path(__file__).resolve().parent / "logo-ylika-sm.png"
if not LOGO.exists():
    LOGO = ROOT / "Designer.png"

# Brand
TEAL = HexColor("#0AA3A8")
ORANGE = HexColor("#F39200")
YELLOW = HexColor("#FFD100")
INK = HexColor("#1A1D21")
SLATE = HexColor("#3D4450")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F3F4F6")
LINE = HexColor("#D1D5DB")
SIDEBAR = HexColor("#111315")
CARD_BG = HexColor("#FFFFFF")

W, H = letter  # 612 x 792


def draw_header(c, title, page_no, total):
    c.setFillColor(SIDEBAR)
    c.rect(0, H - 48, W, 48, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.rect(0, H - 52, W, 4, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(36, H - 30, "YLIKA")
    c.setFont("Helvetica", 9)
    c.setFillColor(HexColor("#C5C9CE"))
    c.drawString(78, H - 30, "· Plataforma ERP / BOS / CRM")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawRightString(W - 36, H - 30, f"{title}   {page_no}/{total}")


def draw_footer(c, text="Planificación · sin código de aplicación · PDF liviano"):
    c.setStrokeColor(LINE)
    c.setLineWidth(0.5)
    c.line(36, 32, W - 36, 32)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7)
    c.drawString(36, 18, text)
    c.drawRightString(W - 36, 18, "YLIKA · MONE · DAKAM · NARAMO")


def section_title(c, x, y, text, color=INK):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(x, y, text)
    return y - 18


def body(c, x, y, text, size=9, color=SLATE, leading=12, max_width=540):
    c.setFillColor(color)
    c.setFont("Helvetica", size)
    words = text.split()
    line = ""
    for w in words:
        test = (line + " " + w).strip()
        if c.stringWidth(test, "Helvetica", size) > max_width:
            c.drawString(x, y, line)
            y -= leading
            line = w
        else:
            line = test
    if line:
        c.drawString(x, y, line)
        y -= leading
    return y


def bullet(c, x, y, text, size=9):
    c.setFillColor(ORANGE)
    c.circle(x + 3, y + 3, 2, fill=1, stroke=0)
    return body(c, x + 12, y, text, size=size, max_width=520)


def box(c, x, y, w, h, fill=SURFACE, stroke=LINE, radius=4):
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(0.8)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1)


def label(c, x, y, text, size=7, color=MUTED):
    c.setFillColor(color)
    c.setFont("Helvetica", size)
    c.drawString(x, y, text)


def fake_table(c, x, y, w, cols, rows, row_h=16, header=True):
    """Simple wireframe table — few vector lines, light PDF."""
    col_w = w / len(cols)
    total_h = row_h * (len(rows) + (1 if header else 0))
    box(c, x, y - total_h, w, total_h, fill=CARD_BG)
    cy = y
    if header:
        c.setFillColor(HexColor("#EEF2F4"))
        c.rect(x, cy - row_h, w, row_h, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 7)
        for i, col in enumerate(cols):
            c.drawString(x + 4 + i * col_w, cy - row_h + 5, col)
        cy -= row_h
    c.setFont("Helvetica", 7)
    c.setFillColor(SLATE)
    for r in rows:
        for i, cell in enumerate(r):
            c.drawString(x + 4 + i * col_w, cy - row_h + 5, str(cell)[:28])
        c.setStrokeColor(LINE)
        c.setLineWidth(0.4)
        c.line(x, cy - row_h, x + w, cy - row_h)
        cy -= row_h
    return cy


def draw_app_chrome(c, x, y, w, h, active="Comercial"):
    """Minimal app shell wireframe."""
    box(c, x, y, w, h, fill=CARD_BG, stroke=LINE, radius=6)
    # sidebar
    c.setFillColor(SIDEBAR)
    c.roundRect(x, y, 78, h, 6, fill=1, stroke=0)
    c.rect(x + 40, y, 38, h, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(x + 8, y + h - 16, "YLIKA")
    items = [
        "Inicio",
        "Comercial",
        "Compras",
        "Entregas",
        "Clientes",
        "Tesorería",
        "Proyectos",
        "Licitaciones",
        "Obra Públ.",
        "Documentos",
        "Config",
    ]
    iy = y + h - 34
    for it in items:
        if it == active or (active.startswith(it)):
            c.setFillColor(HexColor("#1C2A2C"))
            c.roundRect(x + 4, iy - 3, 70, 12, 2, fill=1, stroke=0)
            c.setFillColor(TEAL)
        else:
            c.setFillColor(HexColor("#9AA0A6"))
        c.setFont("Helvetica", 5.5)
        c.drawString(x + 8, iy, it)
        iy -= 13
    # top bar
    c.setFillColor(SURFACE)
    c.rect(x + 78, y + h - 22, w - 78, 22, fill=1, stroke=0)
    c.setStrokeColor(LINE)
    c.line(x + 78, y + h - 22, x + w, y + h - 22)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6)
    c.drawString(x + 88, y + h - 14, "Empresa: MONE ▾    Usuario: Comercial")
    c.setFillColor(ORANGE)
    c.roundRect(x + w - 70, y + h - 17, 58, 11, 2, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 5.5)
    c.drawCentredString(x + w - 41, y + h - 14, "+ Nueva solicitud")
    return x + 88, y + 10, w - 98, h - 40


# ---------- Pages ----------

def page_cover(c, total):
    c.setFillColor(SIDEBAR)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    # accent bar
    c.setFillColor(TEAL)
    c.rect(0, H - 8, W, 8, fill=1, stroke=0)
    c.setFillColor(ORANGE)
    c.rect(0, H - 12, 120, 4, fill=1, stroke=0)
    c.setFillColor(YELLOW)
    c.rect(120, H - 12, 60, 4, fill=1, stroke=0)

    if LOGO.exists():
        c.drawImage(str(LOGO), W / 2 - 70, H / 2 + 40, width=140, height=140, mask="auto")

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(W / 2, H / 2 + 10, "Propuesta de plataforma")
    c.setFont("Helvetica", 12)
    c.setFillColor(HexColor("#B8BDC4"))
    c.drawCentredString(W / 2, H / 2 - 12, "ERP · BOS · CRM  ·  Grupo YLIKA")
    c.setFillColor(TEAL)
    c.setFont("Helvetica", 9)
    c.drawCentredString(W / 2, H / 2 - 40, "Planificación visual · Modelo de entidades · Arquitectura")

    c.setFillColor(HexColor("#2A2E33"))
    c.roundRect(72, 100, W - 144, 90, 6, fill=1, stroke=0)
    c.setFillColor(HexColor("#C5C9CE"))
    c.setFont("Helvetica", 8)
    lines = [
        "Empresas: MONE · DAKAM · NARAMO",
        "Dominio base: distribuidoramone.com.mx (acceso oculto + roles)",
        "Base UI: shadcn/ui (componentes) + identidad YLIKA (no tema genérico)",
        "Base de datos recomendada: PostgreSQL · Deploy: Linux + Cloudflare Tunnel",
    ]
    ly = 168
    for ln in lines:
        c.drawString(90, ly, ln)
        ly -= 14

    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7)
    c.drawCentredString(W / 2, 48, "Documento liviano (vectorial) · Agosto 2026 · No incluye implementación")
    c.showPage()


def page_architecture(c, n, total):
    draw_header(c, "Arquitectura", n, total)
    y = H - 72
    y = section_title(c, 36, y, "1. Repo privado + PC Linux: cómo encaja")
    y = body(
        c,
        36,
        y,
        "Sí puedes privatizar el repositorio y seguir desarrollando con Cursor. "
        "El código vive en GitHub privado; la base de datos y archivos en un servidor Linux "
        "independiente. Cloudflare (ya con tu dominio) oculta el origen vía Tunnel + Access.",
        max_width=540,
    )
    y -= 8

    # diagram boxes
    boxes = [
        (40, y - 70, 150, 70, "Tu equipo / Cursor", "Editas UI y lógica\ngit push", TEAL),
        (220, y - 70, 150, 70, "GitHub privado", "YLIKA repo\nhistorial + CI", ORANGE),
        (400, y - 70, 170, 70, "Servidor Linux", "Postgres + App Docker\nDocumentos / backups", YELLOW),
    ]
    for bx, by, bw, bh, t, s, col in boxes:
        box(c, bx, by, bw, bh, fill=CARD_BG)
        c.setFillColor(col)
        c.rect(bx, by + bh - 4, bw, 4, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(bx + 8, by + bh - 18, t)
        c.setFillColor(SLATE)
        c.setFont("Helvetica", 7)
        for i, line in enumerate(s.split("\n")):
            c.drawString(bx + 8, by + bh - 34 - i * 11, line)

    # arrows
    c.setStrokeColor(MUTED)
    c.setLineWidth(1)
    c.line(190, y - 35, 220, y - 35)
    c.line(370, y - 35, 400, y - 35)

    y -= 90
    box(c, 40, y - 50, 530, 50, fill=HexColor("#EEF9F9"))
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(52, y - 18, "Cloudflare")
    c.setFillColor(SLATE)
    c.setFont("Helvetica", 7)
    c.drawString(52, y - 34, "DNS · TLS · Tunnel (sin abrir puertos) · Access (login previo) · link oculto bajo distribuidoramone.com.mx")

    y -= 70
    y = section_title(c, 36, y, "2. Stack recomendado")
    items = [
        "Frontend: Next.js + TypeScript + shadcn/ui (solo componentes; tema YLIKA propio).",
        "DB: PostgreSQL 16 — relacional + JSONB para campos variables de bases de gobierno.",
        "Auth: sesiones + RBAC por empresa (MONE / DAKAM / NARAMO).",
        "Archivos: disco del servidor o Cloudflare R2 (bases, cotizaciones PDF/Excel).",
        "No clones el repo shadcn-ui/ui: úsalo como librería vía CLI.",
    ]
    for it in items:
        y = bullet(c, 40, y, it)
        y -= 2

    y -= 10
    y = section_title(c, 36, y, "3. ¿PC Linux central?")
    y = body(
        c,
        36,
        y,
        "Recomendado: un mini-PC o VPS Linux siempre encendido para Postgres + app. "
        "No necesitas desarrollar encima de ese equipo. Desde tu laptop (o Cursor Cloud) "
        "haces cambios; el servidor recibe deploy. Separar “estación de trabajo” de "
        "“casa de datos” evita perder el sistema si se apaga tu PC personal.",
        max_width=540,
    )
    draw_footer(c)
    c.showPage()


def page_menu(c, n, total):
    draw_header(c, "Menú e IA", n, total)
    y = H - 72
    y = section_title(c, 36, y, "Menú base (tu lista) + submenús recomendados")
    y = body(
        c,
        36,
        y,
        "La estructura plana es un buen mapa de dominios. Para control de desarrollo "
        "y operación, conviene submenús. Licitaciones y Obra Pública son vistas "
        "especializadas del mismo EXPEDIENTE, no silos aislados.",
        max_width=540,
    )
    y -= 10

    menu = [
        ("1 Inicio", "Resumen · Mis tareas · Alertas de fechas"),
        ("2 Comercial", "Solicitudes · Expedientes · Comparativo · Propuestas"),
        ("3 Compras", "Proveedores · RFQ · Órdenes de compra · Seguimiento"),
        ("4 Entregas", "Programadas · Tránsito · Recibidas · Incidencias"),
        ("5 Clientes y Cobranza", "Clientes · Contactos · CXC · Edo. de cuenta"),
        ("6 Admin y Tesorería", "Caja · Pagos · Conciliación · Reportes"),
        ("7 Proyectos", "Tablero · Responsables · Avances · Docs"),
        ("8 Licitaciones", "Pipeline · Calendario · Requisitos · Fallos"),
        ("9 Obra Pública", "LOPSRM · Expedientes · Estimaciones"),
        ("10 Documentos", "Por expediente · Plantillas · Búsqueda"),
        ("11 Configuración", "Empresas · Roles · Tipos solicitud · Productos"),
    ]
    left_x = 40
    mid = 310
    for i, (m, s) in enumerate(menu):
        col = i < 6
        bx = left_x if col else mid
        by = y - (i % 6) * 48
        box(c, bx, by - 36, 250, 40, fill=CARD_BG)
        c.setFillColor(TEAL if col else ORANGE)
        c.rect(bx, by - 36, 4, 40, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(bx + 12, by - 12, m)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 6.5)
        c.drawString(bx + 12, by - 26, s)

    draw_footer(c)
    c.showPage()


def page_types(c, n, total):
    draw_header(c, "Tipos de solicitud", n, total)
    y = H - 72
    y = section_title(c, 36, y, "Catálogo configurable (no hardcode)")
    y = body(
        c,
        36,
        y,
        "Al crear una solicitud: (1) empresa destino, (2) sector Gobierno/Privado, "
        "(3) tipo. Los tipos se administran en Configuración para agregar nuevos sin redeploy.",
        max_width=540,
    )
    y -= 12

    y = section_title(c, 36, y, "Gobierno — Adquisiciones (LAASSP 2025)", color=TEAL)
    tipos_aq = [
        "Licitación pública",
        "Invitación a cuando menos tres personas",
        "Adjudicación directa",
        "Diálogo competitivo",
        "Adjudicación directa con estrategia de negociación",
        "Contrato específico por acuerdo marco",
        "Órdenes de suministro (Tienda Digital / catálogos)",
    ]
    for t in tipos_aq:
        y = bullet(c, 40, y, t)
    y -= 6
    y = body(
        c,
        36,
        y,
        "Nota: “Compra directa” operativa ≈ Adjudicación directa. "
        "“Adquisición de bienes” es el objeto (bienes/servicios/arrendamiento), no un procedimiento distinto. "
        "Campos extra: carácter nacional/internacional, folio CompraNet, % contenido nacional, origen, fechas clave.",
        size=8,
        max_width=540,
    )
    y -= 12
    y = section_title(c, 36, y, "Gobierno — Obra pública (LOPSRM)", color=ORANGE)
    for t in ["Licitación pública", "Invitación a cuando menos tres personas", "Adjudicación directa"]:
        y = bullet(c, 40, y, t)
    y -= 12
    y = section_title(c, 36, y, "Privado", color=INK)
    for t in ["Proyecto (con responsables por área + contactos)", "Venta directa (cliente + datos comerciales)"]:
        y = bullet(c, 40, y, t)

    y -= 14
    box(c, 36, y - 70, 540, 70, fill=HexColor("#FFF8EB"))
    c.setFillColor(ORANGE)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(48, y - 18, "Expediente = unidad central")
    c.setFillColor(SLATE)
    c.setFont("Helvetica", 7.5)
    for i, line in enumerate(
        [
            "Solicitud abre un expediente con código único (ej. YLK-MONE-2026-00041).",
            "Se carga la LISTA LIMPIA → partidas (producto, cantidad, unidad, especificación).",
            "Se adjuntan cotizaciones por proveedor → el sistema compara precio, entrega, % nacional, origen.",
            "Proyecto o venta directa cuelgan del mismo expediente según tipo.",
        ]
    ):
        c.drawString(48, y - 34 - i * 11, line)

    draw_footer(c)
    c.showPage()


def page_er(c, n, total):
    draw_header(c, "Modelo de datos", n, total)
    y = H - 72
    y = section_title(c, 36, y, "Entidades núcleo (relación)")
    y = body(
        c,
        36,
        y,
        "Modelo relacional en PostgreSQL. Detalle completo en docs/PLAN-YLIKA.md.",
        max_width=540,
    )
    y -= 8

    # simplified ER as boxes + lines
    nodes = [
        (50, y - 50, 100, 40, "EMPRESA"),
        (180, y - 50, 100, 40, "USUARIO/ROL"),
        (310, y - 50, 100, 40, "CLIENTE"),
        (440, y - 50, 120, 40, "TIPO_SOLICITUD"),
        (110, y - 130, 120, 40, "SOLICITUD"),
        (280, y - 130, 120, 40, "EXPEDIENTE"),
        (450, y - 130, 110, 40, "PROYECTO"),
        (50, y - 210, 110, 40, "PARTIDA"),
        (190, y - 210, 130, 40, "COTIZACIÓN"),
        (350, y - 210, 110, 40, "PROVEEDOR"),
        (480, y - 210, 90, 40, "PEDIDO"),
        (120, y - 280, 120, 40, "DOCUMENTO"),
        (280, y - 280, 120, 40, "BITÁCORA"),
        (430, y - 280, 130, 40, "COTIZ_PARTIDA"),
    ]
    for bx, by, bw, bh, name in nodes:
        box(c, bx, by, bw, bh, fill=CARD_BG)
        c.setFillColor(TEAL)
        c.setFont("Helvetica-Bold", 7)
        c.drawCentredString(bx + bw / 2, by + bh / 2 - 2, name)

    # key flows text
    y2 = y - 310
    y2 = section_title(c, 36, y2, "Flujo de datos del expediente")
    steps = [
        "1. SOLICITUD (empresa + sector + tipo + cliente)",
        "2. EXPEDIENTE (folio interno, pipeline, responsable)",
        "3. PARTIDAS desde lista limpia (Excel/CSV o captura)",
        "4. N cotizaciones de PROVEEDOR → COTIZACION_PARTIDA",
        "5. Comparativo → selección → PEDIDO / contrato",
        "6. DOCUMENTO + BITÁCORA en cada paso",
    ]
    for s in steps:
        y2 = bullet(c, 40, y2, s)

    draw_footer(c)
    c.showPage()


def page_ui_login_home(c, n, total):
    draw_header(c, "UI · Login e Inicio", n, total)
    y = H - 70
    y = section_title(c, 36, y, "Dirección visual (anti-genérico)")
    y = body(
        c,
        36,
        y,
        "Paleta YLIKA: negro carbón + teal + naranja + amarillo. Tipografía expresiva "
        "(Sora/Manrope). shadcn aporta controles accesibles; el look lo define la marca, "
        "no el tema default violeta/crema típico de demos IA.",
        max_width=540,
    )
    y -= 8

    # Login mock
    box(c, 40, y - 200, 250, 200, fill=SIDEBAR, radius=8)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(165, y - 40, "YLIKA")
    c.setFillColor(HexColor("#9AA0A6"))
    c.setFont("Helvetica", 7)
    c.drawCentredString(165, y - 54, "Acceso interno · Grupo YLIKA")
    box(c, 70, y - 95, 190, 22, fill=HexColor("#1C1F23"), stroke=HexColor("#333"))
    label(c, 78, y - 88, "correo@ylika.mx", color=MUTED)
    box(c, 70, y - 125, 190, 22, fill=HexColor("#1C1F23"), stroke=HexColor("#333"))
    label(c, 78, y - 118, "••••••••", color=MUTED)
    c.setFillColor(ORANGE)
    c.roundRect(70, y - 160, 190, 24, 4, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(165, y - 151, "Entrar")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6)
    c.drawCentredString(165, y - 185, "Protegido por Cloudflare Access + roles")

    # Home mock
    ax, ay, aw, ah = draw_app_chrome(c, 310, y - 200, 260, 200, active="Inicio")
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(ax, ay + ah - 14, "Buenos días — MONE")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6)
    c.drawString(ax, ay + ah - 26, "Una columna de trabajo, no un dashboard de stats.")
    # three task rows
    for i, (t, st) in enumerate(
        [
            ("YLK-MONE-2026-00041 · Junta aclaraciones", "Hoy 12:00"),
            ("Cotizar partidas 12–18 · Prov. Acero Norte", "Pendiente"),
            ("Proyecto Privado · asignar responsable obra", "Sin dueño"),
        ]
    ):
        box(c, ax, ay + ah - 55 - i * 32, aw - 8, 28, fill=SURFACE)
        c.setFillColor(INK)
        c.setFont("Helvetica", 6)
        c.drawString(ax + 6, ay + ah - 42 - i * 32, t)
        c.setFillColor(ORANGE)
        c.setFont("Helvetica", 5.5)
        c.drawString(ax + 6, ay + ah - 52 - i * 32, st)

    y = y - 220
    y = section_title(c, 36, y, "Principios de interfaz")
    for t in [
        "Tablas densas para partidas/comparativos (ERP real), no tarjetas decorativas.",
        "CTA naranja solo para acciones primarias; teal para navegación activa.",
        "Sin overlays, badges flotantes ni tiras de KPIs en la primera vista.",
        "Motion sobrio: sidebar, guardado, aparición de filas del comparativo.",
    ]:
        y = bullet(c, 40, y, t)

    draw_footer(c)
    c.showPage()


def page_ui_solicitud(c, n, total):
    draw_header(c, "UI · Solicitud y expediente", n, total)
    y = H - 70
    y = section_title(c, 36, y, "Alta de solicitud (wizard corto)")
    ax, ay, aw, ah = draw_app_chrome(c, 36, y - 230, 540, 230, active="Comercial")

    # wizard steps
    steps = ["1 Empresa", "2 Sector", "3 Tipo", "4 Cliente", "5 Datos"]
    for i, s in enumerate(steps):
        sx = ax + i * 85
        c.setFillColor(TEAL if i < 3 else LINE)
        c.roundRect(sx, ay + ah - 28, 78, 14, 3, fill=1, stroke=0)
        c.setFillColor(white if i < 3 else MUTED)
        c.setFont("Helvetica", 6)
        c.drawCentredString(sx + 39, ay + ah - 24, s)

    # form fields mock
    fields = [
        (ax, ay + ah - 60, "Empresa", "Distribuidora MONE ▾"),
        (ax + 200, ay + ah - 60, "Sector", "Gobierno ▾"),
        (ax, ay + ah - 100, "Tipo solicitud", "Licitación pública ▾"),
        (ax + 200, ay + ah - 100, "Carácter", "Nacional ▾"),
        (ax, ay + ah - 140, "Cliente / Convocante", "IMSS Delegación…"),
        (ax + 200, ay + ah - 140, "Folio CompraNet", "LA-XXXX-…"),
    ]
    for fx, fy, lb, val in fields:
        label(c, fx, fy + 12, lb)
        box(c, fx, fy - 6, 180, 16, fill=CARD_BG)
        c.setFillColor(INK)
        c.setFont("Helvetica", 6.5)
        c.drawString(fx + 4, fy - 1, val)

    c.setFillColor(ORANGE)
    c.roundRect(ax + aw - 100, ay + 8, 90, 16, 3, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawCentredString(ax + aw - 55, ay + 13, "Crear expediente")

    y = y - 250
    y = section_title(c, 36, y, "Expediente · lista limpia + cotizaciones")
    ax, ay, aw, ah = draw_app_chrome(c, 36, y - 250, 540, 250, active="Comercial")
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(ax, ay + ah - 12, "YLK-MONE-2026-00041")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6)
    c.drawString(ax + 110, ay + ah - 12, "Licitación pública · Nacional · En cotización")

    tabs = ["Resumen", "Partidas", "Cotizaciones", "Docs", "Bitácora"]
    for i, t in enumerate(tabs):
        c.setFillColor(TEAL if t == "Partidas" else MUTED)
        c.setFont("Helvetica-Bold" if t == "Partidas" else "Helvetica", 6)
        c.drawString(ax + i * 70, ay + ah - 28, t)
        if t == "Partidas":
            c.setStrokeColor(TEAL)
            c.setLineWidth(1)
            c.line(ax + i * 70, ay + ah - 32, ax + i * 70 + 40, ay + ah - 32)

    fake_table(
        c,
        ax,
        ay + ah - 40,
        aw - 10,
        ["#", "Descripción", "Cant", "Unidad", "Marca"],
        [
            ["1", "Válvula mariposa 6\"", "12", "PZA", "Bray"],
            ["2", "Tubo acero al carbón", "240", "M", "Ternium"],
            ["3", "Codo 90° Sch40", "48", "PZA", "—"],
            ["4", "Empaque EPDM", "60", "PZA", "—"],
        ],
    )
    c.setFillColor(TEAL)
    c.roundRect(ax, ay + 8, 100, 14, 2, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica", 6)
    c.drawCentredString(ax + 50, ay + 12, "Importar lista limpia")

    draw_footer(c)
    c.showPage()


def page_ui_comparativo(c, n, total):
    draw_header(c, "UI · Comparativo y proyecto", n, total)
    y = H - 70
    y = section_title(c, 36, y, "Comparativo de cotizaciones (herramienta clave)")
    y = body(
        c,
        36,
        y,
        "Tras adjuntar cotizaciones, la matriz muestra por partida: precio, entrega, "
        "% integración nacional, origen y condiciones. Se marca la opción elegida. "
        "Ideal para gobierno y compras privadas.",
        max_width=540,
    )
    y -= 6
    ax, ay, aw, ah = draw_app_chrome(c, 36, y - 210, 540, 210, active="Comercial")
    fake_table(
        c,
        ax,
        ay + ah - 20,
        aw - 10,
        ["Partida", "Prov A $", "Prov B $", "% Nac A", "% Nac B", "Entrega", "Elegida"],
        [
            ["1 Válvula", "4,200", "4,050", "70%", "55%", "15 / 21 d", "B"],
            ["2 Tubo", "890", "910", "85%", "80%", "10 / 12 d", "A"],
            ["3 Codo", "120", "115", "60%", "65%", "7 / 9 d", "B"],
            ["4 Empaque", "35", "32", "—", "—", "5 / 5 d", "B"],
        ],
        row_h=18,
    )
    label(c, ax, ay + 20, "Adjuntos: Cotizacion_AceroNorte.pdf · Cotizacion_HidraulicaMX.xlsx", size=6)

    y = y - 230
    y = section_title(c, 36, y, "Proyecto privado · responsables por área")
    ax, ay, aw, ah = draw_app_chrome(c, 36, y - 200, 540, 200, active="Proyectos")
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(ax, ay + ah - 12, "Proyecto · Estacionamiento Plaza Norte (NARAMO)")
    areas = [
        ("Comercial", "Ana R.", "ana@…"),
        ("Técnica", "Luis M.", "luis@…"),
        ("Compras", "—", "sin asignar"),
        ("Obra", "Pedro G.", "pedro@…"),
        ("Finanzas", "María L.", "maria@…"),
    ]
    for i, (a, nme, em) in enumerate(areas):
        bx = ax + (i % 3) * 145
        by = ay + ah - 70 - (i // 3) * 55
        box(c, bx, by, 138, 48, fill=SURFACE)
        c.setFillColor(TEAL)
        c.setFont("Helvetica-Bold", 6.5)
        c.drawString(bx + 6, by + 34, a)
        c.setFillColor(INK)
        c.setFont("Helvetica", 7)
        c.drawString(bx + 6, by + 20, nme)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 6)
        c.drawString(bx + 6, by + 8, em)

    draw_footer(c)
    c.showPage()


def page_modules(c, n, total):
    draw_header(c, "UI · Módulos restantes", n, total)
    y = H - 72
    y = section_title(c, 36, y, "Herramientas por sección (alcance funcional)")
    y -= 4

    modules = [
        ("Compras", "RFQ a proveedores, catálogo, OC, tracking de surtido vinculado a partidas del expediente."),
        ("Entregas", "Programación por pedido, evidencias, incidencias; estados visibles en expediente."),
        ("Clientes y Cobranza", "Ficha completa (gob/privado), contactos, CXC, seguimiento de cobranza por factura/pedido."),
        ("Admin y Tesorería", "Pagos a proveedores, conciliación simple, reportes por empresa del grupo."),
        ("Licitaciones", "Calendario CompraNet, checklist de requisitos, estados hasta fallo; alertas de fechas."),
        ("Obra Pública", "Misma base de expediente + campos LOPSRM, estimaciones y docs de obra."),
        ("Documentos", "Todo archivo cuelga de una entidad (expediente/partida/cotización); búsqueda por folio."),
        ("Configuración", "Empresas, usuarios, roles, tipos de solicitud, productos, plantillas, integraciones."),
    ]
    for i, (title, desc) in enumerate(modules):
        by = y - (i // 2) * 70
        bx = 36 if i % 2 == 0 else 306
        if i % 2 == 0 and i > 0:
            pass
        box(c, bx, by - 55, 250, 58, fill=CARD_BG)
        c.setFillColor(TEAL if i % 2 == 0 else ORANGE)
        c.rect(bx, by - 55, 3, 58, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(bx + 12, by - 14, title)
        body(c, bx + 12, by - 28, desc, size=6.5, leading=9, max_width=225)

    draw_footer(c)
    c.showPage()


def page_phases(c, n, total):
    draw_header(c, "Fases y siguientes pasos", n, total)
    y = H - 72
    y = section_title(c, 36, y, "Fases técnicas (sin fechas de calendario)")
    phases = [
        ("Fase 0", "Cimientos: repo privado, Docker, Postgres, Tunnel, auth, multi-empresa."),
        ("Fase 1", "MVP expediente: solicitud → partidas (lista limpia) → documentos."),
        ("Fase 2", "Cotizaciones + comparativo (% nacional, origen, entrega)."),
        ("Fase 3", "Proyectos + responsables por área + bitácora."),
        ("Fase 4", "Pedido → entregas → cobranza básica."),
        ("Fase 5", "Vistas Licitaciones / Obra Pública + alertas."),
        ("Fase 6", "Tesorería y reportes por empresa."),
    ]
    for i, (ph, desc) in enumerate(phases):
        box(c, 40, y - 36, 530, 32, fill=CARD_BG)
        c.setFillColor(TEAL)
        c.roundRect(48, y - 28, 52, 16, 3, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 6.5)
        c.drawCentredString(74, y - 23, ph)
        c.setFillColor(SLATE)
        c.setFont("Helvetica", 7.5)
        c.drawString(112, y - 22, desc)
        y -= 40

    y -= 8
    y = section_title(c, 36, y, "Decisiones a validar contigo / tu jefe")
    for t in [
        "Postgres en mini-PC de oficina vs VPS.",
        "Un login YLIKA con switch de empresa vs URL por empresa.",
        "Lista limpia: ¿siempre Excel o también captura manual?",
        "¿Multi-moneda desde el día uno?",
        "¿CFDI / facturación electrónica en fase temprana o después?",
    ]:
        y = bullet(c, 40, y, t)

    y -= 16
    box(c, 36, y - 80, 540, 80, fill=HexColor("#EEF9F9"))
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(48, y - 20, "Siguiente paso")
    c.setFillColor(SLATE)
    c.setFont("Helvetica", 8)
    body(
        c,
        48,
        y - 38,
        "Validar este plan y el menú con submenús. Cuando aprueben el modelo de entidades "
        "y la dirección visual, iniciamos Fase 0 (infra + auth) sin reinventar pantallas. "
        "Detalle narrativo completo: docs/PLAN-YLIKA.md",
        size=8,
        max_width=510,
    )

    draw_footer(c)
    c.showPage()


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    if OUT.exists():
        OUT.unlink()
    c = canvas.Canvas(str(OUT), pagesize=letter)
    c.setTitle("YLIKA — Propuesta visual ERP/BOS/CRM")
    c.setAuthor("YLIKA Planning")
    c.setPageCompression(1)
    total = 10
    page_cover(c, total)
    page_architecture(c, 2, total)
    page_menu(c, 3, total)
    page_types(c, 4, total)
    page_er(c, 5, total)
    page_ui_login_home(c, 6, total)
    page_ui_solicitud(c, 7, total)
    page_ui_comparativo(c, 8, total)
    page_modules(c, 9, total)
    page_phases(c, 10, total)
    c.save()
    size_kb = OUT.stat().st_size / 1024
    print(f"Wrote {OUT} ({size_kb:.1f} KB) logo={LOGO.name}")


if __name__ == "__main__":
    main()
