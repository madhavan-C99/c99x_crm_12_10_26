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
        self.drawString(10 * mm, 8.5 * mm, f"Telecalling Dashboard Report • Generated on {now_str}")
        self.drawRightString(w - 10 * mm, 8.5 * mm, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


def generate_telecalling_dashboard_pdf(file_path, data, user=None):
    """
    Generates Telecalling Dashboard PDF with compact, well-proportioned layout (no wasted extra space):
    1. Header & Compact Metadata (Organisation, Filter, Exported By in Green brand)
    2. Performance Overview (8 KPI Cards in 4x2 grid container)
    3. Lead Pipeline (Stage breakdown in compact card)
    4. Team Performance Table (Solid Deep Forest Green Header)
    5. Enrollment by Courses Table (Solid Deep Forest Green Header)
    6. Natural page flow without unnecessary gaps
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

    # Typography & Styles (Brand Green Harmony, Tight Compact Spacing)
    title_style      = ParagraphStyle('Title', fontName='Helvetica-Bold', fontSize=15, textColor=PRIMARY_GREEN, leading=18)
    meta_style       = ParagraphStyle('Meta', fontName='Helvetica', fontSize=8, textColor=TEXT_DARK, leading=11)

    card_title_style = ParagraphStyle('CardTitle', fontName='Helvetica-Bold', fontSize=9.5, textColor=TEXT_DARK, alignment=1, leading=12)
    card_sub_style   = ParagraphStyle('CardSub', fontName='Helvetica-Bold', fontSize=6.5, textColor=MID_GREEN, alignment=1, leading=8)
    kpi_label_style  = ParagraphStyle('KpiLbl', fontName='Helvetica', fontSize=6.5, textColor=TEXT_MUTED, alignment=1, leading=8)
    kpi_val_style    = ParagraphStyle('KpiVal', fontName='Helvetica-Bold', fontSize=11, textColor=PRIMARY_GREEN, alignment=1, leading=13)

    sec_title_style  = ParagraphStyle('SecTitle', fontName='Helvetica-Bold', fontSize=8.5, textColor=DEEP_GREEN, leading=11, keepWithNext=True)
    th_style         = ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white, alignment=1, leading=9)
    td_style         = ParagraphStyle('TD', fontName='Helvetica', fontSize=7, textColor=TEXT_DARK, alignment=1, leading=8.5)
    td_left          = ParagraphStyle('TDL', fontName='Helvetica', fontSize=7, textColor=TEXT_DARK, alignment=0, leading=8.5)

    elements = []

    # ── 1. Header & Metadata (No Greeting) ────────────────────────────────────
    elements.append(Paragraph("Dashboard Report", title_style))
    elements.append(Spacer(1, 2 * mm))

    org_obj = getattr(user, 'organization', None)
    org_display = (
        (data.get('organization_name') if isinstance(data, dict) else None) or
        getattr(org_obj, 'organization_name', None) or
        getattr(org_obj, 'display_name', None) or
        getattr(org_obj, 'name', None) or
        "CRM System"
    )
    filter_label = data.get('date_filter_label') or "Yearly"

    user_name = (data.get('generated_for') if isinstance(data, dict) else None) or (getattr(user, 'username', 'Bharath') if user else 'Bharath')
    role_val = data.get('role') if isinstance(data, dict) else None
    if not role_val and user:
        r = getattr(user, 'role', None)
        role_val = getattr(r, 'name', None) or (str(r) if r else 'Executive')
    role = role_val or "Executive"

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
    stats = data.get('stats_cards', [])
    stat_map = {s.get('label'): s.get('value', '0') for s in stats}
    if 'Call Not Connected' not in stat_map:
        stat_map['Call Not Connected'] = stat_map.get('Missed Follow Up', '0')
    if 'Won Leads' not in stat_map:
        stat_map['Won Leads'] = stat_map.get('Won', '0')
    if 'Lost Leads' not in stat_map:
        stat_map['Lost Leads'] = stat_map.get('Loss', '0')
    if 'Unreached Calls' not in stat_map:
        stat_map['Unreached Calls'] = stat_map.get('Track', '0')

    top_labels = ['Total Leads', 'New Lead', 'Call Not Connected', 'Follow Up', 'Unreached Calls', 'Won Leads', 'Lost Leads', 'Pending Payments']
    kpi_cells = []
    for lbl in top_labels:
        val = str(stat_map.get(lbl, '0'))
        if lbl == 'Pending Payments':
            if not val.startswith('Rs.') and not val.startswith('₹'):
                val = f"Rs. {val}"
            elif val.startswith('₹'):
                val = val.replace('₹', 'Rs. ')
        kpi_cells.append([Paragraph(lbl, kpi_label_style), Spacer(1, 0.5 * mm), Paragraph(val, kpi_val_style)])

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

    # ── 3. Lead Pipeline Card ─────────────────────────────────────────────────
    funnel = data.get('pipeline', {}).get('funnel', [])
    if not funnel:
        funnel = [
            {'stage_name': 'Total Leads', 'count': stat_map.get('Total Leads', '0'), 'percentage': '100.0%'},
            {'stage_name': 'New Leads', 'count': stat_map.get('New Lead', '0'), 'percentage': '0.0%'},
            {'stage_name': '1st Time Not Picked', 'count': '0', 'percentage': '0.0%'},
            {'stage_name': 'Follow Up', 'count': stat_map.get('Follow Up', '0'), 'percentage': '0.0%'},
            {'stage_name': 'Unreached Calls', 'count': stat_map.get('Unreached Calls', '0'), 'percentage': '0.0%'},
            {'stage_name': 'Won', 'count': stat_map.get('Won Leads', '0'), 'percentage': '0.0%'},
            {'stage_name': 'Loss', 'count': stat_map.get('Lost Leads', '0'), 'percentage': '0.0%'},
        ]

    pipe_rows = []
    for item in funnel:
        stage = item.get('stage_name') or item.get('label') or ''
        cnt = str(item.get('count', item.get('value', '0')))
        pct = str(item.get('percentage', '0.0%'))
        if not pct.endswith('%'):
            pct = f"{pct}%"
        pipe_rows.append([Paragraph(stage, td_left), Paragraph(f"<b>{cnt}</b>", td_style), Paragraph(pct, td_style)])

    pipe_inner = Table(pipe_rows, colWidths=[usable_w * 0.65, usable_w * 0.17, usable_w * 0.18])
    pipe_inner.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 1 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1 * mm),
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.HexColor('#DCFCE7')),
    ]))

    pipe_card = Table([
        [Paragraph("Lead Pipeline", card_title_style)],
        [Paragraph("Stage-wise breakdown of leads", card_sub_style)],
        [pipe_inner]
    ], colWidths=[usable_w])
    pipe_card.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 0.8, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, 1), 1 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, 1), 0.5 * mm),
        ('BOTTOMPADDING', (0, 2), (0, 2), 1.5 * mm),
        ('LEFTPADDING', (0, 2), (0, 2), 3 * mm),
        ('RIGHTPADDING', (0, 2), (0, 2), 3 * mm),
    ]))
    elements.append(pipe_card)
    elements.append(Spacer(1, 2.5 * mm))

    # ── 4. Team Performance Table (Solid Deep Forest Green Header) ────────────
    elements.append(Paragraph("<b>Team Performance</b>", sec_title_style))
    elements.append(Spacer(1, 1 * mm))

    perf = data.get('performance', {})
    cr = perf.get('contact_rate', '0')
    cr_str = f"{cr}%" if not str(cr).endswith('%') else str(cr)
    perf_tr = [
        perf.get('first_name', user_name),
        perf.get('role_name', role),
        str(perf.get('total_leads', 0)),
        str(perf.get('contacted', 0)),
        str(perf.get('won_leads', 0)),
        str(perf.get('lost_leads', 0)),
        cr_str
    ]
    perf_th = ['Name', 'Role', 'Total Leads', 'Contacted', 'Won', 'Lost', 'Contact Rate']
    perf_tbl = Table([
        [Paragraph(h, th_style) for h in perf_th],
        [Paragraph(v, td_style) for v in perf_tr]
    ], colWidths=[usable_w / 7] * 7)
    perf_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DEEP_GREEN),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 1.5 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.5 * mm),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DCFCE7')),
        ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ]))
    elements.append(perf_tbl)
    elements.append(Spacer(1, 2.5 * mm))

    # ── 5. Enrollment by Courses Table (Solid Deep Forest Green Header) ───────
    elements.append(Paragraph("<b>Enrollment by Courses</b>", sec_title_style))
    elements.append(Spacer(1, 1 * mm))

    courses = data.get('enrollment_by_courses', [])
    course_th = ['Course', 'Count', 'Percentage']
    course_rows = [[Paragraph(h, th_style) for h in course_th]]

    for idx, c in enumerate(courses, start=1):
        c_name = c.get('label') or c.get('course_name') or ''
        c_val = str(c.get('value', 0))
        c_pct = str(c.get('percentage', '0.00%'))
        if not c_pct.endswith('%'):
            c_pct = f"{c_pct}%"
        course_rows.append([Paragraph(c_name, td_left), Paragraph(c_val, td_style), Paragraph(c_pct, td_style)])

    c_w = [usable_w * 0.60, usable_w * 0.20, usable_w * 0.20]
    course_tbl = Table(course_rows, colWidths=c_w)
    c_style = [
        ('BACKGROUND', (0, 0), (-1, 0), DEEP_GREEN),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 1.3 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.3 * mm),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DCFCE7')),
    ]
    for idx in range(1, len(course_rows)):
        if idx % 2 == 0:
            c_style.append(('BACKGROUND', (0, idx), (-1, idx), ROW_ALT))
        else:
            c_style.append(('BACKGROUND', (0, idx), (-1, idx), colors.white))
    course_tbl.setStyle(TableStyle(c_style))
    elements.append(course_tbl)

    # ── 6. Build Document with NumberedCanvas ──────────────────────────────────
    doc.build(elements, canvasmaker=NumberedCanvas)
