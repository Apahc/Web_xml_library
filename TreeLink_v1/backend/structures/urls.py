from django.urls import path
from . import views

urlpatterns = [
    # Основные эндпоинты
    path('', views.get_structures, name='structures'),
    path('upload/', views.upload_structure_xml, name='upload_structure'),
    path('search/', views.search_structure, name='search_structure'),
    path('test/', views.api_test, name='api_test'),

    # Эндпоинты для конкретной структуры
    path('<int:structure_id>/', views.get_structure_details, name='structure_details'),
    path('<int:structure_id>/folders/', views.get_folder_tree, name='folder_tree'),
    path('<int:structure_id>/consistency-check/', views.check_consistency, name='consistency_check'),
    path('<int:structure_id>/delete/', views.delete_structure, name='delete_structure'),
]