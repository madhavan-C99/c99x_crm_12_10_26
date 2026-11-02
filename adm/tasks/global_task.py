from adm.models import NotificationTemplate
from rest_framework.exceptions import APIException

def replace_mail_content(key,key_vars):
    replacekey = key
    for key in key_vars:
        replymail = replacekey.replace("@_" + key, str(key_vars[key]))
        replacekey = replymail
    return replymail


def exec_get_raw_mail_subject(mail_key, key_vars=dict()):
    try:
        mail_key = NotificationTemplate.objects.filter(key=mail_key).first()
        if mail_key is not None:
            replaced_mail = replace_mail_content(mail_key.subject, key_vars)
            return str(replaced_mail)
        else:
            raise TypeError('Unable to find mail key.')

    except Exception as e:
        raise APIException(e)
    

def exec_get_raw_mail_content(mail_key, key_vars=dict()):
    try:
        mail_key = NotificationTemplate.objects.filter(key=mail_key).first()
        if mail_key is not None:
            replaced_mail = replace_mail_content(mail_key.html_template_body,key_vars)
            return str(replaced_mail)
        else:
            raise TypeError('Unable to find mail key.')

    except Exception as e:
        raise APIException(e)