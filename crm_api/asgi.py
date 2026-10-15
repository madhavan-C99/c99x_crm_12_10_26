
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_api.settings')

# application = get_asgi_application()
django_asgi_app = get_asgi_application()
# ONLY AFTER Django is ready, import Channels stuff
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import telecalling.routing
import adm.routing


application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            telecalling.routing.websocket_urlpatterns + adm.routing.websocket_urlpatterns
        )
    ),
})