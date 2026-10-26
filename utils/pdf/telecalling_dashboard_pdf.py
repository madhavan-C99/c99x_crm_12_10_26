import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

# ── Color Palette ─────────────────────────────────────────────────────────────
PRIMARY_GREEN = colors.HexColor('#76B900')   # Title, KPI Counts, Footer Accent
BRAND_PURPLE  = colors.HexColor('#581C87')   # Table Headers, Accent Bar
PURPLE_TEXT   = colors.HexColor('#6B21A8')   # Meta values, Card Subtitles
CARD_BG       = colors.HexColor('#F8FAFC')   # Soft Card Background
BORDER_COLOR  = colors.HexColor('#E2E8F0')   # Light borders
TEXT_DARK     = colors.HexColor('#1E293B')   # Main dark text
TEXT_MUTED    = colors.HexColor('#64748B')   # Subtitles, KPI labels
ROW_ALT       = colors.HexColor('#F8FAFC')   # Alternating table rows


def generate_telecalling_dashboard_pdf(file_path, data, user=None):
    """
    Generates Telecalling Dashboard PDF matching the exact Executive layout:
    1. Header & Greeting
    2. Performance Overview (4x2 KPI Cards)
    3. Lead Pipeline (Stage breakdown)
    4. Team Performance Table (Solid Purple Header)
    5. Enrollment by Courses Table (Solid Purple Header)
    6. Dual-color Bottom Accent Bar (50% Green + 50% Purple)
    """
    doc = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        leftMargin=12 * mm,
        rightMargin=12 * mm,
        topMargin=12 * mm,
        bottomMargin=14 * mm
    )
    usable_w = A4[0] - 24 * mm  # ~186mm

    # Typography
    title_style = ParagraphStyle('Title', fontName='Helvetica-Bold', fontSize=18, textColor=PRIMARY_GREEN, leading=22)
    meta_style = ParagraphStyle('Meta', fontName='Helvetica', fontSize=9, textColor=TEXT_DARK, leading=14)
    greeting_style = ParagraphStyle('Greet', fontName='Helvetica', fontSize=8.5, textColor=TEXT_DARK, leading=12)

    card_title_style = ParagraphStyle('CardTitle', fontName='Helvetica-Bold', fontSize=11, textColor=TEXT_DARK, alignment=1, leading=14)
    card_sub_style   = ParagraphStyle('CardSub', fontName='Helvetica', fontSize=7.5, textColor=PURPLE_TEXT, alignment=1, leading=10)
    kpi_label_style  = ParagraphStyle('KpiLbl', fontName='Helvetica', fontSize=7.5, textColor=TEXT_MUTED, alignment=1, leading=9)
    kpi_val_style    = ParagraphStyle('KpiVal', fontName='Helvetica-Bold', fontSize=13, textColor=PRIMARY_GREEN, alignment=1, leading=16)

    th_style = ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=8.5, textColor=colors.white, alignment=1, leading=11)
    td_style = ParagraphStyle('TD', fontName='Helvetica', fontSize=8, textColor=TEXT_DARK, alignment=1, leading=10)
    td_left  = ParagraphStyle('TDL', fontName='Helvetica', fontSize=8, textColor=TEXT_DARK, alignment=0, leading=10)

    elements = []

    # ── 1. Header & Greeting ──────────────────────────────────────────────────
    elements.append(Paragraph("Dashboard Report", title_style))
    elements.append(Spacer(1, 4 * mm))

    org_obj = getattr(user, 'organization', None)
    org_display = (
        getattr(org_obj, 'organization_name', None) or
        getattr(org_obj, 'display_name', None) or
        "CRM System"
    )
    filter_label = data.get('date_filter_label') or "Yearly"

    meta_tbl = Table([
        [Paragraph(f"<b>Organisation Name :</b> <font color='#6B21A8'>{org_display}</font>", meta_style)],
        [Paragraph(f"<b>Filter :</b> <font color='#6B21A8'>{filter_label}</font>", meta_style)],
    ], colWidths=[usable_w])
    meta_tbl.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 1),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(meta_tbl)
    elements.append(Spacer(1, 3 * mm))

    user_name = data.get('generated_for') or (getattr(user, 'username', 'Bharath') if user else 'Bharath')
    role = data.get('role') or "Executive"
    greeting = f"Hey there <b><font color='#76B900'>{user_name}({role})</font></b>,<br/><font color='#64748B'>Please review your report for an overview of the latest updates and insights related to your account!</font>"
    elements.append(Paragraph(greeting, greeting_style))
    elements.append(Spacer(1, 4 * mm))

    # ── 2. Performance Overview (8 KPI Cards in 4x2 Grid) ─────────────────────
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
        kpi_cells.append([Paragraph(lbl, kpi_label_style), Spacer(1, 1 * mm), Paragraph(val, kpi_val_style)])

    col_w4 = (usable_w - 8 * mm) / 4
    kpi_inner_tbl = Table([kpi_cells[0:4], kpi_cells[4:8]], colWidths=[col_w4] * 4)
    kpi_inner_tbl.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5 * mm),
    ]))

    perf_card = Table([
        [Paragraph("Performance Overview", card_title_style)],
        [Paragraph("Here is an overview of your team's performance", card_sub_style)],
        [kpi_inner_tbl]
    ], colWidths=[usable_w])
    perf_card.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 0.8, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, 1), 2 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, 1), 1 * mm),
        ('BOTTOMPADDING', (0, 2), (0, 2), 3 * mm),
    ]))
    elements.append(perf_card)
    elements.append(Spacer(1, 4 * mm))

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
        ('TOPPADDING', (0, 0), (-1, -1), 1.5 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.5 * mm),
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.HexColor('#F1F5F9')),
    ]))

    pipe_card = Table([
        [Paragraph("Lead Pipeline", card_title_style)],
        [Paragraph("Stage-wise breakdown of leads", card_sub_style)],
        [pipe_inner]
    ], colWidths=[usable_w])
    pipe_card.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 0.8, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, 1), 2 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, 1), 1 * mm),
        ('BOTTOMPADDING', (0, 2), (0, 2), 3 * mm),
        ('LEFTPADDING', (0, 2), (0, 2), 4 * mm),
        ('RIGHTPADDING', (0, 2), (0, 2), 4 * mm),
    ]))
    elements.append(pipe_card)
    elements.append(Spacer(1, 4 * mm))

    # ── 4. Team Performance Table (Solid Purple Header) ───────────────────────
    elements.append(Paragraph("<b>Team Performance</b>", ParagraphStyle('SecH', fontName='Helvetica-Bold', fontSize=10, textColor=TEXT_DARK, leading=14)))
    elements.append(Spacer(1, 2 * mm))

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
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_PURPLE),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 2 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2 * mm),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ]))
    elements.append(perf_tbl)
    elements.append(Spacer(1, 4 * mm))

    # ── 5. Enrollment by Courses Table (Solid Purple Header) ──────────────────
    elements.append(Paragraph("<b>Enrollment by Courses</b>", ParagraphStyle('SecH2', fontName='Helvetica-Bold', fontSize=10, textColor=TEXT_DARK, leading=14)))
    elements.append(Spacer(1, 2 * mm))

    courses = data.get('enrollment_by_courses', [])
    course_th = ['Course', 'Count', 'Percentage']
    course_rows = [[Paragraph(h, th_style) for h in course_th]]

    ROW_ALT = colors.HexColor('#F8FAFC')
    for i, c in enumerate(courses):
        c_name = c.get('label') or c.get('course_name') or ''
        c_val = str(c.get('value', 0))
        c_pct = str(c.get('percentage', '0.00%'))
        if not c_pct.endswith('%'):
            c_pct = f"{c_pct}%"
        course_rows.append([Paragraph(c_name, td_left), Paragraph(c_val, td_style), Paragraph(c_pct, td_style)])

    c_w = [usable_w * 0.60, usable_w * 0.20, usable_w * 0.20]
    course_tbl = Table(course_rows, colWidths=c_w)
    c_style = [
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_PURPLE),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 1.8 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.8 * mm),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#F1F5F9')),
    ]
    for idx in range(1, len(course_rows)):
        if idx % 2 == 0:
            c_style.append(('BACKGROUND', (0, idx), (-1, idx), ROW_ALT))
    course_tbl.setStyle(TableStyle(c_style))
    elements.append(course_tbl)

    # ── 6. Bottom Dual Color Accent Bar (50% Green + 50% Purple) ──────────────
    def on_page_footer(canvas, doc_obj):
        canvas.saveState()
        pw, _ = A4
        bar_y = 6 * mm
        bar_h = 3 * mm
        half_w = (pw - 24 * mm) / 2
        canvas.setFillColor(PRIMARY_GREEN)
        canvas.rect(12 * mm, bar_y, half_w, bar_h, fill=1, stroke=0)
        canvas.setFillColor(BRAND_PURPLE)
        canvas.rect(12 * mm + half_w, bar_y, half_w, bar_h, fill=1, stroke=0)
        canvas.restoreState()

    doc.build(elements, onFirstPage=on_page_footer, onLaterPages=on_page_footer)
