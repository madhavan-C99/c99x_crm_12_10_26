import base64
import hashlib
from django.conf import settings
from cryptography.fernet import Fernet


def _get_fernet():
    key_material = getattr(settings, "FB_ENCRYPTION_KEY", None) or settings.SECRET_KEY
    derived_key = base64.urlsafe_b64encode(hashlib.sha256(key_material.encode()).digest())
    return Fernet(derived_key)


def encrypt_token(plain_token: str) -> str:
    """Encrypts raw Facebook token before saving to database"""
    if not plain_token:
        return ""
    fernet = _get_fernet()
    return fernet.encrypt(plain_token.encode("utf-8")).decode("utf-8")


def decrypt_token(cipher_token: str) -> str:
    """Decrypts token when needed for Meta Graph API calls"""
    if not cipher_token:
        return ""
    fernet = _get_fernet()
    try:
        return fernet.decrypt(cipher_token.encode("utf-8")).decode("utf-8")
    except Exception:
        return cipher_token
