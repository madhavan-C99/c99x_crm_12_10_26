from django.db import models
from telecalling.models.delete_base_model import SafeDeleteModel

class Organization(SafeDeleteModel):
    organization = None
    pipeline = None
    # ── Step 1: Basic Information ──────────────────────────────
    logo                = models.ImageField(upload_to='org_logos/', null=True, blank=True)
    organization_name   = models.CharField(max_length=255)
    display_name        = models.CharField(max_length=255)
    industry_type       = models.CharField(max_length=100, null=True, blank=True)
    company_website     = models.URLField(max_length=255, null=True, blank=True)
    company_description = models.TextField(null=True, blank=True)

    # ── Step 2: Contact Information ────────────────────────────
    address_line_1      = models.CharField(max_length=255)
    address_line_2      = models.CharField(max_length=255, null=True, blank=True)
    city                = models.CharField(max_length=100)
    state               = models.CharField(max_length=100)
    country             = models.CharField(max_length=100, default="India")
    pincode             = models.CharField(max_length=20)
    official_email      = models.EmailField(max_length=255)
    official_contact    = models.CharField(max_length=25)

    # ── Step 3: Business Information ───────────────────────────
    gstin               = models.CharField(max_length=50, null=True, blank=True)
    company_pan         = models.CharField(max_length=50, null=True, blank=True)
    date_format         = models.CharField(max_length=20, default="DD/MM/YYYY")
    time_format         = models.CharField(max_length=20, default="12hrs (AM/PM)")

    # ── Audit Trail ───────────────────────────────────────────
    created_at          = models.DateTimeField(auto_now_add=True, null=True)
    updated_at          = models.DateTimeField(auto_now=True, null=True)
    created_by          = models.CharField(max_length=100, null=True, blank=True)
    updated_by          = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = "adm_organization"
        verbose_name = "Organization"
        verbose_name_plural = "Organizations"

    def __str__(self):
        return self.organization_name
