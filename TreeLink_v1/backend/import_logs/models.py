from django.db import models
from django.utils import timezone
from users.models import UserProfile


class ImportLog(models.Model):
    OPERATION_TYPES = [
        ('IMPORT', 'Импорт'),
        ('VALIDATE', 'Валидация'),
        ('UPDATE', 'Обновление'),
        ('DELETE', 'Удаление'),
    ]

    operation_type = models.CharField(max_length=50, choices=OPERATION_TYPES, verbose_name="Тип операции")
    filename = models.CharField(max_length=500, verbose_name="Имя файла")
    message = models.TextField(blank=True, null=True, verbose_name="Сообщение")
    items_processed = models.IntegerField(default=0, verbose_name="Обработано элементов")
    user = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Пользователь")
    performed_at = models.DateTimeField(default=timezone.now, verbose_name="Время выполнения")

    class Meta:
        verbose_name = "Лог импорта"
        verbose_name_plural = "Логи импорта"
        ordering = ['-performed_at']

    def __str__(self):
        return f"{self.operation_type} - {self.filename}"