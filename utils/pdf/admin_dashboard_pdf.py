import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.pdfgen import canvas
from datetime import datetime

try:
    from django.utils import timezone
    def get_current_time_str():
        try:
            return timezone.now().strftime('%d %b %Y, %I:%M %p')
        except Exception:
            return datetime.now().strftime('%d %b %Y, %I:%M %p')
except Exception:
    def get_current_time_str():
        return datetime.now().strftime('%d %b %Y, %I:%M %p')


# ── Color Palette (Harmonious Light Green Brand Theme) ────────────────────────
PRIMARY_GREEN = colors.HexColor('#76B900')   # Company Main Lite Green: Title, KPI Counts, Footer Left Bar
DEEP_GREEN    = colors.HexColor('#14532D')   # Deep Forest Green: Table Headers, Section Titles, Accent Bar
MID_GREEN     = colors.HexColor('#166534')   # Emerald Green: Metadata values, Subtitles
CARD_BG       = colors.HexColor('#F8FAFC')   # Soft Card Background
BORDER_COLOR  = colors.HexColor('#E2E8F0')   # Light Clean Border
TEXT_DARK     = colors.HexColor('#0F172A')   # Main dark/black text
TEXT_MUTED    = colors.HexColor('#64748B')   # Subtitles, KPI labels, secondary text
ROW_ALT       = colors.HexColor('#F0FDF4')   # Alternating row background (Fresh Mint Tint)
STATUS_AMBER  = colors.HexColor('#D97706')   # Pending status highlight


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and print 'Page X of Y' on every page
    with dual-color bottom accent bar (50% Lite Green + 50% Deep Forest Green).
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
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        self.saveState()
        w, _ = A4

        # Dual-color Accent Bar at bottom (50% Lite Green + 50% Deep Forest Green)
        bar_y = 5 * mm
        bar_h = 2.2 * mm
        half_w = (w - 20 * mm) / 2
        self.setFillColor(PRIMARY_GREEN)
        self.rect(10 * mm, bar_y, half_w, bar_h, fill=True, stroke=False)
        self.setFillColor(DEEP_GREEN)
        self.rect(10 * mm + half_w, bar_y, half_w, bar_h, fill=True, stroke=False)

        # Footer text (Generation date & Dynamic Page X of Y)
        self.setFont("Helvetica", 7.5)
        self.setFillColor(TEXT_MUTED)
        now_str = get_current_time_str()
        self.drawString(10 * mm, 8.5 * mm, f"Admin Dashboard Report • Generated on {now_str}")
        self.drawRightString(w - 10 * mm, 8.5 * mm, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


def _format_metric_val(key, m_item):
    if isinstance(m_item, dict):
        raw_val = m_item.get("value", 0)
    else:
        raw_val = m_item if m_item is not None else 0

    if key == "conversion_rate":
        return f"{raw_val}%"
    elif key == "pending_payment":
        if isinstance(raw_val, (int, float)):
            return f"Rs. {raw_val:,.0f}" if raw_val == int(raw_val) else f"Rs. {raw_val:,.2f}"
        val_str = str(raw_val).strip()
        if not val_str.startswith("Rs.") and not val_str.startswith("₹"):
            return f"Rs. {val_str}"
        return val_str.replace("₹", "Rs. ")
    else:
        if isinstance(raw_val, (int, float)):
            return f"{raw_val:,}"
        return str(raw_val)


def generate_admin_dashboard_pdf(file_path, data, user=None):
    """
    Generates Admin Dashboard PDF with compact, well-proportioned layout (no wasted extra space):
    1. Header ("Dashboard Report") & Compact Metadata (Organisation, Filter, Exported By)
    2. Performance Overview (8 KPI Cards in 4x2 grid container)
    3. Table 1: Missed Follow Up List (Deep Forest Green Header, No Flag column)
    4. Table 2: Pending Payment List (Deep Forest Green Header, Clear Financials)
    5. Table 3: Telecaller Performance Overview (Deep Forest Green Header)
    6. Natural page flow (no forced pagebreak) with keepWithNext on headers
    """
    doc = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        leftMargin=10 * mm,
        rightMargin=10 * mm,
        topMargin=8 * mm,
        bottomMargin=12 * mm
    )
    usable_w = A4[0] - 20 * mm  # ~190mm

    # Typography & Styles (Tight, High-Density Executive Layout)
    title_style      = ParagraphStyle('Title', fontName='Helvetica-Bold', fontSize=15, textColor=PRIMARY_GREEN, leading=18)
    meta_style       = ParagraphStyle('Meta', fontName='Helvetica', fontSize=8, textColor=TEXT_DARK, leading=11)

    card_title_style = ParagraphStyle('CardTitle', fontName='Helvetica-Bold', fontSize=9.5, textColor=TEXT_DARK, alignment=1, leading=12)
    card_sub_style   = ParagraphStyle('CardSub', fontName='Helvetica-Bold', fontSize=6.5, textColor=MID_GREEN, alignment=1, leading=8)
    kpi_label_style  = ParagraphStyle('KpiLbl', fontName='Helvetica', fontSize=6.5, textColor=TEXT_MUTED, alignment=1, leading=8)
    kpi_val_style    = ParagraphStyle('KpiVal', fontName='Helvetica-Bold', fontSize=11, textColor=PRIMARY_GREEN, alignment=1, leading=13)

    sec_title_style  = ParagraphStyle('SecTitle', fontName='Helvetica-Bold', fontSize=8.5, textColor=DEEP_GREEN, leading=11, keepWithNext=True)
    th_style         = ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=7, textColor=colors.white, alignment=1, leading=8.5)
    td_style         = ParagraphStyle('TD', fontName='Helvetica', fontSize=6.5, textColor=TEXT_DARK, alignment=1, leading=8)
    td_left          = ParagraphStyle('TDL', fontName='Helvetica', fontSize=6.5, textColor=TEXT_DARK, alignment=0, leading=8)
    td_pending       = ParagraphStyle('TDP', fontName='Helvetica-Bold', fontSize=6.5, textColor=STATUS_AMBER, alignment=1, leading=8)

    elements = []

    # ── 1. Header & Metadata ──────────────────────────────────────────────────
    elements.append(Paragraph("Dashboard Report", title_style))
    elements.append(Spacer(1, 2 * mm))

    # Resolve Organization
    org_obj = getattr(user, 'organization', None)
    org_display = (
        (data.get('organization_name') if isinstance(data, dict) else None) or
        getattr(org_obj, 'organization_name', None) or
        getattr(org_obj, 'display_name', None) or
        getattr(org_obj, 'name', None) or
        "CRM System"
    )
    filter_label = data.get('date_filter_label') or "Yearly"

    # Resolve User Name & Role
    user_name = (data.get('generated_for') if isinstance(data, dict) else None) or getattr(user, 'username', 'Admin')
    role_val = data.get('role') if isinstance(data, dict) else None
    if not role_val and user:
        r = getattr(user, 'role', None)
        role_val = getattr(r, 'name', None) or (str(r) if r else 'Admin')
    role = role_val or "Admin"

    meta_tbl = Table([
        [Paragraph(f"<b>Organisation Name :</b> <font color='#166534'><b>{org_display}</b></font>", meta_style)],
        [Paragraph(f"<b>Filter :</b> <font color='#166534'><b>{filter_label}</b></font>", meta_style)],
        [Paragraph(f"<b>Exported By :</b> <font color='#166534'><b>{user_name} ({role})</b></font>", meta_style)],
    ], colWidths=[usable_w])
    meta_tbl.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 0.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(meta_tbl)
    elements.append(Spacer(1, 2.5 * mm))

    # ── 2. Performance Overview (8 KPI Cards in 4x2 Grid Container) ───────────
    metrics = data.get("metrics", {}) if isinstance(data, dict) else {}
    kpi_defs = [
        ("Total Leads", "total_leads"),
        ("Calls Made", "calls_made"),
        ("Follow - Up", "follow_up"),
        ("Missed Follow Up", "missed_follow_up"),
        ("Converted Leads", "converted_leads"),
        ("Loss Leads", "loss_leads"),
        ("Conversion Rate", "conversion_rate"),
        ("Pending Payment", "pending_payment"),
    ]

    kpi_cells = []
    for label, key in kpi_defs:
        m_item = metrics.get(key, {})
        val_str = _format_metric_val(key, m_item)
        kpi_cells.append([
            Paragraph(label, kpi_label_style),
            Spacer(1, 0.5 * mm),
            Paragraph(val_str, kpi_val_style)
        ])

    col_w4 = (usable_w - 6 * mm) / 4
    kpi_inner_tbl = Table([kpi_cells[0:4], kpi_cells[4:8]], colWidths=[col_w4] * 4)
    kpi_inner_tbl.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 1.5 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.5 * mm),
    ]))

    perf_card = Table([
        [Paragraph("Performance Overview", card_title_style)],
        [Paragraph("Here is an overview of your team's performance", card_sub_style)],
        [kpi_inner_tbl]
    ], colWidths=[usable_w])
    perf_card.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 0.8, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, 1), 1 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, 1), 0.5 * mm),
        ('BOTTOMPADDING', (0, 2), (0, 2), 1.5 * mm),
    ]))
    elements.append(perf_card)
    elements.append(Spacer(1, 2.5 * mm))

    # ── 3. TABLE 1: Missed Follow Up List ─────────────────────────────────────
    elements.append(Paragraph("<b>1. Missed Follow Up List</b>", sec_title_style))
    elements.append(Spacer(1, 1 * mm))

    missed_headers = ["S.No", "Student Name", "Mobile Number", "Lead Stage", "Follow up date", "Telecaller"]
    m_widths = [10 * mm, 44 * mm, 34 * mm, 32 * mm, 32 * mm, 38 * mm]

    m_table_data = [[Paragraph(h, th_style) for h in missed_headers]]
    missed_rows = data.get("missed_followups", []) if isinstance(data, dict) else []
    if not missed_rows:
        m_table_data.append([Paragraph("No missed follow-ups found", td_style)] + [Paragraph("-", td_style)] * 5)
    else:
        for idx, r in enumerate(missed_rows, start=1):
            m_table_data.append([
                Paragraph(str(idx), td_style),
                Paragraph(str(r.get("student_name") or "-"), td_left),
                Paragraph(str(r.get("mobile_number") or r.get("mobile_no") or "-"), td_style),
                Paragraph(str(r.get("lead_stage") or "Follow Up"), td_style),
                Paragraph(str(r.get("follow_up_date") or "-"), td_style),
                Paragraph(str(r.get("telecaller") or "Unassigned"), td_left)
            ])

    t_missed = Table(m_table_data, colWidths=m_widths, repeatRows=1)
    t_missed_style = [
        ('BACKGROUND', (0, 0), (-1, 0), DEEP_GREEN),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 1.2 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.2 * mm),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DCFCE7')),
    ]
    for idx in range(1, len(m_table_data)):
        if idx % 2 == 0:
            t_missed_style.append(('BACKGROUND', (0, idx), (-1, idx), ROW_ALT))
        else:
            t_missed_style.append(('BACKGROUND', (0, idx), (-1, idx), colors.white))
    t_missed.setStyle(TableStyle(t_missed_style))
    elements.append(t_missed)
    elements.append(Spacer(1, 2.5 * mm))

    # ── 4. TABLE 2: Pending Payment List ──────────────────────────────────────
    elements.append(Paragraph("<b>2. Pending Payment List</b>", sec_title_style))
    elements.append(Spacer(1, 1 * mm))

    pay_headers = ["S.No", "Student Name", "Course", "Amount (Rs.)", "Due Date", "Status", "Telecaller"]
    pay_widths = [10 * mm, 38 * mm, 38 * mm, 26 * mm, 26 * mm, 20 * mm, 32 * mm]

    pay_table_data = [[Paragraph(h, th_style) for h in pay_headers]]
    pay_rows = data.get("pending_payments", []) if isinstance(data, dict) else []
    if not pay_rows:
        pay_table_data.append([Paragraph("No pending payments found", td_style)] + [Paragraph("-", td_style)] * 6)
    else:
        for idx, p in enumerate(pay_rows, start=1):
            amt = p.get("amount", 0)
            amt_str = f"Rs. {amt:,}" if isinstance(amt, (int, float)) else str(amt)
            pay_table_data.append([
                Paragraph(str(idx), td_style),
                Paragraph(str(p.get("student_name") or "-"), td_left),
                Paragraph(str(p.get("course") or "-"), td_left),
                Paragraph(amt_str, td_style),
                Paragraph(str(p.get("due_date") or "-"), td_style),
                Paragraph(str(p.get("status") or "Pending"), td_pending),
                Paragraph(str(p.get("telecaller") or "-"), td_left)
            ])

    t_pay = Table(pay_table_data, colWidths=pay_widths, repeatRows=1)
    t_pay_style = [
        ('BACKGROUND', (0, 0), (-1, 0), DEEP_GREEN),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 1.2 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.2 * mm),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DCFCE7')),
    ]
    for idx in range(1, len(pay_table_data)):
        if idx % 2 == 0:
            t_pay_style.append(('BACKGROUND', (0, idx), (-1, idx), ROW_ALT))
        else:
            t_pay_style.append(('BACKGROUND', (0, idx), (-1, idx), colors.white))
    t_pay.setStyle(TableStyle(t_pay_style))
    elements.append(t_pay)
    elements.append(Spacer(1, 2.5 * mm))

    # ── 5. TABLE 3: Telecaller Performance Overview ───────────────────────────
    elements.append(Paragraph("<b>3. Telecaller Performance Overview</b>", sec_title_style))
    elements.append(Spacer(1, 1 * mm))

    perf_headers = ["S.No", "Telecaller", "Total Leads", "Calls Made", "Connected", "Missed F/U", "Conversion", "Rating"]
    perf_widths = [10 * mm, 42 * mm, 24 * mm, 24 * mm, 24 * mm, 24 * mm, 22 * mm, 20 * mm]

    perf_table_data = [[Paragraph(h, th_style) for h in perf_headers]]
    perf_rows = data.get("performance_overview", []) if isinstance(data, dict) else []
    if not perf_rows:
        perf_table_data.append([Paragraph("No performance data found", td_style)] + [Paragraph("-", td_style)] * 7)
    else:
        for idx, r in enumerate(perf_rows, start=1):
            rating_val = str(r.get('rating') or '0%')
            if rating_val.isdigit():
                rating_val = f"{rating_val}%"
            perf_table_data.append([
                Paragraph(str(idx), td_style),
                Paragraph(str(r.get("telecaller") or "-"), td_left),
                Paragraph(str(r.get("total_leads", 0)), td_style),
                Paragraph(str(r.get("calls_made", 0)), td_style),
                Paragraph(str(r.get("connected", 0)), td_style),
                Paragraph(str(r.get("missed_followup", 0)), td_style),
                Paragraph(str(r.get("conversion", 0)), td_style),
                Paragraph(rating_val, td_style)
            ])

    t_perf = Table(perf_table_data, colWidths=perf_widths, repeatRows=1)
    t_perf_style = [
        ('BACKGROUND', (0, 0), (-1, 0), DEEP_GREEN),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 1.2 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.2 * mm),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DCFCE7')),
    ]
    for idx in range(1, len(perf_table_data)):
        if idx % 2 == 0:
            t_perf_style.append(('BACKGROUND', (0, idx), (-1, idx), ROW_ALT))
        else:
            t_perf_style.append(('BACKGROUND', (0, idx), (-1, idx), colors.white))
    t_perf.setStyle(TableStyle(t_perf_style))
    elements.append(t_perf)

    # ── 6. Build Document with NumberedCanvas ──────────────────────────────────
    doc.build(elements, canvasmaker=NumberedCanvas)
