# backend/Dockerfile
FROM python:3.11-slim
WORKDIR /app

# Install python deps
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy backend app
COPY backend/ /app/backend
WORKDIR /app/backend

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

# Use uvicorn to run FastAPI. Adjust the module path if your app object location differs.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]