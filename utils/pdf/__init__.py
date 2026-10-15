from .telecalling_dashboard_pdf import generate_telecalling_dashboard_pdf
from .daily_report_pdf import generate_daily_report_pdf
from .admin_dashboard_pdf import generate_admin_dashboard_pdf

# 🚀 Specialized PDF Generators Registry (Single Entity Keys)
SPECIALIZED_PDF_GENERATORS = {
    'telecalling_dashboard': generate_telecalling_dashboard_pdf,
    'daily_report': generate_daily_report_pdf,
    'admin_dashboard': generate_admin_dashboard_pdf,
}

