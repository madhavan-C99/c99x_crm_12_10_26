
import os
import multiprocessing
from pathlib import Path
from datetime import timedelta

import environ
from corsheaders.defaults import default_headers


# =========================================================
# BASE CONFIGURATION
# =========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DJANGO_DEBUG=(bool, False),
    SECURE_SSL_REDIRECT=(bool, True),
)

environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env.bool("DJANGO_DEBUG", default=False)

ENVIRONMENT = env("ENVIRONMENT", default="production")
SITE_URL = env("SITE_URL", default="https://api-crm.c99x.com")

ALLOWED_HOSTS = env.list(
    "DJANGO_ALLOWED_HOSTS",
    default=[
        "127.0.0.1",
        "localhost",
        "crm.c99x.com",
        "api-crm.c99x.com",
    ],
)

# Windows development compatibility
if os.name == "nt":
    try:
        multiprocessing.set_start_method("spawn")
    except RuntimeError:
        pass


# =========================================================
# APPLICATIONS
# =========================================================

INSTALLED_APPS = [
    "daphne",
    "corsheaders",

    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "rest_framework",
    "rest_framework_simplejwt",

    "channels",
    "huey.contrib.djhuey",

    "adm",
    "telecalling",
    "utils",
]


# =========================================================
# MIDDLEWARE
# =========================================================

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "utils.api_log_middleware.APIAuditLogMiddleware",
]


# =========================================================
# URLS / TEMPLATES
# =========================================================

ROOT_URLCONF = "crm_api.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "crm_api.wsgi.application"
ASGI_APPLICATION = "crm_api.asgi.application"


# =========================================================
# DATABASE - POSTGRESQL
# =========================================================

# DATABASES = {
#     "default": {
#         "ENGINE": "django.db.backends.postgresql",
#         "NAME": env("DB_NAME"),
#         "USER": env("DB_USER"),
#         "PASSWORD": env("DB_PASSWORD"),
#         "HOST": env("DB_HOST", default="127.0.0.1"),
#         "PORT": env("DB_PORT", default="2930"),
#         "OPTIONS": {
#             "options": "-c timezone=Asia/Kolkata",
#         },
#         "CONN_MAX_AGE": 60,
#     }
# }


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'c99_check',
        'USER': 'postgres.ghrzxjhikqugbmlaasyn',
        'PASSWORD': 't0iPn27PVWxzqK2u',
        'HOST': 'aws-0-ap-south-1.pooler.supabase.com',
        'PORT': '6543',
        'OPTIONS': {
            'sslmode': 'require',
            'options': '-c timezone=Asia/Kolkata',
        },
    }
}

# =========================================================
# PASSWORD VALIDATION
# =========================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        ),
    },
]


# =========================================================
# CUSTOM USER MODEL
# =========================================================

AUTH_USER_MODEL = "adm.User"


# =========================================================
# DJANGO REST FRAMEWORK
# =========================================================

REST_FRAMEWORK = {
    "EXCEPTION_HANDLER": "utils.exceptions.api_exception_handler",

    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),

    "DEFAULT_AUTHENTICATION_CLASSES": (
        "adm.authentication.SessionJWTAuthentication",
    ),
}


# =========================================================
# SIMPLE JWT
# =========================================================

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=15),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "VERIFYING_KEY": None,
    "AUDIENCE": None,
    "ISSUER": None,
    "AUTH_HEADER_TYPES": ("Bearer", "JWT"),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "uid",
}

ACCESS_TOKEN_GENERIC_LIFETIME = timedelta(days=1)
ACCESS_TOKEN_MOBILE_LIFETIME = timedelta(days=30)


# =========================================================
# CORS
# =========================================================

CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=[
        "https://crm.c99x.com",
    ],
)

CORS_ALLOW_CREDENTIALS = env.bool(
    "CORS_ALLOW_CREDENTIALS",
    default=True,
)

CORS_ALLOW_HEADERS = list(default_headers) + env.list(
    "CORS_ALLOW_HEADERS",
    default=[],
)

CSRF_TRUSTED_ORIGINS = env.list(
    "CSRF_TRUSTED_ORIGINS",
    default=[
        "https://crm.c99x.com",
        "https://api-crm.c99x.com",
    ],
)


# =========================================================
# OTP
# =========================================================

OTP_EXPIRY_SECONDS = env.int(
    "OTP_EXPIRY_SECONDS",
    default=300,
)


# =========================================================
# REDIS CONFIGURATION
# =========================================================

REDIS_HOST = env("REDIS_HOST", default="127.0.0.1")
REDIS_PORT = env.int("REDIS_PORT", default=6379)


# =========================================================
# HUEY BACKGROUND TASKS
# =========================================================

HUEY = {
    "name": "crm_api",
    "result_store": True,
    "events": True,
    "store_none": False,
    "immediate": False,
    "store_errors": True,
    "blocking": False,
    "backend_class": "huey.RedisHuey",
    "connection": {
        "host": REDIS_HOST,
        "port": REDIS_PORT,
        "db": 1,
        "connection_pool": None,
    },
    "consumer": {
        "workers": 4,
        "worker_type": "thread",
        "initial_delay": 0.1,
        "backoff": 1.15,
        "max_delay": 10.0,
        "utc": False,
        "timezone": "Asia/Kolkata",
        "scheduler_interval": 1,
        "periodic": True,
        "check_worker_health": True,
        "health_check_interval": 1,
    },
    "utc": False,
}


# =========================================================
# DJANGO CHANNELS / WEBSOCKETS
# =========================================================

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [
                (REDIS_HOST, REDIS_PORT),
            ],
        },
    },
}


# =========================================================
# EMAIL / SMTP
# =========================================================

EMAIL_HOST = env("EMAIL_HOST", default="smtp.gmail.com")
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")

EMAIL_PORT = env.int("EMAIL_PORT", default=465)
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=False)
EMAIL_USE_SSL = env.bool("EMAIL_USE_SSL", default=True)

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER


# =========================================================
# GOOGLE MAPS
# =========================================================

GOOGLE_MAPS_API_KEY = env(
    "GOOGLE_MAPS_API_KEY",
    default="",
)


# =========================================================
# GOOGLE SHEETS / WEBSITE ENQUIRIES
# =========================================================

GOOGLE_SHEET_WEBHOOK_SECRET = env(
    "GOOGLE_SHEET_WEBHOOK_SECRET",
    default="",
)

GOOGLE_CLIENT_ID = env("GOOGLE_CLIENT_ID", default="")
GOOGLE_CLIENT_SECRET = env("GOOGLE_CLIENT_SECRET", default="")

GOOGLE_SHEET_LEADS_PAUSED = env.bool(
    "GOOGLE_SHEET_LEADS_PAUSED",
    default=False,
)

GOOGLE_SHEET_AUTO_ASSIGN = env.bool(
    "GOOGLE_SHEET_AUTO_ASSIGN",
    default=True,
)


# =========================================================
# META / FACEBOOK LEAD INTEGRATION
# =========================================================

META_APP_ID = env("META_APP_ID", default="")
FB_ENCRYPTION_KEY = env("FB_ENCRYPTION_KEY", default=None)
META_VERIFY_TOKEN = env("META_VERIFY_TOKEN", default="")
META_APP_SECRET = env("META_APP_SECRET", default="")

META_PAGE_ACCESS_TOKEN = env(
    "META_PAGE_ACCESS_TOKEN",
    default="",
)

GRAPH_API_VERSION = env(
    "GRAPH_API_VERSION",
    default="v21.0",
)

META_LEADS_PAUSED = env.bool(
    "META_LEADS_PAUSED",
    default=False,
)

META_AUTO_ASSIGN_ROUND_ROBIN = env.bool(
    "META_AUTO_ASSIGN_ROUND_ROBIN",
    default=True,
)


# =========================================================
# WHATSAPP
# =========================================================

WHATSAPP_ACCESS_TOKEN = env(
    "WHATSAPP_ACCESS_TOKEN",
    default="",
)

WHATSAPP_PHONE_NUMBER_ID = env(
    "WHATSAPP_PHONE_NUMBER_ID",
    default="",
)

WEBHOOK_VERIFY_TOKEN = env(
    "WEBHOOK_VERIFY_TOKEN",
    default="",
)


# =========================================================
# INTERNATIONALIZATION
# =========================================================

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"

USE_I18N = True
USE_TZ = True


# =========================================================
# STATIC FILES
# =========================================================

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"


# =========================================================
# MEDIA FILES
# =========================================================

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DATA_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024


# =========================================================
# DEFAULT PRIMARY KEY
# =========================================================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# =========================================================
# PRODUCTION SECURITY
# =========================================================

SECURE_PROXY_SSL_HEADER = (
    "HTTP_X_FORWARDED_PROTO",
    "https",
)

SECURE_SSL_REDIRECT = env.bool(
    "SECURE_SSL_REDIRECT",
    default=True,
)

SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG

SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

SECURE_HSTS_SECONDS = env.int(
    "SECURE_HSTS_SECONDS",
    default=0,
)

SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False
