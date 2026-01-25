from django.db import models
from django.utils import timezone
from structures.models import Folder

class Document(models.Model):
    code = models.CharField(max_length=255, blank=True, null=True, verbose_name="Код")
    name = models.CharField(max_length=500, verbose_name="Название")
    metadata = models.JSONField(default=dict, blank=True, verbose_name="Метаданные")
    xml_filename = models.CharField(max_length=500, blank=True, null=True, verbose_name="XML файл")
    file_path = models.CharField(max_length=1000, verbose_name="Путь к файлу")
    file_size = models.BigIntegerField(default=0, verbose_name="Размер (байт)")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Дата создания")

    class Meta:
        verbose_name = "Документ"
        verbose_name_plural = "Документы"
        indexes = [
            models.Index(fields=['created_at'])
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"


class FolderDocument(models.Model):
    """Связующая таблица для связи многие-ко-многим между папками и документами"""
    folder = models.ForeignKey(Folder, on_delete=models.CASCADE, verbose_name="Папка")
    document = models.ForeignKey(Document, on_delete=models.CASCADE, verbose_name="Документ")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Дата привязки")

    class Meta:
        verbose_name = "Привязка документа к папке"
        verbose_name_plural = "Привязки документов к папкам"
        unique_together = [['folder', 'document']]

    def __str__(self):
        return f"{self.folder.name} - {self.document.name}"