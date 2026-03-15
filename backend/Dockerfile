# ============================================
# CrossBorder Analyst — Backend Dockerfile
# Multi-stage : builder + runtime slim
# ============================================

FROM python:3.11-slim AS builder

WORKDIR /build

# Dépendances système pour compiler faiss-cpu / scipy
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ============================================
# Stage runtime
# ============================================
FROM python:3.11-slim AS runtime

WORKDIR /app

# Copier les dépendances installées
COPY --from=builder /install /usr/local

# Copier le code applicatif
COPY app/ ./app/
COPY ml_models/ ./ml_models/

# Utilisateur non-root
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

ENV PYTHONPATH=/app/app
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
