from django.utils import timezone

def to_ist(dt, fmt="%Y-%m-%d %I:%M %p"):
    """
    Converts a UTC/aware datetime object to Indian Standard Time (Asia/Kolkata).
    
    Examples:
      to_ist(record.created_at) -> "2026-11-02 07:29 PM"
      to_ist(record.created_at, "%Y-%m-%d %H:%M:%S") -> "2026-11-02 19:29:32"
      to_ist(record.created_at, None) -> datetime object in Asia/Kolkata timezone
    """
    if not dt:
        return ""
    try:
        local_dt = timezone.localtime(dt)
        if fmt:
            return local_dt.strftime(fmt)
        return local_dt
    except Exception:
        return str(dt)


def to_ist_iso(dt):
    """
    Converts datetime to ISO string with Indian timezone offset (+05:30).
    Example: "2026-11-02T19:29:32.916290+05:30"
    """
    if not dt:
        return None
    try:
        return timezone.localtime(dt).isoformat()
    except Exception:
        return str(dt)
