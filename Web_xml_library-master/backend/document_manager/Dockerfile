FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Собираем статику (если есть)
RUN python manage.py collectstatic --noinput || true

EXPOSE 8000

# Для разработки — runserver
# CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# Для продакшена — gunicorn (рекомендую)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]