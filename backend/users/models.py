from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    username = None  # remove username
    email = models.EmailField(unique=True)

    role = models.CharField(max_length=50)
    organization_name = models.CharField(max_length=100, blank=True, null=True)
    address = models.CharField(max_length=600, blank=True, null=True)
    contact_number = models.CharField(max_length=15, blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['role', 'organization_name', 'address', 'contact_number']

    objects = CustomUserManager()  # 👈 very important

    def __str__(self):
        return self.email
