from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from .delete_base_model import SafeDeleteModel

# class Course(SafeDeleteModel):
#     course_name = models.CharField(max_length=255)
#     course_plan = models.CharField(max_length=255) # e.g., Full Stack, Data Science
#     course_fees=models.FloatField(validators=[MinValueValidator(0)],default=16000)
#     starting_date = models.DateField()
#     closing_date = models.DateField()
    
#     total_seats = models.IntegerField(default=0)
#     admission_count = models.IntegerField(default=0)
#     seats_left = models.IntegerField() # Manual-a edit panna mudiyathu
    
#     status = models.CharField(max_length=20, default='Open')
#     created_at=models.DateTimeField(auto_now_add=True,null=True)
#     created_by=models.CharField(max_length=50,null=True)
#     updated_at=models.DateTimeField(auto_now=True,null=True)
#     updated_by=models.CharField(max_length=50,null=True)

#     def save(self, *args, **kwargs):
#         # Seats calculation logic
#         self.seats_left = self.total_seats - self.admission_count
        
#         # Oru vaela seats full aayiduchuna status-a auto-va 'Full' nu mathu
#         if self.seats_left <= 0:
#             self.status = 'Closed'
#             self.seats_left = 0
            
#         super().save(*args, **kwargs)

#     def __str__(self):
#         return f"{self.course_name} ({self.course_plan})"
    
#     class Meta:
#         db_table = 'telecalling_course'
        
        
        
class Course(SafeDeleteModel):

    course_name = models.ForeignKey(
        'CourseName',
        on_delete=models.SET_NULL,
        null=True,
        related_name='courses')
    course_plan = models.ForeignKey(
        'CoursePlan',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='courses'
    )

    course_time = models.ForeignKey(
        'CourseTiming',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='courses'
    )
    batch = models.CharField(max_length=50, null=True, blank=True)
    trainer = models.CharField(max_length=100, null=True, blank=True)
    days = models.CharField(max_length=50, default="Mon–Fri", null=True, blank=True)
    course_fees = models.FloatField(validators=[MinValueValidator(0)], default=0.0)
    starting_date = models.DateField(null=True, blank=True)
    closing_date = models.DateField(null=True, blank=True)
    is_active=models.BooleanField(default=False)
    total_seats = models.IntegerField(default=0)
    admission_count = models.IntegerField(default=0)
    seats_left = models.IntegerField() # Manual-a edit panna mudiyathu
    
    status = models.CharField(max_length=20, default='Open')
    created_at=models.DateTimeField(auto_now_add=True,null=True)
    created_by=models.CharField(max_length=50,null=True)
    updated_at=models.DateTimeField(auto_now=True,null=True)
    updated_by=models.CharField(max_length=50,null=True)

    def save(self, *args, **kwargs):
        # Seats calculation logic
        self.seats_left = self.total_seats - self.admission_count
        
        # Oru vaela seats full aayiduchuna status-a auto-va 'Full' nu mathu
        if self.seats_left <= 0:
            self.status = 'Closed'
            self.seats_left = 0
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.course_name} ({self.course_plan})"
    
    class Meta:
        db_table = 'telecalling_course'
        
   

class CourseName(SafeDeleteModel):
    course_name= models.CharField(null=True)
    is_active=models.BooleanField(default=True)
    created_at=models.DateTimeField(auto_now_add=True,null=True)
    created_by=models.CharField(max_length=50,null=True)
    updated_at=models.DateTimeField(auto_now=True,null=True)
    updated_by=models.CharField(max_length=50,null=True)
    
    def __str__(self):
        return str(self.course_name)
    
    class Meta:
        db_table = 'telecalling_course_name'

        
class CoursePlan(SafeDeleteModel):
    course_name = models.ForeignKey('CourseName', on_delete=models.SET_NULL, null=True, blank=True, related_name='plans')
    course_plan = models.CharField(max_length=100, null=True, blank=True)
    fee_amount = models.FloatField(default=0.0, null=True, blank=True)
    duration = models.CharField(max_length=50, null=True, blank=True)
    hours_per_day = models.CharField(max_length=50, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    created_by = models.CharField(max_length=50, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    updated_by = models.CharField(max_length=50, null=True)
    
    def __str__(self):
        return str(self.course_plan)
    
    class Meta:
        db_table = 'telecalling_course_plan'
        
        
        
class CourseTiming(SafeDeleteModel):
    course_name = models.ForeignKey('CourseName', on_delete=models.SET_NULL, null=True, blank=True, related_name='timings')
    course_time = models.CharField(max_length=100, null=True, blank=True)
    is_active=models.BooleanField(default=True)
    created_at=models.DateTimeField(auto_now_add=True,null=True)
    created_by=models.CharField(max_length=50,null=True)
    updated_at=models.DateTimeField(auto_now=True,null=True)
    updated_by=models.CharField(max_length=50,null=True)
    
    def __str__(self):
        return str(self.course_time)
    
    class Meta:
        db_table = 'telecalling_course_time'


class CourseDuration(SafeDeleteModel):
    duration = models.CharField(max_length=100, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    created_by = models.CharField(max_length=50, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    updated_by = models.CharField(max_length=50, null=True)

    def __str__(self):
        return str(self.duration)

    class Meta:
        db_table = 'telecalling_course_duration'