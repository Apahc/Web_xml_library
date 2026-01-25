# documents/admin.py
from django.contrib import admin
from .models import Document

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'file_size', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'code']