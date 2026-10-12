from django.conf.urls.static import static 
from django.contrib import admin
from django.conf import settings
from django.urls import path, include
from telecalling.views.whatsapp_view import *

from django.http import HttpResponse

urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('telecalling/', include('telecalling.urls')),
    path('adm/', include('adm.urls')),

    path('api/whatsapp/webhook/', WhatsappWebhook.as_view()),      
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)