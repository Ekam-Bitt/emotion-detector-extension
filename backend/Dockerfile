FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
ENV PIP_DEFAULT_TIMEOUT=1200

WORKDIR /app

COPY requirements.txt .
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential ca-certificates wget \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --upgrade pip setuptools wheel \
    && sed '/^torch==/d' requirements.txt > /tmp/reqs_no_torch.txt \
    && pip --no-cache-dir install -r /tmp/reqs_no_torch.txt \
    && pip --no-cache-dir install --index-url https://download.pytorch.org/whl/cpu/ torch==2.5.1

COPY . .

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "wsgi:app"]