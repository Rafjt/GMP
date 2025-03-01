from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.auth.hashers import PBKDF2PasswordHasher

def default_hashed_password():
    hasher = PBKDF2PasswordHasher()
    return hasher.encode("defaultpassword", hasher.salt())  # Hash a default password



class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)  # Use email as the login
    hashed_master_password = models.CharField(
        max_length=255, 
        default=default_hashed_password  # Set default hashed password
    )

    USERNAME_FIELD = "email"  # Use email instead of username
    REQUIRED_FIELDS = []  # Don't require a username

    def set_master_password(self, password):
        """Hash the master password using PBKDF2 before saving it."""
        hasher = PBKDF2PasswordHasher()
        self.hashed_master_password = hasher.encode(password, hasher.salt())  # Hash password
