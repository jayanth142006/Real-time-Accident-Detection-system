from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Accident(models.Model):
    address = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    assigned_hospital = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='hospital_accidents'
    )

    assigned_police = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='police_accidents'
    )

    description = models.TextField(blank=True, null=True)
    
    severity = models.CharField(
        max_length=20,
        choices=[
            ('minor', 'Minor'),
            ('moderate', 'Moderate'),
            ('severe', 'Severe')
        ],
        default='minor'
    )

    severity_score = models.IntegerField(default=0)  # ⭐ NEW
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('in_progress', 'In Progress'),
            ('completed', 'Completed')
        ],
        default='pending'  # ⭐ NEW
    )
    image = models.ImageField(upload_to='accident_images/', null=True, blank=True) 

    def __str__(self):
        return f"Accident at {self.address} on {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
