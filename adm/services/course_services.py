from telecalling.models.courses import CourseName, Course, CoursePlan, CourseTiming
from adm.services.query_services import exec_raw_sql
from rest_framework.exceptions import APIException
from django.db import models
import re
import datetime


def parse_hours(val):
    if not val:
        return None
    m = re.search(r'(\d+(?:\.\d+)?)', str(val))
    return float(m.group(1)) if m else None


def format_duration_display(val):
    if not val:
        return None
    s = str(val).strip()
    if s.isdigit():
        n = int(s)
        return f"{n} Months" if n > 1 else f"{n} Month"
    return s


def format_hours_display(val):
    if not val:
        return None
    s = str(val).strip()
    if re.match(r'^\d+(?:\.\d+)?$', s):
        return f"{s} Hrs"
    return s


def parse_time_slot_duration(time_str):
    if not time_str:
        return None
    parts = re.split(r'\s*(?:-|to)\s*', str(time_str), flags=re.IGNORECASE)
    if len(parts) != 2:
        return None
    def parse_time(t):
        t = t.strip()
        for fmt in ('%I:%M %p', '%I %p', '%H:%M', '%I:%M%p', '%I%p', '%H:%M:%S'):
            try:
                return datetime.datetime.strptime(t, fmt)
            except ValueError:
                pass
        return None
    t1, t2 = parse_time(parts[0]), parse_time(parts[1])
    if t1 and t2:
        diff = (t2 - t1).total_seconds() / 3600.0
        if diff < 0:
            diff += 24.0
        return diff
    return None


def validate_batch_time_with_plan(time_str, plan_obj):
    if not time_str or not plan_obj or not plan_obj.hours_per_day:
        return

    plan_hours = parse_hours(plan_obj.hours_per_day)
    slot_hours = parse_time_slot_duration(time_str)

    if plan_hours is not None and slot_hours is not None:
        if abs(slot_hours - plan_hours) > 0.05:
            raise APIException(f"Selected time slot ({time_str} = {slot_hours:g} hrs) does not match the plan duration requirement of {plan_hours:g} hrs/day.")


def generate_avatar_text(name):
    if not name:
        return ""
    words = name.strip().split()
    if len(words) >= 2:
        return (words[0][0] + words[1][0]).upper()
    return name[:2].upper()


def get_user_name(user):
    if user and hasattr(user, 'is_authenticated') and user.is_authenticated:
        return user.get_full_name() or user.username
    return "System"


def fetch_courses_sidebar_service(search=None):
    queryset = CourseName.objects.all().order_by('-id')
    if search:
        queryset = queryset.filter(course_name__icontains=search)

    queryset = queryset.annotate(
        plans_count_annotated=models.Count('plans', distinct=True),
        active_batches_annotated=models.Count(
            'courses',
            filter=models.Q(courses__is_active=True) & (
                (models.Q(courses__batch__isnull=False) & ~models.Q(courses__batch='')) |
                models.Q(courses__course_time__isnull=False)
            ),
            distinct=True
        )
    )

    return [
        {
            "id": c.id,
            "name": c.course_name or "",
            "status": "Active" if c.is_active else "Draft",
            "avatar_text": generate_avatar_text(c.course_name or ""),
            "plan_count": c.plans_count_annotated,
            "active_batches": c.active_batches_annotated
        }
        for c in queryset
    ]


def fetch_course_details_service(course_id):
    course_obj = CourseName.objects.filter(id=course_id).first()
    if not course_obj:
        return None

    stats_list = exec_raw_sql('D_COURSE_STATS', {'course_id': course_id})
    plans_list = exec_raw_sql('L_COURSE_PLANS_BY_COURSE', {'course_id': course_id})
    batches_list = exec_raw_sql('D_COURSE_BATCHES_BY_COURSE', {'course_id': course_id})

    default_stats = {"plans": 0, "batches": 0}
    stats = stats_list[0] if (stats_list and isinstance(stats_list, list) and len(stats_list) > 0) else default_stats
    stats.pop("enrolled", None)
    stats.pop("seats_left", None)

    cleaned_plans = []
    if plans_list and isinstance(plans_list, list):
        for p in plans_list:
            if isinstance(p, dict):
                p.pop("after_offer", None)
                p.pop("students_count", None)
                p.pop("is_highlighted", None)
                if p.get("duration"):
                    p["duration"] = format_duration_display(p["duration"])
                if p.get("hours_per_day"):
                    p["hours_per_day"] = format_hours_display(p["hours_per_day"])
                cleaned_plans.append(p)
            else:
                cleaned_plans.append(p)

    return {
        "id": course_obj.id,
        "name": course_obj.course_name or "",
        "status": "Active" if course_obj.is_active else "Draft",
        "avatar_text": generate_avatar_text(course_obj.course_name or ""),
        "stats": stats,
        "plans": cleaned_plans,
        "batches": batches_list or []
    }


def create_course_service(user, data):
    try:
        name = data.get("name", "").strip()
        status_str = data.get("status", "Active").strip()
        is_active = (status_str.lower() == "active")

        user_name_str = get_user_name(user)

        if CourseName.objects.filter(course_name__iexact=name).exists():
            raise APIException("A course with this name already exists.")

        course_obj = CourseName.objects.create(
            course_name=name,
            is_active=is_active,
            created_by=user_name_str,
            updated_by=user_name_str
        )

        return fetch_course_details_service(course_obj.id)
    except Exception as e:
        raise APIException(str(e))


def edit_course_service(user, data):
    course_id = data.get("course_id") or data.get("id")
    if not course_id:
        raise APIException("course_id is required.")

    course_obj = CourseName.objects.filter(id=course_id).first()
    if not course_obj:
        raise APIException("Course not found.")

    name = data.get("name")
    if name is not None:
        name = name.strip()
        if CourseName.objects.filter(course_name__iexact=name).exclude(id=course_id).exists():
            raise APIException("A course with this name already exists.")
        course_obj.course_name = name

    status_str = data.get("status")
    if status_str is not None:
        course_obj.is_active = (status_str.strip().lower() == "active")

    user_name_str = get_user_name(user)
    course_obj.updated_by = user_name_str
    course_obj.save()

    return fetch_course_details_service(course_obj.id)


def create_course_plan_service(user, data):
    course_id = data.get("course_id")
    name = data.get("name", "").strip()
    price = data.get("price", "").strip()
    duration = data.get("duration")
    hours_per_day = data.get("hours_per_day")

    user_name_str = get_user_name(user)

    course_obj = CourseName.objects.filter(id=course_id).first()
    if not course_obj:
        raise APIException("Course not found.")

    existing_in_course = CoursePlan.objects.filter(course_name=course_obj, course_plan__iexact=name).exists()
    if existing_in_course:
        raise APIException("A plan with this name already exists in this course.")

    clean_price = re.sub(r'[^\d.]', '', str(price))
    numeric_fees = float(clean_price) if clean_price else 0.0

    plan_obj = CoursePlan.objects.create(
        course_name=course_obj,
        course_plan=name,
        fee_amount=numeric_fees,
        duration=duration,
        hours_per_day=hours_per_day,
        created_by=user_name_str,
        updated_by=user_name_str
    )

    from datetime import date
    Course.objects.create(
        course_name=course_obj,
        course_plan=plan_obj,
        course_fees=numeric_fees,
        starting_date=date.today(),
        closing_date=date.today(),
        total_seats=0,
        admission_count=0,
        seats_left=0,
        created_by=user_name_str,
        updated_by=user_name_str
    )

    return {
        "id": plan_obj.id,
        "name": plan_obj.course_plan,
        "price": price,
        "duration": duration,
        "hours_per_day": hours_per_day,
        "after_offer": None,
        "students_count": 0,
        "is_highlighted": False
    }


def edit_plan_service(user, plan_id, name=None, price=None, duration=None, hours_per_day=None, **kwargs):
    plan_obj = CoursePlan.objects.filter(id=plan_id).first()
    if not plan_obj:
        raise APIException("Plan not found.")

    if name is not None:
        name = name.strip()
        if CoursePlan.objects.filter(course_name=plan_obj.course_name, course_plan__iexact=name).exclude(id=plan_id).exists():
            raise APIException("A plan with this name already exists.")
        plan_obj.course_plan = name

    clean_price = ""
    if price is not None:
        clean_price = re.sub(r'[^\d.]', '', str(price))
        if clean_price:
            plan_obj.fee_amount = float(clean_price)

    if duration is not None:
        plan_obj.duration = duration

    if hours_per_day is not None:
        plan_obj.hours_per_day = hours_per_day

    user_name_str = get_user_name(user)
    plan_obj.updated_by = user_name_str
    plan_obj.save()

    p_courses = Course.objects.filter(course_plan=plan_obj)
    if price is not None and clean_price:
        p_courses.update(course_fees=float(clean_price))

    students_count = sum(c.admission_count or 0 for c in p_courses)
    fees = plan_obj.fee_amount or (p_courses[0].course_fees if p_courses and p_courses[0].course_fees else 0.0)

    price_str = price if price is not None else (f"₹{int(fees):,}" if fees > 0 else "₹0")

    return {
        "id": plan_obj.id,
        "name": plan_obj.course_plan,
        "price": price_str,
        "duration": plan_obj.duration,
        "hours_per_day": plan_obj.hours_per_day,
        "after_offer": None,
        "students_count": students_count,
        "is_highlighted": False
    }


def delete_course_plan_service(plan_id, course_id=None, **kwargs):
    plan_obj = CoursePlan.objects.filter(id=plan_id).first()
    if not plan_obj:
        raise APIException("Plan not found.")

    batch_count = Course.objects.filter(
        course_plan_id=plan_id
    ).filter(
        (models.Q(batch__isnull=False) & ~models.Q(batch='')) | models.Q(course_time__isnull=False)
    ).count()

    if batch_count > 0:
        raise APIException(f"Cannot delete plan. {batch_count} batches exist under this plan. Please delete all batches first.")

    Course.objects.filter(course_plan_id=plan_id).delete()
    CoursePlan.objects.filter(id=plan_id).delete()
    return {"status": "success", "message": "Plan deleted successfully."}


def edit_course_batch_service(user, data):
    batch_id = data.get("batch_id")
    batch_obj = Course.objects.filter(id=batch_id).first()
    if not batch_obj:
        raise APIException("Batch not found.")

    filled = batch_obj.admission_count or 0

    new_total_seats = data.get("total_seats")
    if new_total_seats is not None:
        if new_total_seats < filled:
            raise APIException(f"Cannot be less than the {filled} seats already filled.")
        batch_obj.total_seats = new_total_seats

    if "name" in data and data["name"] is not None:
        batch_obj.batch = data["name"].strip()

    if "days" in data and data["days"] is not None:
        batch_obj.days = data["days"].strip()

    if "plan" in data and data["plan"] is not None:
        plan_obj = CoursePlan.objects.filter(id=data["plan"]).first()
        if plan_obj:
            batch_obj.course_plan = plan_obj

    if "time" in data and data["time"] is not None:
        timing_str = data["time"].strip()
        timing_obj, _ = CourseTiming.objects.get_or_create(course_time=timing_str)
        batch_obj.course_time = timing_obj

    if "trainer" in data and data["trainer"] is not None:
        batch_obj.trainer = data["trainer"].strip() or None

    if "start_date" in data and data["start_date"] is not None:
        batch_obj.starting_date = data["start_date"]

    if "closing_date" in data and data["closing_date"] is not None:
        batch_obj.closing_date = data["closing_date"]

    user_name_str = get_user_name(user)
    batch_obj.updated_by = user_name_str
    batch_obj.save()

    total = batch_obj.total_seats or 0
    is_almost_full = (filled >= (total - 2)) if total > 0 else False

    return {
        "id": batch_obj.id,
        "name": batch_obj.batch or (batch_obj.course_time.course_time if batch_obj.course_time else f"Batch #{batch_obj.id}"),
        "plan": batch_obj.course_plan.id if batch_obj.course_plan else None,
        "plan_name": batch_obj.course_plan.course_plan.title() if batch_obj.course_plan and batch_obj.course_plan.course_plan else "General",
        "days": batch_obj.days or "Mon–Fri",
        "time": batch_obj.course_time.course_time if batch_obj.course_time else None,
        "trainer": batch_obj.trainer or None,
        "filled_seats": filled,
        "total_seats": total,
        "start_date": str(batch_obj.starting_date) if batch_obj.starting_date else None,
        "closing_date": str(batch_obj.closing_date) if batch_obj.closing_date else None,
        "note": "almost full" if is_almost_full else None
    }


def delete_course_batch_service(batch_id):
    batch_obj = Course.objects.filter(id=batch_id).first()
    if not batch_obj:
        raise APIException("Batch not found.")

    Course.objects.filter(id=batch_id).delete()
    return {"status": "success", "message": "Batch deleted successfully."}


def delete_course_service(course_id):
    course_name_obj = CourseName.objects.filter(id=course_id).first()
    if not course_name_obj:
        raise APIException("Course not found.")

    plan_count = CoursePlan.objects.filter(
        models.Q(course_name_id=course_id) | models.Q(courses__course_name_id=course_id)
    ).distinct().count()

    if plan_count > 0:
        raise APIException(f"Cannot delete course. {plan_count} plans exist under this course. Please delete all plans first.")

    Course.objects.filter(course_name_id=course_id).delete()
    CourseName.objects.filter(id=course_id).delete()
    return {"status": "success", "message": "Course deleted successfully."}


def create_batch_service(user, data):
    from datetime import date
    try:
        course_id = data.get("course_id")
        plan_id = data.get("plan")
        batch_name = data.get("name", "").strip()
        time_str = data.get("time", "").strip()
        trainer_str = data.get("trainer", "").strip() or None
        days_str = data.get("days", "").strip() or "Mon–Fri"
        total_seats = data.get("total_seats", 20)
        start_date = data.get("start_date") or date.today()
        closing_date = data.get("closing_date") or date.today()

        if start_date and closing_date and closing_date < start_date:
            raise APIException("Closing date cannot be before starting date.")

        course_name_obj = CourseName.objects.filter(id=course_id).first()
        if not course_name_obj:
            raise APIException("Course not found.")

        plan_obj = CoursePlan.objects.filter(id=plan_id).first()
        if not plan_obj:
            raise APIException("Plan not found.")

        if plan_obj.course_name and plan_obj.course_name_id != course_name_obj.id:
            raise APIException("This plan does not belong to this course.")

        if time_str:
            validate_batch_time_with_plan(time_str, plan_obj)

        timing_obj = None
        if time_str:
            timing_obj, _ = CourseTiming.objects.get_or_create(
                course_name=course_name_obj,
                course_time=time_str,
                defaults={"is_active": True}
            )

        user_name_str = get_user_name(user)

        batch_obj = Course.objects.create(
            course_name=course_name_obj,
            course_plan=plan_obj,
            course_time=timing_obj,
            batch=batch_name,
            trainer=trainer_str,
            days=days_str,
            total_seats=total_seats,
            admission_count=0,
            starting_date=start_date,
            closing_date=closing_date,
            is_active=True,
            created_by=user_name_str,
            updated_by=user_name_str
        )

        is_almost_full = (batch_obj.admission_count >= (batch_obj.total_seats - 2)) if batch_obj.total_seats > 0 else False

        return {
            "id": batch_obj.id,
            "name": batch_obj.batch,
            "plan": plan_obj.id,
            "plan_name": plan_obj.course_plan.title() if plan_obj.course_plan else "General",
            "days": batch_obj.days or "Mon–Fri",
            "time": timing_obj.course_time if timing_obj else time_str,
            "trainer": batch_obj.trainer or None,
            "filled_seats": batch_obj.admission_count,
            "total_seats": batch_obj.total_seats,
            "start_date": str(batch_obj.starting_date) if batch_obj.starting_date else None,
            "closing_date": str(batch_obj.closing_date) if batch_obj.closing_date else None,
            "note": "almost full" if is_almost_full else None
        }
    except Exception as e:
        raise APIException(str(e))


def edit_batch_service(user, batch_id, name=None, plan=None, time=None, trainer=None, days=None, total_seats=None, start_date=None, closing_date=None, **kwargs):
    batch_obj = Course.objects.filter(id=batch_id).first()
    if not batch_obj:
        raise APIException("Batch not found.")

    filled_seats = batch_obj.admission_count or 0

    if total_seats is not None:
        if total_seats < filled_seats:
            raise APIException(f"Cannot be less than the {filled_seats} seats already filled.")
        batch_obj.total_seats = total_seats

    s_date = start_date or batch_obj.starting_date
    c_date = closing_date or batch_obj.closing_date
    if s_date and c_date and c_date < s_date:
        raise APIException("Closing date cannot be before starting date.")

    if start_date is not None:
        batch_obj.starting_date = start_date
    if closing_date is not None:
        batch_obj.closing_date = closing_date

    if name is not None:
        batch_obj.batch = name.strip()

    if days is not None:
        batch_obj.days = days.strip()

    if plan is not None:
        plan_obj = CoursePlan.objects.filter(id=plan).first()
        if not plan_obj:
            raise APIException("Plan not found.")
        if plan_obj.course_name and batch_obj.course_name and plan_obj.course_name_id != batch_obj.course_name_id:
            raise APIException("This plan does not belong to this course.")
        batch_obj.course_plan = plan_obj

    if time is not None:
        time_str = time.strip()
        if time_str:
            timing_obj, _ = CourseTiming.objects.get_or_create(
                course_name=batch_obj.course_name,
                course_time=time_str,
                defaults={"is_active": True}
            )
            batch_obj.course_time = timing_obj
        else:
            batch_obj.course_time = None

    if batch_obj.course_time and batch_obj.course_plan:
        validate_batch_time_with_plan(batch_obj.course_time.course_time, batch_obj.course_plan)

    if trainer is not None:
        batch_obj.trainer = trainer.strip() or None

    user_name_str = get_user_name(user)
    batch_obj.updated_by = user_name_str
    batch_obj.save()

    current_total = batch_obj.total_seats or 0
    is_almost_full = (filled_seats >= (current_total - 2)) if current_total > 0 else False

    return {
        "id": batch_obj.id,
        "name": batch_obj.batch or (batch_obj.course_time.course_time if batch_obj.course_time else f"Batch #{batch_obj.id}"),
        "plan": batch_obj.course_plan.id if batch_obj.course_plan else None,
        "plan_name": batch_obj.course_plan.course_plan.title() if (batch_obj.course_plan and batch_obj.course_plan.course_plan) else "General",
        "days": batch_obj.days or "Mon–Fri",
        "time": batch_obj.course_time.course_time if batch_obj.course_time else None,
        "trainer": batch_obj.trainer or None,
        "filled_seats": filled_seats,
        "total_seats": batch_obj.total_seats,
        "start_date": str(batch_obj.starting_date) if batch_obj.starting_date else None,
        "closing_date": str(batch_obj.closing_date) if batch_obj.closing_date else None,
        "note": "almost full" if is_almost_full else None
    }
