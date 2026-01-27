# documents/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('upload-single/', views.upload_single_document, name='upload_single_document'),
    path('handle-duplicate/', views.handle_duplicate_decision, name='handle_duplicate'),
    path('test/', views.api_test, name='documents_api_test'),

    # Дополнительные эндпоинты
    path('<int:document_id>/', views.get_document_details, name='document_details'),
    path('folder/<int:folder_id>/', views.get_documents_by_folder, name='documents_by_folder'),
    path('search/', views.search_documents, name='search_documents'),
]