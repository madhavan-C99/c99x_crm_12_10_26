import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.pdfgen import canvas
from django.utils import timezone


# ── Color Palette ─────────────────────────────────────────────────────────────
PRIMARY_GREEN = colors.HexColor('#76B900')   # Title, KPI highlights
BRAND_PURPLE  = colors.HexColor('#581C87')   # Table Headers
PURPLE_TEXT   = colors.HexColor('#6B21A8')   # Meta values, subtitles
CARD_BG       = colors.HexColor('#F8FAFC')   # Soft Card Background
BORDER_COLOR  = colors.HexColor('#E2E8F0')   # Light borders
TEXT_DARK     = colors.HexColor('#1E293B')   # Main dark text
TEXT_MUTED    = colors.HexColor('#64748B')   # Subtitles, KPI labels
STATUS_RED    = colors.HexColor('#DC2626')   # Overdue badge text
STATUS_AMBER  = colors.HexColor('#D97706')   # Pending badge text


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and print 'Page X of Y' on every page.
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
        self.setFont("Helvetica", 8)
        self.setFillColor(TEXT_MUTED)

        # Bottom dual-color accent bar
        w, h = A4
        self.setFillColor(PRIMARY_GREEN)
        self.rect(12 * mm, 6 * mm, (w - 24 * mm) / 2, 2, fill=True, stroke=False)
        self.setFillColor(BRAND_PURPLE)
        self.rect(12 * mm + (w - 24 * mm) / 2, 6 * mm, (w - 24 * mm) / 2, 2, fill=True, stroke=False)

        # Footer text
        self.setFillColor(TEXT_MUTED)
        now_str = timezone.now().strftime('%d %b %Y, %I:%M %p')
        self.drawString(12 * mm, 9 * mm, f"Admin Dashboard Report • Generated on {now_str}")
        self.drawRightString(w - 12 * mm, 9 * mm, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


def generate_admin_dashboard_pdf(file_path, data, user=None):
    """
    Generates Admin Dashboard PDF Export:
    1. Header & Organization Meta
    2. Best Performer Highlight Card
    3. Performance Overview Table
    4. Pending Payments Table
    """
    doc = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        leftMargin=12 * mm,
        rightMargin=12 * mm,
        topMargin=12 * mm,
        bottomMargin=16 * mm
    )
    usable_w = A4[0] - 24 * mm  # ~186mm

    # Typography Styles
    title_style     = ParagraphStyle('Title', fontName='Helvetica-Bold', fontSize=18, textColor=PRIMARY_GREEN, leading=22)
    sec_title_style = ParagraphStyle('SecTitle', fontName='Helvetica-Bold', fontSize=12, textColor=BRAND_PURPLE, leading=16)
    meta_style      = ParagraphStyle('Meta', fontName='Helvetica', fontSize=8.5, textColor=TEXT_DARK, leading=13)
    card_title_style= ParagraphStyle('CardTitle', fontName='Helvetica-Bold', fontSize=11, textColor=TEXT_DARK, leading=14)
    kpi_lbl_style   = ParagraphStyle('KpiLbl', fontName='Helvetica', fontSize=8, textColor=TEXT_MUTED, alignment=1, leading=10)
    kpi_val_style   = ParagraphStyle('KpiVal', fontName='Helvetica-Bold', fontSize=13, textColor=PRIMARY_GREEN, alignment=1, leading=16)

    th_style        = ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=8, textColor=colors.white, alignment=1, leading=10)
    td_style        = ParagraphStyle('TD', fontName='Helvetica', fontSize=7.5, textColor=TEXT_DARK, alignment=1, leading=9.5)
    td_left         = ParagraphStyle('TDL', fontName='Helvetica', fontSize=7.5, textColor=TEXT_DARK, alignment=0, leading=9.5)
    td_overdue      = ParagraphStyle('TDO', fontName='Helvetica-Bold', fontSize=7.5, textColor=STATUS_RED, alignment=1, leading=9.5)
    td_pending      = ParagraphStyle('TDP', fontName='Helvetica-Bold', fontSize=7.5, textColor=STATUS_AMBER, alignment=1, leading=9.5)

    elements = []

    # ── 1. Header & Meta ──────────────────────────────────────────────────────
    elements.append(Paragraph("Admin Dashboard Report", title_style))
    elements.append(Spacer(1, 3 * mm))

    org_name = getattr(user, 'organization', None)
    org_display = getattr(org_name, 'name', None) or "Code99 IT Academy"
    filter_info = data.get("filters", {}) if isinstance(data, dict) else {}
    date_filter = filter_info.get("date_filter") or "Today"

    pipeline_label = "Default" if not filter_info.get("pipeline_id") else f"Pipeline #{filter_info.get('pipeline_id')}"
    campaign_label = "All Campaigns" if not filter_info.get("campaign_id") else f"Campaign #{filter_info.get('campaign_id')}"

    meta_tbl = Table([
        [
            Paragraph(f"<b>Organisation :</b> <font color='#6B21A8'>{org_display}</font>", meta_style),
            Paragraph(f"<b>Date Filter :</b> <font color='#6B21A8'>{date_filter}</font>", meta_style),
        ],
        [
            Paragraph(f"<b>Pipeline :</b> <font color='#6B21A8'>{pipeline_label}</font>", meta_style),
            Paragraph(f"<b>Campaign :</b> <font color='#6B21A8'>{campaign_label}</font>", meta_style),
        ]
    ], colWidths=[usable_w * 0.5, usable_w * 0.5])
    meta_tbl.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 1),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(meta_tbl)
    elements.append(Spacer(1, 4 * mm))

    # ── 2. Best Performer Highlight Card ─────────────────────────────────────
    bp = data.get("best_performer", {}) if isinstance(data, dict) else {}
    bp_name = bp.get("name") or "-"
    bp_deals = str(bp.get("deals_closed", 0))
    bp_calls = str(bp.get("calls_made", 0))
    bp_revenue = str(bp.get("revenue") or "₹0")

    col_w4 = (usable_w - 6 * mm) / 4
    bp_kpis = [
        [Paragraph("Best Performer", kpi_lbl_style), Spacer(1, 1 * mm), Paragraph(bp_name, ParagraphStyle('BPN', fontName='Helvetica-Bold', fontSize=10, textColor=BRAND_PURPLE, alignment=1, leading=12))],
        [Paragraph("Deals Closed", kpi_lbl_style), Spacer(1, 1 * mm), Paragraph(bp_deals, kpi_val_style)],
        [Paragraph("Calls Made", kpi_lbl_style), Spacer(1, 1 * mm), Paragraph(bp_calls, kpi_val_style)],
        [Paragraph("Total Revenue", kpi_lbl_style), Spacer(1, 1 * mm), Paragraph(bp_revenue, kpi_val_style)]
    ]
    bp_tbl = Table([[bp_kpis[0], bp_kpis[1], bp_kpis[2], bp_kpis[3]]], colWidths=[col_w4] * 4)
    bp_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 0.8, BORDER_COLOR),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 2 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2 * mm),
    ]))
    elements.append(bp_tbl)
    elements.append(Spacer(1, 5 * mm))

    # ── 3. Performance Overview Table ─────────────────────────────────────────
    elements.append(Paragraph("Performance Overview", sec_title_style))
    elements.append(Spacer(1, 2 * mm))

    perf_headers = ["ID", "Telecaller", "Total Leads", "Calls Made", "Connected", "Missed F/U", "Conversion", "Rating"]
    perf_widths = [10 * mm, 46 * mm, 22 * mm, 22 * mm, 22 * mm, 22 * mm, 22 * mm, 20 * mm]  # Total: 186mm

    perf_table_data = [[Paragraph(h, th_style) for h in perf_headers]]
    perf_rows = data.get("performance_overview", []) if isinstance(data, dict) else []
    if not perf_rows:
        perf_table_data.append([Paragraph("No performance data found for the selected filter", td_style)] + [Paragraph("", td_style)] * 7)
    else:
        for r in perf_rows:
            perf_table_data.append([
                Paragraph(str(r.get("id", "")), td_style),
                Paragraph(str(r.get("telecaller", "-")), td_left),
                Paragraph(str(r.get("total_leads", 0)), td_style),
                Paragraph(str(r.get("calls_made", 0)), td_style),
                Paragraph(str(r.get("connected", 0)), td_style),
                Paragraph(str(r.get("missed_followup", 0)), td_style),
                Paragraph(str(r.get("conversion", 0)), td_style),
                Paragraph(str(r.get("rating", "0%")), ParagraphStyle('Rating', fontName='Helvetica-Bold', fontSize=7.5, textColor=PRIMARY_GREEN, alignment=1)),
            ])

    t_perf = Table(perf_table_data, colWidths=perf_widths, repeatRows=1)
    t_perf.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_PURPLE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, CARD_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(t_perf)
    elements.append(Spacer(1, 5 * mm))

    # ── 4. Pending Payments Table ─────────────────────────────────────────────
    elements.append(Paragraph("Pending Payments List", sec_title_style))
    elements.append(Spacer(1, 2 * mm))

    pay_headers = ["ID", "Student Name", "Course", "Amount (₹)", "Due Date", "Status", "Telecaller"]
    pay_widths = [10 * mm, 36 * mm, 36 * mm, 26 * mm, 24 * mm, 22 * mm, 32 * mm]  # Total: 186mm

    pay_table_data = [[Paragraph(h, th_style) for h in pay_headers]]
    pay_rows = data.get("pending_payments", []) if isinstance(data, dict) else []
    if not pay_rows:
        pay_table_data.append([Paragraph("No pending payments found", td_style)] + [Paragraph("", td_style)] * 6)
    else:
        for p in pay_rows:
            st = str(p.get("status", "Pending"))
            st_style = td_overdue if st.lower() == "overdue" else td_pending

            pay_table_data.append([
                Paragraph(str(p.get("id", "")), td_style),
                Paragraph(str(p.get("student_name", "-")), td_left),
                Paragraph(str(p.get("course", "-")), td_left),
                Paragraph(str(p.get("amount", "0")), ParagraphStyle('Amt', fontName='Helvetica-Bold', fontSize=7.5, textColor=TEXT_DARK, alignment=1)),
                Paragraph(str(p.get("due_date", "-")), td_style),
                Paragraph(st, st_style),
                Paragraph(str(p.get("telecaller", "-")), td_left),
            ])

    t_pay = Table(pay_table_data, colWidths=pay_widths, repeatRows=1)
    t_pay.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_PURPLE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, CARD_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(t_pay)

    # Build Document with NumberedCanvas
    doc.build(elements, canvasmaker=NumberedCanvas)
