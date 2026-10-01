FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy source tree
COPY backend /app/backend
COPY sql /app/sql

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV WAREHOUSE_BACKEND=clickhouse
ENV CLICKHOUSE_HOST=clickhouse
ENV CLICKHOUSE_PORT=8123
ENV CLICKHOUSE_DATABASE=mb_olap_v2
ENV CLICKHOUSE_USER=default
ENV CLICKHOUSE_PASSWORD=""
ENV PORT=8000

EXPOSE 8000

CMD ["python", "backend/run.py"]
