# ---- Base image ------------------------------------------------------
FROM python:3.10-slim AS runtime

# ---- OS libs (tiny, no build-tools) ----------------------------------
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        libgl1 libglib2.0-0 build-essential g++ && \
    rm -rf /var/lib/apt/lists/*

# ---- Python deps -----------------------------------------------------
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ---- App code --------------------------------------------------------
COPY . .

# Persist downloaded InsightFace models so they survive rebuilds
VOLUME ["/root/.insightface"]

# ---- Runtime ---------------------------------------------------------
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
