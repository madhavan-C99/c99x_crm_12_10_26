import json
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from rest_framework_simplejwt.tokens import UntypedToken

from adm.models import User
from .services.admin_dashboard_services import get_admin_dashboard_payload


class AdminDashboardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_string = self.scope.get("query_string", b"").decode("utf-8")
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]

        if not token:
            print("[WS REJECT] Missing JWT token in WebSocket handshake")
            await self.close(code=4001)
            return

        user = await self.get_user_from_jwt(token)
        if not user:
            print("[WS REJECT] Invalid user or expired token")
            await self.close(code=4003)
            return

        # Check admin or staff permissions
        is_admin = (
            getattr(user, 'is_superuser', False)
            or getattr(user, 'is_staff', False)
            or str(getattr(user, 'user_type', '')).lower() in ['admin', 'team lead', 'team_lead']
        )
        if not is_admin:
            # Check user_roles relation if defined
            has_admin_role = await self.check_admin_role(user)
            if not has_admin_role:
                print(f"[WS REJECT] User {user.username} does not have admin dashboard access")
                await self.close(code=4003)
                return

        self.user = user
        self.group_name = "admin_dashboard"
        self.active_filters = {
            "pipeline_id": None,
            "campaign_id": None,
            "date_filter": "All",
            "from_date": None,
            "to_date": None
        }

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        print(f"✅ [WS CONNECTED] Admin Dashboard WebSocket connected for user: {user.username} (ID: {user.id})")

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        print(f"🔌 [WS DISCONNECTED] Admin Dashboard WebSocket closed (Code: {close_code})")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get("action")

            if action in ["subscribe_dashboard", "filter_change"]:
                self.active_filters["pipeline_id"] = data.get("pipeline_id")
                self.active_filters["campaign_id"] = data.get("campaign_id")
                self.active_filters["date_filter"] = data.get("date_filter") or "All"
                self.active_filters["from_date"] = data.get("from_date")
                self.active_filters["to_date"] = data.get("to_date")

                payload = await sync_to_async(get_admin_dashboard_payload)(
                    self.user,
                    pipeline_id=self.active_filters["pipeline_id"],
                    campaign_id=self.active_filters["campaign_id"],
                    date_filter=self.active_filters["date_filter"],
                    from_date=self.active_filters["from_date"],
                    to_date=self.active_filters["to_date"]
                )

                await self.send(text_data=json.dumps({
                    "action": "dashboard_update",
                    "pipeline_id": self.active_filters["pipeline_id"],
                    "campaign_id": self.active_filters["campaign_id"],
                    "date_filter": self.active_filters["date_filter"],
                    "from_date": self.active_filters["from_date"],
                    "to_date": self.active_filters["to_date"],
                    "payload": payload
                }, default=str))

        except Exception as e:
            print(f"[WS RECEIVE ERROR] {e}")

    async def broadcast_dashboard_update(self, event):
       
        try:
            payload = await sync_to_async(get_admin_dashboard_payload)(
                self.user,
                pipeline_id=self.active_filters.get("pipeline_id"),
                campaign_id=self.active_filters.get("campaign_id"),
                date_filter=self.active_filters.get("date_filter", "All"),
                from_date=self.active_filters.get("from_date"),
                to_date=self.active_filters.get("to_date")
            )

            await self.send(text_data=json.dumps({
                "action": "dashboard_update",
                "pipeline_id": self.active_filters.get("pipeline_id"),
                "campaign_id": self.active_filters.get("campaign_id"),
                "date_filter": self.active_filters.get("date_filter", "All"),
                "from_date": self.active_filters.get("from_date"),
                "to_date": self.active_filters.get("to_date"),
                "payload": payload
            }, default=str))
        except Exception as e:
            print(f"[WS BROADCAST ERROR] {e}")

    @sync_to_async
    def get_user_from_jwt(self, token):
        try:
            decoded = UntypedToken(token)
            uid = decoded.get("user_id") or decoded.get("uid")
            return User.objects.filter(id=uid, is_active=True).first()
        except Exception:
            return None

    @sync_to_async
    def check_admin_role(self, user):
        try:
            return user.user_roles.filter(role__name__in=['admin', 'team_lead', 'manager']).exists()
        except Exception:
            return False
