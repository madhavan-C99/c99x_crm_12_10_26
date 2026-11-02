import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async

from .models.paymentinfo import PaymentFollowUp
from .models.notification import Notification
from .models.leads import Lead
from adm.models.user import User
from adm.models import AdminApprovedLossLead
from adm.services.query_services import exec_raw_sql, delete_exec_raw_sql
from django.conf import settings
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, timedelta
import zoneinfo
from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import UntypedToken




class CourseDetails(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "course_details"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
    
    async def receive(self, text_data):
        data = json.loads(text_data)

        if data.get("action") == "course_details":
            fetch_list = await self.stock_data()

            await self.send(text_data=json.dumps({
                "payload": fetch_list
            },default=str))
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def course_data(self, event):
        course_list = event['data']
        await self.send(text_data=json.dumps({
            'payload': course_list
        }))   
    @sync_to_async
    def stock_data(self):
        data=exec_raw_sql('D_FETCH_ALL_COURSE_DATA',{})
        return data 
    
    
  
  
  
  
  
class ReminderNotificationConsumer(AsyncWebsocketConsumer):

    async def connect(self):
            query_string = self.scope.get("query_string", b"").decode("utf-8")
            query_params = parse_qs(query_string)
            token = query_params.get("token", [None])[0]

            if token:
                user = await self.get_user_from_jwt(token)

                # ✅ active user + organization irukkanum
                if user and getattr(user, "organization_id", None):
                    self.user_id = user.id
                    self.organization_id = user.organization_id
                    self.group_name = f"reminder_user_{self.user_id}"

                    await self.channel_layer.group_add(self.group_name, self.channel_name)
                    await self.accept()
                    print(f"✅ DB Verified: {user.username} (ID: {user.id}) connected to Postgres.")
                else:
                    print("DEBUG: User not found / token invalid / no organization")
                    await self.close()
            else:
                print("DEBUG: No token in Query String")
                await self.close()

    async def receive(self, text_data):
        # ✅ thappaana JSON vandha crash aagaadhu
        try:
            data = json.loads(text_data)
        except ValueError:
            return

        if data.get("action") == "reminder_notification":
            fetch_list = await self.get_user_notifications(self.user_id, self.organization_id)

            await self.send(text_data=json.dumps({
                "payload": fetch_list
            }, default=str))

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
                await self.channel_layer.group_discard(
                    self.group_name,
                    self.channel_name
                )

    async def reminder_notification(self, event):
        print(f"📩 Event received: {event}")
        await self.send(text_data=json.dumps({
            "notification_type": event.get("notification_type"),
            "title":             event.get("title"),
            "message":           event.get("message"),
            "data":              event.get("data"),
        }, default=str))
        print(f"✅ Sent to frontend!")

    async def refresh_remainder(self, event):
        print(f"🔄 Refresh triggered for user: {self.user_id}")

        fetch_list = await self.get_user_notifications(self.user_id, self.organization_id)

        await self.send(text_data=json.dumps({
            "action": "refresh",
            "payload": fetch_list
        }, default=str))
        print("[OK] Unread list refreshed & sent to frontend!")

    @sync_to_async
    def get_user_notifications(self, user_id, organization_id, limit=50):
        """
        Reminders (followup reminder + missed alerts, normal + payment) for a user
        """
        reminder_types = [
            "followup_reminder",
            "missed_followup",
            "payment_followup_reminder",
            "missed_payment_followup",
            "admin_loss_pending_reminder",
            "admin_unassigned_lead_reminder",
            "admin_stale_lead_reminder",
        ]
        
        payment_types = ["payment_followup_reminder", "missed_payment_followup"]

        # attend aana payment follow ups
        attended_payment_ids = PaymentFollowUp.objects.filter(
            is_attended=True
        ).values("id")

        user = User.objects.filter(id=user_id).first()
        is_admin = bool(user and (user.is_superuser or (hasattr(user, 'user_roles') and user.user_roles.filter(role__name__in=['admin', 'org admin', 'superadmin']).exists())))

        base_filter = Q(notification_type__in=reminder_types, is_read=False)
        if organization_id:
            base_filter &= (Q(organization_id=organization_id) | Q(lead__organization_id=organization_id) | Q(lead_id__isnull=True, organization_id__isnull=True))

        admin_only_types = [
            "admin_loss_pending_reminder",
            "admin_unassigned_lead_reminder",
            "admin_stale_lead_reminder",
        ]

        if not is_admin:
            base_filter &= Q(user_id=user_id)
        else:
            # Admin-ku avanga own reminders + admin-specific org reminders mattum show aagum
            base_filter &= (
                Q(user_id=user_id) |
                Q(
                    notification_type__in=admin_only_types,
                    organization_id=organization_id
                )
            )

        notifications = (
            Notification.objects
            .filter(base_filter)
            # attend aana normal follow up alerts hide
            .exclude(follow_up__is_attended=True)
            # attend aana payment follow up alerts hide
            .exclude(
                notification_type__in=payment_types,
                payment_id__in=attended_payment_ids,
            )
            .select_related("follow_up","lead")
            .order_by("-created_at")[:limit]
        )

        return [
            {
                'id': n.id,
                'title': n.title,
                'message': n.message,
                'notification_type': n.notification_type,
                "date": timezone.localtime(n.created_at).strftime("%Y-%m-%d %H:%M:%S") if n.created_at else None,
                "scheduled_remainder": timezone.localtime(n.scheduled_remainder).strftime("%Y-%m-%d %H:%M:%S") if n.scheduled_remainder else None,
                'read': n.is_read,
                'lead_id': n.lead_id or (n.follow_up.lead_id if n.follow_up_id else None),
                'lead_access': _lead_access(n, user_id),
            }
            for n in notifications
        ]

    @sync_to_async
    def get_user_from_jwt(self, token):
        try:
            decoded_data = UntypedToken(token)
            user_id = decoded_data.get("uid") or decoded_data.get("user_id")
            # ✅ active user mattum
            return User.objects.filter(id=user_id, is_active=True).first()
        except Exception as e:
            print(f"[ERROR] JWT Error: {e}")
            return None





def _lead_access(n, user_id):
    """open / loss / reassigned / none"""
    try:
        lead = n.lead
        if lead is None and n.follow_up_id:
            lead = n.follow_up.lead
        if lead is None:
            return "none"
        if AdminApprovedLossLead.objects.filter(lead_id=lead.id).exists():
            return "loss"
        user = User.objects.filter(id=user_id).first()
        is_admin = bool(user and (user.is_superuser or (hasattr(user, 'user_roles') and user.user_roles.filter(role__name__in=['admin', 'org admin', 'superadmin']).exists())))
        if not is_admin and lead.assigned_to_id != user_id:
            return "reassigned"
        return "open"
    except Exception:
        return "open"

class NotificationConsumer(AsyncWebsocketConsumer):

    async def connect(self):
            query_string = self.scope.get("query_string", b"").decode("utf-8")
            query_params = parse_qs(query_string)
            token = query_params.get("token", [None])[0]

            if token:
                user = await self.get_user_from_jwt(token)

                # ✅ active user + organization irukkanum
                if user and getattr(user, "organization_id", None):
                    self.user_id = user.id
                    self.organization_id = user.organization_id
                    self.group_name = f"notif_user_{self.user_id}"

                    await self.channel_layer.group_add(self.group_name, self.channel_name)
                    await self.accept()
                    print(f"[OK] DB Verified: {user.username} (ID: {user.id}) connected to Postgres.")
                else:
                    print("DEBUG: User not found / token invalid / no organization")
                    await self.close()
            else:
                print("DEBUG: No token in Query String")
                await self.close()

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except ValueError:
            return

        if data.get("action") == "notification":
            fetch_list = await self.get_user_notifications(self.user_id, self.organization_id)

            await self.send(text_data=json.dumps({
                "payload": fetch_list
            }, default=str))

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
                await self.channel_layer.group_discard(
                    self.group_name,
                    self.channel_name
                )

    async def notification(self, event):
        print(f"[EVENT] Event received: {event}")
        await self.send(text_data=json.dumps({
            "notification_type": event.get("notification_type"),
            "title":             event.get("title"),
            "message":           event.get("message"),
            "lead_id":           event.get("lead_id"),
            "data":              event.get("data"),
        }, default=str))
        print(f"[OK] Sent to frontend!")

    async def refresh_notifications(self, event):
        print(f"[REFRESH] Refresh triggered for user: {self.user_id}")

        fetch_list = await self.get_user_notifications(self.user_id, self.organization_id)

        await self.send(text_data=json.dumps({
            "action": "refresh",
            "payload": fetch_list
        }, default=str))
        print("[OK] Notification list refreshed & sent to frontend!")


    @sync_to_async
    def get_user_notifications(self, user_id, organization_id, limit=50):
        """
        Main notification bell:
        lead assignment, loss request/result, daily follow-up count.
        Reminder types reminder bell-la mattum varum.
        """
        notification_types = [
            "lead_notification",
            "loss_request_result",
            "loss_request",
            "daily_followup_count",
            "admin_missed_alert",
            "admin_payment_overdue",
            "admin_payment_followup_missed",
        ]

        attended_payment_ids = PaymentFollowUp.objects.filter(
            is_attended=True
        ).values("id")

        user = User.objects.filter(id=user_id).first()
        is_admin = bool(user and (user.is_superuser or (hasattr(user, 'user_roles') and user.user_roles.filter(role__name__in=['admin', 'org admin', 'superadmin']).exists())))

        base_filter = Q(notification_type__in=notification_types, is_read=False)
        if organization_id:
            base_filter &= (
                Q(organization_id=organization_id)
                | Q(lead__organization_id=organization_id)
                | Q(
                    organization_id__isnull=True,
                    lead_id__isnull=True,
                )
            )

        if not is_admin:
            base_filter &= Q(user_id=user_id)
        else:
            base_filter &= (
                Q(user_id=user_id)
                | Q(notification_type__in=[
                    "loss_request",
                    "admin_missed_alert",
                    "admin_payment_overdue",
                    "admin_payment_followup_missed"
                ])
            )

        notifications = (
            Notification.objects
            .filter(base_filter)
            .exclude(
                notification_type="admin_payment_followup_missed",
                payment_id__in=attended_payment_ids,
            )
            .exclude(
                notification_type="admin_missed_alert",
                follow_up__is_attended=True,
            )
            .select_related("follow_up", "lead")
            .order_by("-created_at")[:limit]
        )

        return [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "notification_type": n.notification_type,
                "date": timezone.localtime(n.created_at).strftime("%Y-%m-%d %H:%M:%S") if n.created_at else None,
                "scheduled_remainder": timezone.localtime(n.scheduled_remainder).strftime("%Y-%m-%d %H:%M:%S") if n.scheduled_remainder else None,
                "read": n.is_read,
                "lead_id": (
                    n.lead_id
                    or (
                        n.follow_up.lead_id
                        if n.follow_up_id else None
                    )
                ),
                "lead_access": _lead_access(n, user_id),
            }
            for n in notifications
        ]


    @sync_to_async
    def get_user_from_jwt(self, token):
        try:
            decoded_data = UntypedToken(token)
            user_id = decoded_data.get("uid") or decoded_data.get("user_id")
            return User.objects.filter(id=user_id, is_active=True).first()
        except Exception as e:
            print(f"❌ JWT Error: {e}")
            return None