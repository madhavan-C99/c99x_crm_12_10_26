from pathlib import Path
from datetime import timedelta
import multiprocessing
import os
from corsheaders.defaults import default_headers, default_methods


if os.name == 'nt':
    multiprocessing.set_start_method('spawn', force=True)
    
# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-5fq5en44!hn66a@t+z-#wx_3+df*+14mtx-oz+85v4oeg2nr-3'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = [
    "*",
    "127.0.0.1",
    "localhost",
    "autopilot-elude-ungloved.ngrok-free.dev",
]

# 🌐 100% CORS Permission Allowed for Frontend
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = list(default_headers) + [
    'authorization',
    'content-type',
    'ngrok-skip-browser-warning',
    'accept',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
 
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://trench-probing-decimeter.ngrok-free.dev",
    "https://unaligned-faceted-gander.ngrok-free.dev",
    "https://autopilot-elude-ungloved.ngrok-free.dev",
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://*.ngrok-free.dev",
    "https://autopilot-elude-ungloved.ngrok-free.dev",
]

# Application definition
INSTALLED_APPS = [
    'daphne',
    'corsheaders',
    'telecalling',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'utils',
    'channels',
    'huey.contrib.djhuey',
    "adm"
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'utils.api_log_middleware.APIAuditLogMiddleware',
]

ROOT_URLCONF = 'crm_api.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

ASGI_APPLICATION = 'crm_api.asgi.application'
WSGI_APPLICATION = 'crm_api.wsgi.application'

# Database
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql_psycopg2',
#         'NAME': 'crm_testing_db',
#         'USER': 'postgres',
#         'PASSWORD': 'Siva@2002',
#         'HOST': 'localhost',
#         'PORT': '5432',
#     }
# }

# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql',
#         'NAME': 'postgres',
#         'USER': 'postgres.ghrzxjhikqugbmlaasyn',
#         'PASSWORD': 't0iPn27PVWxzqK2u',
#         'HOST': 'aws-0-ap-south-1.pooler.supabase.com',
#         'PORT': '6543',
#         'OPTIONS': {
#             'sslmode': 'require',
#             'options': '-c timezone=Asia/Kolkata',
#         },
#     }
# }


# For Testing purpose
EMAIL_HOST ='smtp.gmail.com'
EMAIL_HOST_USER ='manivbharath18888@gmail.com'
# EMAIL_HOST_USER = 
EMAIL_HOST_PASSWORD = "pfpbvriwtvdazljk"
# EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD")
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER


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

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'  # ✅ IST
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'

# 👈 Media files (Excel Exports & Uploads Settings)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# 👈 Upload Limits (Supports up to 20MB files smoothly)
DATA_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024  # 20 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024  # 20 MB

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# Authentication User model
AUTH_USER_MODEL = 'adm.User'

# Rest framework exception handlerr

REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'utils.exceptions.api_exception_handler',
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "adm.authentication.SessionJWTAuthentication",   # pazhaya JWTAuthentication badhila
    ),
}

# SIMPLE JWT Configurations
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=15),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'AUTH_HEADER_TYPES': ('Bearer', 'JWT'),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'uid',
}

ACCESS_TOKEN_GENERIC_LIFETIME = timedelta(days=1)       
ACCESS_TOKEN_MOBILE_LIFETIME = timedelta(days=30)

# Huey Async Tasks
HUEY = {
    'name': 'crm',
    'result_store': True,
    'events': True,
    'store_none': False,
    'immediate': False,
    'store_errors': True,
    'blocking': False,
    'backend_class': 'huey.RedisHuey',
    'connection': {
        'host': 'localhost',
        'port': 6379,
        'db': 1,
        'connection_pool': None,
    },
    'consumer': {
        'workers': 4,
        'worker_type': 'thread',
        'initial_delay': 0.1,
        'backoff': 1.15,
        'max_delay': 10.0,
        'utc': False,
        'timezone': 'Asia/Kolkata',
        'scheduler_interval': 1,
        'periodic': True,
        'check_worker_health': True,
        'health_check_interval': 1,
    },
    'utc': False,
}

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("127.0.0.1", 6379)],
        },
    },
}

WHATSAPP_ACCESS_TOKEN = "EAASZAQf0nOkYBRQhOBDGNiTj7cSXk7dZBHxbVYvBrQPFHZCwtpPHj2dW6Co5Rnnpb0ixKmK5QQZCLsadp7Fk69MB9efgzYvunNloyKRf9LcZA0H3ow1nT60C5ZBEPHluGveO8Ws0FQOH7t5yDumZC4tXj1aHEZAUisByDAQUGCqYXe3rkQhuxZBt5Ry3ZBYbfCnecACAiG3ovontJWGU7rDDA21mmsmABGp6kzjWaUv4H7vEq8onHNZBdN5RKmVsVeCcA8nHZBtKuFpgjiQ5g6gkcI0b5kXb"
WHATSAPP_PHONE_NUMBER_ID = "1082538808272517"
WEBHOOK_VERIFY_TOKEN = "mysecret123"






# """
# Django settings for crm_api project.

# Generated by 'django-admin startproject' using Django 6.0.4.

# For more information on this file, see
# https://docs.djangoproject.com/en/6.0/topics/settings/

# For the full list of settings and their values, see
# https://docs.djangoproject.com/en/6.0/ref/settings/
# """

# from pathlib import Path

# # Build paths inside the project like this: BASE_DIR / 'subdir'.
# BASE_DIR = Path(__file__).resolve().parent.parent


# # Quick-start development settings - unsuitable for production
# # See https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/

# # SECURITY WARNING: keep the secret key used in production secret!
# SECRET_KEY = 'django-insecure-7-jx+ge@i^*&17@3gwvm=)vgta=-=m7487o6m(+sc074v)t*g$'

# # SECURITY WARNING: don't run with debug turned on in production!
# DEBUG = True

# ALLOWED_HOSTS = []


# # Application definition

# INSTALLED_APPS = [
#     'django.contrib.admin',
#     'django.contrib.auth',
#     'django.contrib.contenttypes',
#     'django.contrib.sessions',
#     'django.contrib.messages',
#     'django.contrib.staticfiles',
#     'adm',
#     'telecalling'
# ]

# MIDDLEWARE = [
#     'django.middleware.security.SecurityMiddleware',
#     'django.contrib.sessions.middleware.SessionMiddleware',
#     'django.middleware.common.CommonMiddleware',
#     'django.middleware.csrf.CsrfViewMiddleware',
#     'django.contrib.auth.middleware.AuthenticationMiddleware',
#     'django.contrib.messages.middleware.MessageMiddleware',
#     'django.middleware.clickjacking.XFrameOptionsMiddleware',
# ]

# ROOT_URLCONF = 'crm_api.urls'

# TEMPLATES = [
#     {
#         'BACKEND': 'django.template.backends.django.DjangoTemplates',
#         'DIRS': [],
#         'APP_DIRS': True,
#         'OPTIONS': {
#             'context_processors': [
#                 'django.template.context_processors.request',
#                 'django.contrib.auth.context_processors.auth',
#                 'django.contrib.messages.context_processors.messages',
#             ],
#         },
#     },
# ]

# WSGI_APPLICATION = 'crm_api.wsgi.application'


# # Database
# # https://docs.djangoproject.com/en/6.0/ref/settings/#databases

# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db.sqlite3',
#     }
# }


# # Password validation
# # https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

# AUTH_PASSWORD_VALIDATORS = [
#     {
#         'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
#     },
#     {
#         'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
#     },
#     {
#         'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
#     },
#     {
#         'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
#     },
# ]


# # Internationalization
# # https://docs.djangoproject.com/en/6.0/topics/i18n/

# LANGUAGE_CODE = 'en-us'

# TIME_ZONE = 'UTC'

# USE_I18N = True

# USE_TZ = True


# # Static files (CSS, JavaScript, Images)
# # https://docs.djangoproject.com/en/6.0/howto/static-files/

# STATIC_URL = 'static/'

# ==============================================================================
# META (FACEBOOK / INSTAGRAM) LEAD ADS CONFIGURATION
# ==============================================================================
META_APP_ID = os.getenv("META_APP_ID", "2018600725468029")
FB_ENCRYPTION_KEY = os.getenv("FB_ENCRYPTION_KEY", None)
META_VERIFY_TOKEN = os.getenv("META_VERIFY_TOKEN", "10cc75f752eadd0962b830454c2592e0")
META_APP_SECRET = os.getenv("META_APP_SECRET", "10cc75f752eadd0962b830454c2592e0")
META_PAGE_ACCESS_TOKEN = os.getenv(
    "META_PAGE_ACCESS_TOKEN",
    "EAAT29LyIrh8BSMqgYfewlMfFZA3RVCusnHwnB0VQhF4WITtHqJhOxlnLBZA1ymiwvcjg0ZBlLeh6ZCWenBZAD5IQ6rAMMEg3l1jn2fuGEfkLckRpS8UR5FAhArlQrQBuH69fphpFZCeR4ZBp3vDcv4QPrIJJGycQG5kuqLXDzoQsv1qndnO5nUMcZBugmUXdZCArjePtwZBTkGofMlI4DgX8PTyW4KYvF8tERbrVhy41kZD"
)
GRAPH_API_VERSION = os.getenv("GRAPH_API_VERSION", "v21.0")

# Operational Switches
META_LEADS_PAUSED = False              # Set True to temporarily stop accepting Meta leads
META_AUTO_ASSIGN_ROUND_ROBIN = True     # True = Auto distribute to Telecallers, False = Unassigned Pool

# ==============================================================================
# GOOGLE SHEET / WEBSITE ENQUIRY WEBHOOK CONFIGURATION
# ==============================================================================
GOOGLE_SHEET_WEBHOOK_SECRET = os.getenv("GOOGLE_SHEET_WEBHOOK_SECRET", "MY_GOOGLE_SHEET_CRM_SECRET")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_SHEET_LEADS_PAUSED = False      # Set True to temporarily stop accepting Google Sheet leads
GOOGLE_SHEET_AUTO_ASSIGN = True        # True = Auto distribute to Telecallers, False = Unassigned Pool

