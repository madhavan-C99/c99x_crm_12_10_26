import logging
from smtplib import SMTPException
from django.conf import settings
from django.core.mail import BadHeaderError, EmailMessage
from django.utils import timezone
from huey.contrib.djhuey import task
from rest_framework.exceptions import APIException
import datetime
from ..models import NotificationTemplate, User
from ..models.notifications_logs import NotificationLogs
from .global_task import exec_get_raw_mail_content, exec_get_raw_mail_subject

logger = logging.getLogger(__name__)


# =====================================================================
# 1. WELCOME EMAIL (Triggered when a new user is created in CRM)
# =====================================================================
def send_welcome_user_mail_handler(
    email_id,
    user_id=None,
    password=None,
    role="User",
    login_url="https://crm.c99x.in/login",
):
    try:
        user = None
        if user_id:
            user = User.objects.filter(id=user_id).first()
        if not user and email_id:
            user = User.objects.filter(email=email_id).first()

        user_name = user.first_name if (user and user.first_name) else (user.username if user else "User")
        org_id = user.organization_id if (user and hasattr(user, "organization_id")) else None

        eml_tmpl = NotificationTemplate.objects.filter(key="CRM_USER_WELCOME").first()
        if not eml_tmpl:
            logger.error("Template 'CRM_USER_WELCOME' not found in database.")
            return "Template CRM_USER_WELCOME not found"

        key_vars = {
            "user_name": user_name,
            "user_email": email_id,
            "password": password or "crm123",
            "role": role or "User",
            "login_url": login_url or "http://localhost:5173/login",
        }

        try:
            subject = exec_get_raw_mail_subject("CRM_USER_WELCOME", key_vars)
            html_message = exec_get_raw_mail_content("CRM_USER_WELCOME", key_vars)
        except Exception:
            subject = eml_tmpl.subject
            html_message = eml_tmpl.html_template_body or eml_tmpl.template_body
            for k, v in key_vars.items():
                subject = subject.replace("@_" + k, str(v))
                html_message = html_message.replace("@_" + k, str(v))

        email_from = getattr(settings, "EMAIL_HOST_USER", "crm@noreply.com")

        email_not_log = NotificationLogs(
            to_ids=email_id,
            subject=subject,
            notification_text=html_message[:1200],
            html_message=html_message[:1200],
            source="crm_user_created",
            sent_by="system",
            status="Pending",
            notification_template_id=eml_tmpl.id,
            user_id=user.id if user else user_id,
            organization_id=org_id,
        )
        email_not_log.save()

        try:
            mail_status = EmailMessage(
                subject,
                html_message,
                email_from,
                [email_id],
            )
            mail_status.content_subtype = "html"
            mail_status.send()

            email_not_log.sent_at = timezone.now()
            email_not_log.status = "Sent"
            email_not_log.save(update_fields=["sent_at", "status"])
            logger.info("[WelcomeEmail] Successfully sent to %s", email_id)
            return "Mail send successfully"

        except BadHeaderError:
            email_not_log.error = "Invalid header found."
            email_not_log.status = "Subject Failed"
            email_not_log.save(update_fields=["error", "status"])
            return "Invalid header"

        except SMTPException as e:
            email_not_log.error = f"There was an error sending an email: {str(e)}"
            email_not_log.status = "SMTP Failed"
            email_not_log.save(update_fields=["error", "status"])
            return f"SMTP Failed: {str(e)}"

        except Exception as e:
            email_not_log.error = f"Unknown Error: {str(e)}"
            email_not_log.status = "Failed"
            email_not_log.save(update_fields=["error", "status"])
            return f"Failed: {str(e)}"

    except Exception as e:
        logger.exception("Error in send_welcome_user_mail_handler: %s", str(e))
        return f"Error: {str(e)}"


@task()
def crm_welcome_user_mail(
    email_id,
    user_id=None,
    password=None,
    role="User",
    login_url="https://crm.c99x.in/login",
):
    """
    Dedicated Task 1: Welcome Email for newly created users with credentials.
    """
    return send_welcome_user_mail_handler(
        email_id=email_id,
        user_id=user_id,
        password=password,
        role=role,
        login_url=login_url,
    )


# =====================================================================
# 2. PASSWORD SETUP COMPLETED EMAIL (Triggered after password setup)
# =====================================================================
def send_account_success_mail_handler(email_id, user_id=None):
    try:
        user = None
        if user_id:
            user = User.objects.filter(id=user_id).first()
        if not user and email_id:
            user = User.objects.filter(email=email_id).first()

        user_name = user.first_name if (user and user.first_name) else (user.username if user else "User")
        org_id = user.organization_id if (user and hasattr(user, "organization_id")) else None

        eml_tmpl = NotificationTemplate.objects.filter(key="PASSWORD_SETUP_COMPLETED").first()
        if not eml_tmpl:
            logger.error("Template 'PASSWORD_SETUP_COMPLETED' not found in database.")
            return "Template PASSWORD_SETUP_COMPLETED not found"

        key_vars = {"user": user_name}

        try:
            subject = exec_get_raw_mail_subject("PASSWORD_SETUP_COMPLETED", key_vars)
            html_message = exec_get_raw_mail_content("PASSWORD_SETUP_COMPLETED", key_vars)
        except Exception:
            subject = eml_tmpl.subject
            html_message = eml_tmpl.html_template_body or eml_tmpl.template_body
            for k, v in key_vars.items():
                subject = subject.replace("@_" + k, str(v))
                html_message = html_message.replace("@_" + k, str(v))

        email_from = getattr(settings, "EMAIL_HOST_USER", "crm@noreply.com")

        email_not_log = NotificationLogs(
            to_ids=email_id,
            subject=subject,
            notification_text=html_message[:1200],
            html_message=html_message[:1200],
            source="finsmiles_account_setup_sucessfully",
            sent_by="system",
            status="Pending",
            notification_template_id=eml_tmpl.id,
            user_id=user.id if user else user_id,
            organization_id=org_id,
        )
        email_not_log.save()

        try:
            mail_status = EmailMessage(
                subject,
                html_message,
                email_from,
                [email_id],
            )
            mail_status.content_subtype = "html"
            mail_status.send()

            email_not_log.sent_at = timezone.now()
            email_not_log.status = "Sent"
            email_not_log.save(update_fields=["sent_at", "status"])
            logger.info("[AccountSuccess] Successfully sent to %s", email_id)
            return "Mail send successfully"

        except BadHeaderError:
            email_not_log.error = "Invalid header found."
            email_not_log.status = "Subject Failed"
            email_not_log.save(update_fields=["error", "status"])
            return "Invalid header"

        except SMTPException as e:
            email_not_log.error = f"There was an error sending an email: {str(e)}"
            email_not_log.status = "SMTP Failed"
            email_not_log.save(update_fields=["error", "status"])
            return f"SMTP Failed: {str(e)}"

        except Exception as e:
            email_not_log.error = f"Unknown Error: {str(e)}"
            email_not_log.status = "Failed"
            email_not_log.save(update_fields=["error", "status"])
            return f"Failed: {str(e)}"

    except Exception as e:
        logger.exception("Error in send_account_success_mail_handler: %s", str(e))
        return f"Error: {str(e)}"


@task()
def crm_account_success_mail(email_id, user_id=None):
    """
    Dedicated Task 2: Password Setup Completed Notification.
    """
    return send_account_success_mail_handler(email_id=email_id, user_id=user_id)
