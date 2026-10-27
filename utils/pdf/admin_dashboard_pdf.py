import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.pdfgen import canvas
from django.utils import timezone


# ── Color Palette ─────────────────────────────────────────────────────────────
PRIMARY_GREEN = colors.HexColor('#16A34A')   # Accent Green
BRAND_PURPLE  = colors.HexColor('#581C87')   # Table Headers
PURPLE_TEXT   = colors.HexColor('#6B21A8')
CARD_BG       = colors.HexColor('#F8FAFC')   # Card Background
BORDER_COLOR  = colors.HexColor('#E2E8F0')   # Borders
TEXT_DARK     = colors.HexColor('#1E293B')   # Text
TEXT_MUTED    = colors.HexColor('#64748B')   # Subtitles
STATUS_RED    = colors.HexColor('#DC2626')   # Urgent Flag
STATUS_AMBER  = colors.HexColor('#D97706')   # Pending Status


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and print 'Page X of Y' on every page
    with dual-color bottom accent bar (50% Green + 50% Purple).
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        w, h = A4

        # Dual-color Accent Bar (50% Green + 50% Purple)
        self.setFillColor(PRIMARY_GREEN)
        self.rect(12 * mm, 6 * mm, (w - 24 * mm) / 2, 2, fill=True, stroke=False)
        self.setFillColor(BRAND_PURPLE)
        self.rect(12 * mm + (w - 24 * mm) / 2, 6 * mm, (w - 24 * mm) / 2, 2, fill=True, stroke=False)

        # Footer text
        self.setFont("Helvetica", 8)
        self.setFillColor(TEXT_MUTED)
        now_str = timezone.now().strftime('%d %b %Y, %I:%M %p')
        self.drawString(12 * mm, 9 * mm, f"Admin Dashboard Report • Generated on {now_str}")
        self.drawRightString(w - 12 * mm, 9 * mm, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


def generate_admin_dashboard_pdf(file_path, data, user=None):
    """
    Generates Admin Dashboard PDF containing:
    1. Header & Meta (Date Filter & Generation Time)
    2. 8 KPI Tiles (4x2 Grid Cards)
    3. Table 1: Missed Follow Up
    4. Table 2: Pending Payment List
    5. Table 3: Performance Overview
    """
    doc = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        leftMargin=10 * mm,
        rightMargin=10 * mm,
        topMargin=10 * mm,
        bottomMargin=14 * mm
    )
    usable_w = A4[0] - 20 * mm  # ~190mm

    title_style     = ParagraphStyle('Title', fontName='Helvetica-Bold', fontSize=16, textColor=PRIMARY_GREEN, leading=20)
    sec_title_style = ParagraphStyle('SecTitle', fontName='Helvetica-Bold', fontSize=10.5, textColor=BRAND_PURPLE, leading=14)
    meta_style      = ParagraphStyle('Meta', fontName='Helvetica', fontSize=8, textColor=TEXT_MUTED, leading=11)

    kpi_lbl_style   = ParagraphStyle('KpiLbl', fontName='Helvetica', fontSize=7, textColor=TEXT_MUTED, alignment=1, leading=9)
    kpi_val_style   = ParagraphStyle('KpiVal', fontName='Helvetica-Bold', fontSize=12, textColor=PRIMARY_GREEN, alignment=1, leading=15)
    kpi_trend_style = ParagraphStyle('KpiTrend', fontName='Helvetica', fontSize=6.5, textColor=TEXT_MUTED, alignment=1, leading=8)

    th_style        = ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white, alignment=1, leading=9.5)
    td_style        = ParagraphStyle('TD', fontName='Helvetica', fontSize=7, textColor=TEXT_DARK, alignment=1, leading=9)
    td_left         = ParagraphStyle('TDL', fontName='Helvetica', fontSize=7, textColor=TEXT_DARK, alignment=0, leading=9)
    td_urgent       = ParagraphStyle('TDU', fontName='Helvetica-Bold', fontSize=7, textColor=STATUS_RED, alignment=1, leading=9)

    elements = []

    # ── 1. Header & Meta ──────────────────────────────────────────────────────
    elements.append(Paragraph("<b>Admin Dashboard Report</b>", title_style))
    date_lbl = data.get("date_filter_label", "This Year")
    gen_time = timezone.now().strftime('%d %b %Y, %I:%M %p')
    elements.append(Paragraph(f"<b>Filter:</b> {date_lbl} &nbsp;|&nbsp; <b>Generated:</b> {gen_time}", meta_style))
    elements.append(Spacer(1, 3 * mm))

    # ── 2. TILES (8 KPI Cards Grid in 4x2) ───────────────────────────────────
    metrics = data.get("metrics", {})
    tiles_def = [
        ("Total Leads", metrics.get("total_leads", {})),
        ("Calls Made", metrics.get("calls_made", {})),
        ("Follow - Up", metrics.get("follow_up", {})),
        ("Missed Follow Up", metrics.get("missed_follow_up", {})),
        ("Converted Leads", metrics.get("converted_leads", {})),
        ("Loss Leads", metrics.get("loss_leads", {})),
        ("Conversion Rate", metrics.get("conversion_rate", {})),
        ("Pending Payment", metrics.get("pending_payment", {}))
    ]

    card_cells = []
    for label, m_data in tiles_def:
        raw_val = m_data.get("value", 0)
        if label == "Conversion Rate":
            val_str = f"{raw_val}%"
        elif label == "Pending Payment":
            val_str = f"Rs. {raw_val:,}" if isinstance(raw_val, (int, float)) else f"Rs. {raw_val}"
        else:
            val_str = f"{raw_val:,}" if isinstance(raw_val, (int, float)) else str(raw_val)

        trend_str = m_data.get("trend", "")
        cell_flowables = [
            Paragraph(label, kpi_lbl_style),
            Paragraph(val_str, kpi_val_style),
            Paragraph(trend_str, kpi_trend_style)
        ]
        card_cells.append(cell_flowables)

    col_w4 = usable_w / 4
    grid_rows = [
        [card_cells[0], card_cells[1], card_cells[2], card_cells[3]],
        [card_cells[4], card_cells[5], card_cells[6], card_cells[7]]
    ]
    kpi_table = Table(grid_rows, colWidths=[col_w4] * 4)
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 2 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2 * mm),
    ]))
    elements.append(kpi_table)
    elements.append(Spacer(1, 4 * mm))

    # ── 3. TABLE 1: Missed Follow Up ─────────────────────────────────────────
    elements.append(Paragraph("<b>1. Missed Follow Up List</b>", sec_title_style))
    elements.append(Spacer(1, 1.5 * mm))

    missed_headers = ["S.No", "Student Name", "Mobile Number", "Lead Stage", "Follow up date", "Telecaller", "Flag"]
    m_widths = [10 * mm, 38 * mm, 28 * mm, 26 * mm, 24 * mm, 44 * mm, 20 * mm]

    m_table_data = [[Paragraph(h, th_style) for h in missed_headers]]
    missed_rows = data.get("missed_followups", []) if isinstance(data, dict) else []
    if not missed_rows:
        m_table_data.append([Paragraph("No missed follow-ups found", td_style)] + [Paragraph("", td_style)] * 6)
    else:
        for idx, r in enumerate(missed_rows, start=1):
            flag_text = "Urgent 🚩" if r.get("flag") == "red" else "Normal"
            m_table_data.append([
                Paragraph(str(idx), td_style),
                Paragraph(str(r.get("student_name", "-")), td_left),
                Paragraph(str(r.get("mobile_number") or r.get("mobile_no") or "-"), td_style),
                Paragraph(str(r.get("lead_stage", "Follow Up")), td_style),
                Paragraph(str(r.get("follow_up_date", "-")), td_style),
                Paragraph(str(r.get("telecaller", "Unassigned")), td_left),
                Paragraph(flag_text, td_urgent if r.get("flag") == "red" else td_style)
            ])

    t_missed = Table(m_table_data, colWidths=m_widths, repeatRows=1)
    t_missed.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_PURPLE),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, CARD_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(t_missed)
    elements.append(Spacer(1, 4 * mm))

    # ── 4. TABLE 2: Pending Payment List ─────────────────────────────────────
    elements.append(Paragraph("<b>2. Pending Payment List</b>", sec_title_style))
    elements.append(Spacer(1, 1.5 * mm))

    pay_headers = ["S.No", "Student Name", "Course", "Amount (Rs.)", "Due Date", "Status", "Telecaller"]
    pay_widths = [10 * mm, 36 * mm, 36 * mm, 26 * mm, 24 * mm, 24 * mm, 34 * mm]

    pay_table_data = [[Paragraph(h, th_style) for h in pay_headers]]
    pay_rows = data.get("pending_payments", []) if isinstance(data, dict) else []
    if not pay_rows:
        pay_table_data.append([Paragraph("No pending payments found", td_style)] + [Paragraph("", td_style)] * 6)
    else:
        for idx, p in enumerate(pay_rows, start=1):
            pay_table_data.append([
                Paragraph(str(idx), td_style),
                Paragraph(str(p.get("student_name", "-")), td_left),
                Paragraph(str(p.get("course", "-")), td_left),
                Paragraph(str(p.get("amount", 0)), td_style),
                Paragraph(str(p.get("due_date", "-")), td_style),
                Paragraph(str(p.get("status", "Pending")), td_style),
                Paragraph(str(p.get("telecaller", "-")), td_left)
            ])

    t_pay = Table(pay_table_data, colWidths=pay_widths, repeatRows=1)
    t_pay.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_PURPLE),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, CARD_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(t_pay)
    elements.append(Spacer(1, 4 * mm))

    # ── 5. TABLE 3: Performance Overview ─────────────────────────────────────
    elements.append(Paragraph("<b>3. Telecaller Performance Overview</b>", sec_title_style))
    elements.append(Spacer(1, 1.5 * mm))

    perf_headers = ["S.No", "Telecaller", "Total Leads", "Calls Made", "Connected", "Missed F/U", "Conversion", "Rating"]
    perf_widths = [10 * mm, 46 * mm, 22 * mm, 22 * mm, 22 * mm, 22 * mm, 22 * mm, 24 * mm]

    perf_table_data = [[Paragraph(h, th_style) for h in perf_headers]]
    perf_rows = data.get("performance_overview", []) if isinstance(data, dict) else []
    if not perf_rows:
        perf_table_data.append([Paragraph("No performance data found", td_style)] + [Paragraph("", td_style)] * 7)
    else:
        for idx, r in enumerate(perf_rows, start=1):
            perf_table_data.append([
                Paragraph(str(idx), td_style),
                Paragraph(str(r.get("telecaller", "-")), td_left),
                Paragraph(str(r.get("total_leads", 0)), td_style),
                Paragraph(str(r.get("calls_made", 0)), td_style),
                Paragraph(str(r.get("connected", 0)), td_style),
                Paragraph(str(r.get("missed_followup", 0)), td_style),
                Paragraph(str(r.get("conversion", 0)), td_style),
                Paragraph(f"{r.get('rating')}%" if str(r.get('rating', '')).isdigit() else str(r.get('rating') or '0%'), td_style)
            ])

    t_perf = Table(perf_table_data, colWidths=perf_widths, repeatRows=1)
    t_perf.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_PURPLE),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, CARD_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(t_perf)

    # Build PDF
    doc.build(elements, canvasmaker=NumberedCanvas)
