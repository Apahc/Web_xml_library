from django.db import models
from django.utils import timezone

class Structure(models.Model):
    name = models.CharField(max_length=255, verbose_name="Название структуры")
    description = models.TextField(blank=True, null=True, verbose_name="Описание")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")
    is_active = models.BooleanField(default=True, verbose_name="Активно")
    content_hash = models.CharField(max_length=64, blank=True, null=True, verbose_name="Хэш")

    class Meta:
        verbose_name = "Структура"
        verbose_name_plural = "Структуры"
        indexes = [
            models.Index(fields=['content_hash'])
        ]

    def __str__(self):
        return self.name


class Folder(models.Model):
    structure = models.ForeignKey(Structure, on_delete=models.CASCADE, related_name='folders', verbose_name="Структура")
    code = models.CharField(max_length=255, blank=True, null=True, verbose_name="Код")
    name = models.CharField(max_length=255, verbose_name="Название")
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children',
                               verbose_name="Родитель")
    materialized_path = models.CharField(max_length=1000, blank=True, null=True, verbose_name="Путь")
    attributes = models.JSONField(default=dict, blank=True, verbose_name="Атрибуты")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Дата создания")

    class Meta:
        verbose_name = "Папка"
        verbose_name_plural = "Папки"
        indexes = [
            models.Index(fields=['materialized_path']),
            models.Index(fields=['structure', 'parent']),
        ]

    def __str__(self):
        return f"{self.structure.name} / {self.name}"

    def save(self, *args, **kwargs):
        if not self.materialized_path:
            if self.parent:
                self.materialized_path = f"{self.parent.materialized_path}{self.code}/"
            else:
                self.materialized_path = f"/{self.code}/"
        super().save(*args, **kwargs)