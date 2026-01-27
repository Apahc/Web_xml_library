# documents/models.py
from django.db import models
from django.utils import timezone
from structures.models import Folder
import hashlib

class Document(models.Model):
    code = models.CharField(max_length=255, unique=True, verbose_name="Код")
    name = models.CharField(max_length=500, verbose_name="Название")
    metadata = models.JSONField(default=dict, blank=True, verbose_name="Метаданные")
    xml_filename = models.CharField(max_length=500, blank=True, null=True, verbose_name="XML файл")
    file_path = models.CharField(max_length=1000, verbose_name="Путь к файлу")
    file_size = models.BigIntegerField(default=0, verbose_name="Размер (байт)")
    file_hash = models.CharField(max_length=64, blank=True, null=True, verbose_name="Хэш файла")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    class Meta:
        verbose_name = "Документ"
        verbose_name_plural = "Документы"
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['file_hash']),
            models.Index(fields=['code']),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

    def calculate_hash(self, file_content):
        """Вычисление SHA256 хэша файла"""
        sha256_hash = hashlib.sha256()
        sha256_hash.update(file_content)
        return sha256_hash.hexdigest()


class FolderDocument(models.Model):
    """Связующая таблица для связи многие-ко-многим между папками и документами"""
    folder = models.ForeignKey(Folder, on_delete=models.CASCADE, verbose_name="Папка")
    document = models.ForeignKey(Document, on_delete=models.CASCADE, verbose_name="Документ")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Дата привязки")

    class Meta:
        verbose_name = "Привязка документа к папке"
        verbose_name_plural = "Привязки документов к папкам"
        unique_together = [['folder', 'document']]
        indexes = [
            models.Index(fields=['folder', 'document']),
        ]

    def __str__(self):
        return f"{self.folder.name} - {self.document.name}"