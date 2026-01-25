from django.db import models
from django.utils import timezone


class UserProfile(models.Model):
    username = models.CharField(max_length=100, unique=True, verbose_name="Логин")
    email = models.EmailField(unique=True, verbose_name="Email")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Дата регистрации")

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"

    def __str__(self):
        return self.username