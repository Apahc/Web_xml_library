import tempfile
from datetime import timezone
import xml.etree.ElementTree as ET
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
import json
import hashlib
import os
import uuid
from .models import Structure, Folder
from documents.models import Document, FolderDocument
from import_logs.models import ImportLog


def process_folder_hierarchy(folder_elem, structure, parent_folder, folder_cache=None):
    """Рекурсивная обработка папок с кэшированием"""
    if folder_cache is None:
        folder_cache = {}

    # Извлекаем данные из XML
    folder_name = folder_elem.get('name', '')
    folder_code = folder_elem.get('code', '')

    # Если нет кода, генерируем его из имени
    if not folder_code:
        folder_code = folder_name.lower().replace(' ', '_')

    # Генерируем ключ кэша
    cache_key = f"{structure.id}_{folder_code}_{parent_folder.id if parent_folder else 'root'}"

    if cache_key in folder_cache:
        return folder_cache[cache_key]

    # Создаем materialized_path
    if parent_folder:
        materialized_path = f"{parent_folder.materialized_path}{folder_code}/"
    else:
        materialized_path = f"/{folder_code}/"

    # Извлекаем атрибуты (может быть в разных форматах)
    attributes = {}

    # Вариант 1: атрибуты как подэлементы
    for attr_elem in folder_elem.findall('attribute'):
        attr_name = attr_elem.get('name')
        attr_value = attr_elem.text
        if attr_name and attr_value:
            attributes[attr_name] = attr_value

    # Вариант 2: атрибуты как атрибуты элемента
    for attr_name, attr_value in folder_elem.attrib.items():
        if attr_name not in ['name', 'code', 'id']:
            attributes[attr_name] = attr_value

    # Вариант 3: специальный элемент <attributes> с дочерними элементами
    attrs_elem = folder_elem.find('attributes')
    if attrs_elem is not None:
        for attr_elem in attrs_elem:
            attr_name = attr_elem.tag
            attr_value = attr_elem.text or ''
            attributes[attr_name] = attr_value

    # Создаем или получаем папку
    try:
        folder, created = Folder.objects.get_or_create(
            structure=structure,
            code=folder_code,
            defaults={
                'name': folder_name,
                'parent': parent_folder,
                'materialized_path': materialized_path,
                'attributes': attributes
            }
        )
    except Exception as e:
        # Если произошла ошибка (например, дубликат), попробуем другой подход
        folder = Folder.objects.filter(
            structure=structure,
            code=folder_code,
            parent=parent_folder
        ).first()

        if folder:
            created = False
            folder.name = folder_name
            folder.materialized_path = materialized_path
            folder.attributes = attributes
            folder.save()
        else:
            raise e

    # Если папка существовала, обновляем
    if not created:
        folder.name = folder_name
        folder.materialized_path = materialized_path
        folder.attributes = attributes
        folder.save()

    # Кэшируем результат
    folder_cache[cache_key] = folder

    # Рекурсивно обрабатываем детей
    for child_elem in folder_elem.findall('folder'):
        process_folder_hierarchy(child_elem, structure, folder, folder_cache)

    # Также обрабатываем вложенные папки, которые могут быть в других тегах
    for child_elem in folder_elem.findall('*'):
        if child_elem.tag != 'folder' and child_elem.find('folder') is not None:
            for nested_folder in child_elem.findall('folder'):
                process_folder_hierarchy(nested_folder, structure, folder, folder_cache)

    return folder


@csrf_exempt
def upload_structure_xml(request):
    """Загрузка XML структуры с проверкой хэша - УПРОЩЕННАЯ ВЕРСИЯ"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Метод не разрешен'}, status=405)

    if not request.FILES.get('file'):
        return JsonResponse({'error': 'Файл не найден'}, status=400)

    uploaded_file = request.FILES['file']

    try:
        file_content = uploaded_file.read()
        file_hash = hashlib.sha256(file_content).hexdigest()

        # хеш алгоритм для сверки существующих папок
        existing_structure = Structure.objects.filter(content_hash=file_hash).first()
        if existing_structure:
            return JsonResponse({
                'success': True,
                'duplicate': True,
                'message': f'Структура уже была загружена ранее: {existing_structure.name}',
                'structure_id': existing_structure.id
            })


        try:
            xml_content = file_content.decode('utf-8')
        except UnicodeDecodeError:
            for encoding in ['cp1251', 'iso-8859-1', 'windows-1251']:
                try:
                    xml_content = file_content.decode(encoding)
                    break
                except UnicodeDecodeError:
                    continue
            else:
                return JsonResponse({'error': 'Не удалось декодировать файл (поддерживаются UTF-8, CP1251)'},
                                    status=400)

        # Парсим XML
        try:
            root = ET.fromstring(xml_content)
        except ET.ParseError as e:
            return JsonResponse({'error': f'Неверный формат XML: {str(e)}'}, status=400)

        if root.tag == 'organization':
            root = root.find('structure') or root

        with transaction.atomic():
            #надеюсь что это так
            struct_name = root.get('name') or uploaded_file.name.rsplit('.', 1)[0]

            # Создаем структуру
            structure = Structure.objects.create(
                name=struct_name,
                description=f'Импортировано из {uploaded_file.name}',
                content_hash=file_hash
            )

            # Обрабатываем папки
            folders_processed = 0
            folder_cache = {}

            folder_elements = []

            # папки прямо в корне
            folder_elements.extend(root.findall('folder'))

            # папки в элементе <folders>
            folders_elem = root.find('folders')
            if folders_elem is not None:
                folder_elements.extend(folders_elem.findall('folder'))

            # папки в элементе <structure>
            struct_elem = root.find('structure')
            if struct_elem is not None:
                folder_elements.extend(struct_elem.findall('folder'))

            # Обрабатываем найденные папки
            for folder_elem in folder_elements:
                process_folder_hierarchy(folder_elem, structure, None, folder_cache)

            # Считаем папки
            folders_processed = Folder.objects.filter(structure=structure).count()

            # Сохраняем XML файл
            filename = f"{uuid.uuid4()}_{uploaded_file.name}"
            file_path = os.path.join('media/uploads/structures', filename)

            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'wb') as f:
                f.write(file_content)

            # Логируем импорт
            ImportLog.objects.create(
                operation_type='STRUCTURE_IMPORT',
                filename=uploaded_file.name,
                message=f'Структура "{structure.name}" импортирована. Папок: {folders_processed}',
                items_processed=folders_processed
            )

            return JsonResponse({
                'success': True,
                'structure_id': structure.id,
                'structure_name': structure.name,
                'folders_processed': folders_processed,
                'filename': uploaded_file.name
            })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': f'Ошибка обработки: {str(e)}'}, status=500)


def get_structures(request):
    """Получить все структуры"""
    structures = Structure.objects.filter(is_active=True).order_by('-created_at').values(
        'id', 'name', 'description', 'created_at'
    )
    return JsonResponse({'structures': list(structures)})


def get_folder_tree(request, structure_id):
    """Дерево папок структуры"""
    structure = get_object_or_404(Structure, id=structure_id)

    def build_tree(parent_id=None):
        folders = Folder.objects.filter(
            structure_id=structure_id,
            parent_id=parent_id
        ).order_by('code')

        nodes = []
        for folder in folders:
            node = {
                'id': str(folder.id),
                'name': folder.name,
                'code': folder.code,
                'attributes': folder.attributes,
                'has_children': Folder.objects.filter(parent=folder).exists(),
                'children': build_tree(folder.id) if Folder.objects.filter(parent=folder).exists() else []
            }
            nodes.append(node)

        return nodes

    tree_data = build_tree()

    return JsonResponse({
        'success': True,
        'structure': {
            'id': structure.id,
            'name': structure.name,
            'description': structure.description
        },
        'tree': tree_data
    })


def search_structure(request):
    """Поиск по структурам и документам"""
    from django.db.models import Q

    query = request.GET.get('q', '').strip()
    if not query:
        return JsonResponse({'error': 'Пустой запрос'}, status=400)

    # Ищем папки
    folders = Folder.objects.filter(
        Q(name__icontains=query) |
        Q(code__icontains=query)
    ).select_related('structure').values(
        'id', 'name', 'code', 'materialized_path', 'structure_id', 'structure__name'
    )[:50]

    # Ищем документы
    documents = Document.objects.filter(
        Q(name__icontains=query) |
        Q(code__icontains=query)
    ).values('id', 'name', 'code', 'created_at')[:50]

    return JsonResponse({
        'success': True,
        'query': query,
        'folders': list(folders),
        'documents': list(documents)
    })


def check_consistency(request, structure_id):
    """Проверка консистентности данных структуры"""
    structure = get_object_or_404(Structure, id=structure_id)

    issues = []
    folders = Folder.objects.filter(structure=structure)

    #  Проверка циклов в дереве
    for folder in folders:
        current = folder
        visited = set()
        while current:
            if current.id in visited:
                issues.append(f'Обнаружен цикл в папке {folder.name} (ID: {folder.id})')
                break
            visited.add(current.id)
            current = current.parent

    # Проверка materialized_path
    for folder in folders:
        expected_path = '/'
        if folder.parent:
            expected_path = f"{folder.parent.materialized_path}{folder.code}/"
        else:
            expected_path = f"/{folder.code}/"

        if folder.materialized_path != expected_path:
            issues.append(
                f'Несоответствие пути для папки {folder.name}: ожидалось {expected_path}, фактически {folder.materialized_path}')

    from django.db.models import Count
    duplicate_codes = folders.values('parent_id', 'code').annotate(
        count=Count('id')
    ).filter(count__gt=1)

    for dup in duplicate_codes:
        if dup['parent_id']:
            parent = Folder.objects.get(id=dup['parent_id'])
            issues.append(f'Дубликат кода "{dup["code"]}" в папке "{parent.name}"')
        else:
            issues.append(f'Дубликат кода "{dup["code"]}" в корневом уровне')

    return JsonResponse({
        'success': True,
        'structure': structure.name,
        'total_folders': folders.count(),
        'issues_found': len(issues),
        'issues': issues,
        'is_consistent': len(issues) == 0
    })


def get_structure_details(request, structure_id):
    """Получить детальную информацию о структуре"""
    structure = get_object_or_404(Structure, id=structure_id)

    # Статистика
    total_folders = Folder.objects.filter(structure=structure).count()
    root_folders = Folder.objects.filter(structure=structure, parent=None).count()

    return JsonResponse({
        'success': True,
        'structure': {
            'id': structure.id,
            'name': structure.name,
            'description': structure.description,
            'created_at': structure.created_at.strftime('%d.%m.%Y %H:%M'),
            'total_folders': total_folders,
            'root_folders': root_folders
        }
    })


# не уверена что это нужно
@csrf_exempt
def delete_structure(request, structure_id):
    """Удалить структуру"""
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Метод не разрешен'}, status=405)

    structure = get_object_or_404(Structure, id=structure_id)
    structure_name = structure.name
    structure.delete()

    return JsonResponse({
        'success': True,
        'message': f'Структура "{structure_name}" удалена'
    })


def api_test(request):
    """Тестовый endpoint для проверки API"""
    return JsonResponse({
        'status': 'success',
        'message': 'Structures API работает!',
        'endpoints': {
            'upload_structure': '/api/structures/upload/',
            'get_structures': '/api/structures/',
            'get_structure_tree': '/api/structures/<id>/folders/',
            'check_consistency': '/api/structures/<id>/consistency-check/',
        }
    })