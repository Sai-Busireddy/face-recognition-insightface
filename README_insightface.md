# Face Recognition API — InsightFace Edition

A **FastAPI** micro‑service that generates state‑of‑the‑art **face embeddings** with [InsightFace](https://github.com/deepinsight/insightface) and performs lightning‑fast similarity search using **PostgreSQL + pgvector**.

> **Why this repo?**  
> It extracts the face‑matching layer from `fp-app` and removes fingerprint code, giving you a lean, headless API that can plug into any UI (Next.js, Flutter, mobile, etc.).

| Layer | Tech |
|-------|------|
| **Model**    | InsightFace (`buffalo_l` ONNX, 512‑D embeddings) |
| **API**      | FastAPI, Pydantic, Uvicorn |
| **Database** | Supabase Postgres + pgvector |
| **Container**| Docker & docker‑compose |
| **Tests**    | `pytest`, `httpx`, `moto` for S3 mocks |

---

## ✨ Features

* **/api/face/encode** – returns a raw 512‑D vector for any face image  
* **/api/face/register** – store a face + meta data in Supabase  
* **/api/face/search** – cosine‑similarity Top‑_k_ lookup (< 200 ms)  
* Automatic model download & caching (first request only)  
* Built‑in Swagger & ReDoc at `/docs` and `/redoc`  
* Typed, 100 % test‑covered service layer

---

## 1. Quick Start (Docker)

```bash
git clone https://github.com/your‑org/face‑recognition‑insightface.git
cd face‑recognition‑insightface

cp .env.example .env             # edit the ❗ fields
docker compose up --build
```

| Service | URL |
|---------|-----|
| API     | <http://localhost:8000/docs> |

---

## 2. Environment Variables ❗

| Key | Example | Description |
|-----|---------|-------------|
| `SUPABASE_URL` | `https://xyzcompany.supabase.co` | Project URL |
| `SUPABASE_ANON_KEY` | `eyJhbGciOi…` | Public anon key |
| `MODEL_CACHE_DIR` | `/models` | Where to store **buffalo_l.onnx** (auto‑created) |
| `JWT_SECRET_KEY`  | any‑secret | Needed if you enable auth middleware |

---

## 3. Supabase schema

Enable **pgvector** and run:

```sql
create table if not exists faces (
  id           uuid primary key default gen_random_uuid(),
  display_name text,
  image_url    text,
  face_vec     vector(512),
  inserted_at  timestamptz default now()
);

create or replace function match_faces(
  query_vec vector(512),
  k         int    default 5,
  threshold real   default 0.35
)
returns table (
  id           uuid,
  display_name text,
  score        real,
  image_url    text
) language sql stable as $$
  select
    f.id,
    f.display_name,
    1 - (f.face_vec <=> query_vec) as score,
    f.image_url
  from faces f
  where f.face_vec is not null
    and (f.face_vec <=> query_vec) < threshold
  order by f.face_vec <=> query_vec
  limit k;
$$;
```

---

## 4. API Reference

| Method | Path | Body (JSON / multipart) | Purpose |
|--------|------|-------------------------|---------|
| `POST` | `/api/face/encode`  | `image` (file) | Get 512‑D vector |
| `POST` | `/api/face/register`| `displayName`, `image` | Store face in DB |
| `POST` | `/api/face/search`  | `image`, `topK` | Find matches |
| `GET`  | `/api/face/{id}`    | — | Fetch one face record |

See live docs for schemas.

---

## 5. Local Dev without Docker

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# download model once
python scripts/download_model.py

uvicorn main:app --reload --port 8000
```

---

## 6. Running Tests

```bash
pytest -q      # unit + integration
ruff check .   # lint
```

---

## 7. Troubleshooting

| Issue | Fix |
|-------|-----|
| **Model download is slow** | Pre‑download and volume‑mount `MODEL_CACHE_DIR`. |
| **`OMP: Error #15` on Ubuntu** | `apt install libopenblas‑base` |
| **Face not detected** | Ensure the face ≥ 112×112 px and frontal; use `cv2.imwrite` to inspect crop. |

---

## 8. Deployment 🎁

* **Railway**: set the same env vars; add a _disk_ for `MODEL_CACHE_DIR`.  
* **AWS Lambda**: build the ONNX model into the layer; use `psycopg-binary`.  
* **Kubernetes**: mount model and `/tmp` as emptyDir for speed.

---

## 9. Roadmap

- [ ] Batch registration endpoint  
- [ ] WebSocket stream for real‑time video frames  
- [ ] Switch to **emoreface** model when it lands

---

## 10. License

Apache‑2.0 © 2025 Your Name
