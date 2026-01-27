# documents/views.py
import os
import hashlib
import uuid
import re
import json
from django.db import transaction
from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import xml.etree.ElementTree as ET

from .models import Document, FolderDocument
from structures.models import Folder
from import_logs.models import ImportLog


@csrf_exempt
def upload_single_document(request):
    """Загрузка одного документа из XML файла с выбором папки"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Метод не разрешен'}, status=405)

    print("=" * 60)
    print("DEBUG: Начало загрузки документа")

    if not request.FILES.get('file'):
        return JsonResponse({'error': 'Файл не найден. Используйте ключ "file"'}, status=400)

    # Получаем параметр structure_id из POST
    structure_id = request.POST.get('structure_id')
    if not structure_id:
        return JsonResponse({'error': 'Не указан structure_id'}, status=400)

    try:
        structure_id = int(structure_id)
    except ValueError:
        return JsonResponse({'error': 'structure_id должен быть числом'}, status=400)

    uploaded_file = request.FILES['file']
    print(f"Файл: {uploaded_file.name}, Structure ID: {structure_id}")

    try:
        # Читаем файл
        file_content = uploaded_file.read()

        # Вычисляем хэш
        file_hash = hashlib.sha256(file_content).hexdigest()
        print(f"✓ Хэш файла (SHA256): {file_hash[:16]}...")

        # Декодируем
        try:
            xml_content = file_content.decode('utf-8')
        except UnicodeDecodeError:
            xml_content = file_content.decode('cp1251')

        # Парсим XML
        root = ET.fromstring(xml_content)

        # Ищем header
        header = root.find('header')
        if not header:
            return JsonResponse({'error': 'Нет элемента <header>'}, status=400)

        # doc_code
        doc_code_elem = header.find('doc_number')
        if doc_code_elem is None:
            print("✗ Элемент <doc_number> не найден в header")
            return JsonResponse({'error': 'Нет <doc_number> в <header>'}, status=400)

        doc_text = doc_code_elem.text
        if doc_text is None:
            print("✗ У элемента <doc_number> нет текстового содержимого")
            return JsonResponse({'error': 'Элемент <doc_number> не содержит текста'}, status=400)

        doc_code = doc_text.strip()
        if not doc_code:
            print(f"✗ Элемент <doc_number> содержит только пробелы")
            return JsonResponse({'error': 'Элемент <doc_number> содержит только пробелы или пуст'}, status=400)

        print(f"✓ Код документа: '{doc_code}'")

        # title
        title_elem = header.find('title')
        if title_elem is None:
            print("✗ Элемент <title> не найден")
            return JsonResponse({'error': 'Нет <title> в <header>'}, status=400)

        title_text = title_elem.text
        if title_text is None:
            print("✗ У элемента <title> нет текстового содержимого")
            return JsonResponse({'error': 'Элемент <title> не содержит текста'}, status=400)

        doc_name = title_text.strip()
        if not doc_name:
            print(f"✗ Элемент <title> содержит только пробелы")
            return JsonResponse({'error': 'Элемент <title> содержит только пробелы или пуст'}, status=400)

        print(f"✓ Название документа: '{doc_name}'")

        # metadata
        metadata = root.find('metadata')
        if not metadata:
            print("✗ Элемент <metadata> не найден")
            return JsonResponse({'error': 'Нет элемента <metadata>'}, status=400)

        # folder_code
        folder_code_elem = metadata.find('folder_code')
        if folder_code_elem is None:
            print("✗ Элемент <folder_code> не найден в metadata")
            return JsonResponse({'error': 'Нет <folder_code> в <metadata>'}, status=400)

        folder_code_text = folder_code_elem.text
        if folder_code_text is None:
            print("✗ У элемента <folder_code> нет текстового содержимого")
            return JsonResponse({'error': 'Элемент <folder_code> не содержит текста'}, status=400)

        folder_code = folder_code_text.strip()
        if not folder_code:
            print(f"✗ Элемент <folder_code> содержит только пробелы")
            return JsonResponse({'error': 'Элемент <folder_code> содержит только пробелы или пуст'}, status=400)

        print(f"✓ Код папки: '{folder_code}'")

        # Собираем метаданные
        all_metadata = {}
        print("\nВСЕ МЕТАДАННЫЕ из <metadata>:")
        for elem in metadata:
            if elem.text:
                all_metadata[elem.tag] = elem.text.strip()
                print(f"  - {elem.tag}: '{elem.text.strip()}'")

        # ПРОВЕРКА ДУБЛИКАТОВ
        duplicate_docs = Document.objects.filter(
            Q(code=doc_code) | Q(file_hash=file_hash)
        )

        if duplicate_docs.exists():
            duplicates_info = []
            for doc in duplicate_docs:
                duplicates_info.append({
                    'id': doc.id,
                    'code': doc.code,
                    'name': doc.name,
                    'file_hash': doc.file_hash,
                    'created_at': doc.created_at.isoformat(),
                    'is_same_hash': doc.file_hash == file_hash,
                    'is_same_code': doc.code == doc_code,
                })

            print(f"⚠ Найдены дубликаты: {len(duplicate_docs)}")

            # Если запрос содержит флаг "force", перезаписываем
            if request.POST.get('force') == 'true':
                print("✓ Используем принудительную перезапись (force=true)")
            else:
                # Возвращаем информацию о дубликатах для принятия решения клиентом
                return JsonResponse({
                    'duplicate_found': True,
                    'message': 'Найден документ с таким же кодом или содержимым',
                    'proposed_code': doc_code,
                    'file_hash': file_hash,
                    'duplicates': duplicates_info,
                    'options': {
                        'rename': f"Изменить код (например: {doc_code}_{uuid.uuid4().hex[:8]})",
                        'overwrite': "Перезаписать существующий документ",
                        'skip': "Пропустить загрузку"
                    }
                }, status=409)  # 409 Conflict

        # Ищем конкретную папку в указанной структуре
        print(f"\nПОИСК ПАПКИ: structure_id={structure_id}, code='{folder_code}'")
        try:
            folder = Folder.objects.get(structure_id=structure_id, code=folder_code)
            print(f"✓ Папка найдена: ID={folder.id}, '{folder.name}'")
        except Folder.DoesNotExist:
            print(f"✗ Папка не найдена в структуре {structure_id}")
            return JsonResponse({
                'error': f'Папка с кодом "{folder_code}" не найдена в указанной структуре',
                'suggestion': 'Проверьте structure_id и folder_code'
            }, status=404)

        # СОХРАНЕНИЕ
        with transaction.atomic():
            # Проверяем, не был ли документ уже загружен (на случай параллельных запросов)
            existing_doc = Document.objects.filter(code=doc_code).first()

            if existing_doc and request.POST.get('force') != 'true':
                # Если force не указан и документ уже появился
                return JsonResponse({
                    'duplicate_found': True,
                    'message': 'Документ с таким кодом уже существует',
                    'existing_document': {
                        'id': existing_doc.id,
                        'code': existing_doc.code,
                        'name': existing_doc.name
                    }
                }, status=409)

            # Создаем или обновляем документ
            if existing_doc and request.POST.get('force') == 'true':
                print(f"✓ Перезаписываем существующий документ ID={existing_doc.id}")
                document = existing_doc
                document.name = doc_name
                document.metadata = all_metadata
                document.file_hash = file_hash
                document.file_size = len(file_content)
                document.save()
                created = False
            else:
                print(f"✓ Создаем новый документ")
                document = Document.objects.create(
                    code=doc_code,
                    name=doc_name,
                    metadata=all_metadata,
                    xml_filename=uploaded_file.name,
                    file_path=f"/uploads/{uploaded_file.name}",
                    file_size=len(file_content),
                    file_hash=file_hash
                )
                created = True

            # Создаем связь с папкой
            fd, fd_created = FolderDocument.objects.get_or_create(
                folder=folder,
                document=document
            )

            if fd_created:
                print(f"✓ Связь создана с папкой '{folder.name}'")
            else:
                print(f"✓ Связь уже существует с папкой '{folder.name}'")

            # Ответ
            response_data = {
                'success': True,
                'action': 'overwritten' if (existing_doc and request.POST.get('force') == 'true') else 'created',
                'document': {
                    'id': document.id,
                    'code': document.code,
                    'name': document.name,
                    'file_hash': document.file_hash,
                    'created_at': document.created_at.isoformat(),
                    'is_new': created
                },
                'folder': {
                    'id': folder.id,
                    'code': folder.code,
                    'name': folder.name,
                    'structure': folder.structure.name
                },
                'association_created': fd_created
            }

            print(f"\n✓ УСПЕХ: {response_data}")
            return JsonResponse(response_data)

    except ET.ParseError as e:
        print(f"✗ Ошибка XML: {e}")
        return JsonResponse({'error': f'Ошибка в XML: {str(e)}'}, status=400)
    except Exception as e:
        import traceback
        print(f"✗ Ошибка: {e}")
        traceback.print_exc()
        return JsonResponse({'error': f'Ошибка обработки: {str(e)}'}, status=500)


@csrf_exempt
def handle_duplicate_decision(request):
    """Обработка решения при обнаружении дубликата"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Метод не разрешен'}, status=405)

    try:
        data = json.loads(request.body)
        decision = data.get('decision')  # 'rename', 'overwrite', 'skip'
        proposed_code = data.get('proposed_code')
        original_data = data.get('original_data')  # Данные из первоначального запроса

        if not decision or not original_data:
            return JsonResponse({'error': 'Недостаточно данных'}, status=400)

        if decision == 'skip':
            return JsonResponse({
                'success': True,
                'action': 'skipped',
                'message': 'Загрузка пропущена'
            })

        elif decision == 'rename':
            if not proposed_code or proposed_code == original_data.get('doc_code'):
                return JsonResponse({'error': 'Некорректный новый код'}, status=400)

            # Повторяем загрузку с новым кодом
            # Здесь нужно реализовать повторную загрузку с измененным кодом
            # Это может быть редирект на upload_single_document с модифицированными данными

            return JsonResponse({
                'success': True,
                'action': 'renamed',
                'new_code': proposed_code,
                'message': 'Документ будет загружен с новым кодом'
            })

        elif decision == 'overwrite':
            # Повторяем загрузку с флагом force
            return JsonResponse({
                'success': True,
                'action': 'overwrite_pending',
                'message': 'Документ будет перезаписан'
            })

        else:
            return JsonResponse({'error': 'Неизвестное решение'}, status=400)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Неверный JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'Ошибка: {str(e)}'}, status=500)


def api_test(request):
    """Тестовый endpoint"""
    return JsonResponse({
        'status': 'success',
        'message': 'Documents API работает!',
        'endpoints': {
            'upload': 'POST /api/documents/upload-single/',
            'test': 'GET /api/documents/test/',
            'handle_duplicate': 'POST /api/documents/handle-duplicate/'
        }
    })


# documents/views.py (дополнительные функции)

def get_document_details(request, document_id):
    """Получить детальную информацию о документе"""
    try:
        document = Document.objects.get(id=document_id)
        folders = FolderDocument.objects.filter(document=document).select_related('folder')

        response_data = {
            'id': document.id,
            'code': document.code,
            'name': document.name,
            'metadata': document.metadata,
            'xml_filename': document.xml_filename,
            'file_size': document.file_size,
            'file_hash': document.file_hash,
            'created_at': document.created_at.isoformat(),
            'updated_at': document.updated_at.isoformat(),
            'folders': [
                {
                    'id': fd.folder.id,
                    'code': fd.folder.code,
                    'name': fd.folder.name,
                    'structure_id': fd.folder.structure_id,
                    'structure_name': fd.folder.structure.name
                }
                for fd in folders
            ]
        }

        return JsonResponse(response_data)

    except Document.DoesNotExist:
        return JsonResponse({'error': 'Документ не найден'}, status=404)


def get_documents_by_folder(request, folder_id):
    """Получить все документы в папке"""
    try:
        folder = Folder.objects.get(id=folder_id)

        # Получаем документы через связующую таблицу
        folder_docs = FolderDocument.objects.filter(folder=folder).select_related('document')

        documents = []
        for fd in folder_docs:
            doc = fd.document
            documents.append({
                'id': doc.id,
                'code': doc.code,
                'name': doc.name,
                'file_size': doc.file_size,
                'file_hash': doc.file_hash,
                'created_at': doc.created_at.isoformat(),
                'attached_at': fd.created_at.isoformat()
            })

        response_data = {
            'folder': {
                'id': folder.id,
                'code': folder.code,
                'name': folder.name,
                'structure': folder.structure.name
            },
            'documents_count': len(documents),
            'documents': documents
        }

        return JsonResponse(response_data)

    except Folder.DoesNotExist:
        return JsonResponse({'error': 'Папка не найден'}, status=404)


def search_documents(request):
    """Поиск документов по различным критериям"""
    query = request.GET.get('q', '')
    folder_id = request.GET.get('folder_id')
    structure_id = request.GET.get('structure_id')
    hash_value = request.GET.get('hash')

    documents_qs = Document.objects.all()

    if query:
        documents_qs = documents_qs.filter(
            Q(code__icontains=query) |
            Q(name__icontains=query) |
            Q(metadata__icontains=query)
        )

    if hash_value:
        documents_qs = documents_qs.filter(file_hash=hash_value)

    if folder_id:
        folder_docs = FolderDocument.objects.filter(folder_id=folder_id)
        document_ids = folder_docs.values_list('document_id', flat=True)
        documents_qs = documents_qs.filter(id__in=document_ids)

    if structure_id:
        folders = Folder.objects.filter(structure_id=structure_id)
        folder_docs = FolderDocument.objects.filter(folder__in=folders)
        document_ids = folder_docs.values_list('document_id', flat=True)
        documents_qs = documents_qs.filter(id__in=document_ids)

    documents = []
    for doc in documents_qs[:100]:  # Ограничиваем результат
        documents.append({
            'id': doc.id,
            'code': doc.code,
            'name': doc.name,
            'file_size': doc.file_size,
            'file_hash': doc.file_hash,
            'created_at': doc.created_at.isoformat(),
        })

    return JsonResponse({
        'count': len(documents),
        'documents': documents
    })