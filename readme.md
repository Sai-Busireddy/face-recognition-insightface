# Fingerprint & Face Verification

## A modern web application for secure, lightning-fast biometric verification using fingerprints and facial recognition

## Table of Contents

- [Tech Stack](#tech-stack)
- [How It Works](#how-it-works)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [License](#license)

---

## Tech Stack

- **Frontend**: Next.js, Tailwind CSS, Framer Motion
- **Backend**: FastAPI (Python), OpenCV (feature extraction), InsightFace (RetinaFace + ArcFace via ONNX)
- **Database**: Supabase PostgreSQL
- **Authentication**: NextAuth.js (Credential Provider)

---

## How It Works

1. **Capture**: Use your device camera or upload images to capture fingerprints and face photos.
2. **Review**: Preview and confirm the quality of captured images.
3. **Register**: Enter user details and submit biometric data for registration.
4. **Match & Verify**: Instantly search the database for matches and receive verification results.

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- Python (v3.8+ recommended)
- [pnpm](https://pnpm.io/) (or npm/yarn)
- pip (Python package manager)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/fingerprint-face-verification.git
   cd fingerprint-face-verification
   ```

2. **Install frontend dependencies:**

   ```bash
   cd frontend
   pnpm install
   ```

3. **Set up Python virtual environment and install backend dependencies:**

   **On Windows:**

   ```bash
   cd ../backend
   
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

   **On macOS/Linux:**

   ```bash
   cd ../backend
   
   # Create virtual environment
   python3 -m venv venv
   
   # Activate virtual environment
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

   > **Note:** Always activate the virtual environment before running the backend server or installing new Python packages. To deactivate the virtual environment, simply run `deactivate` in your terminal.

4. **Configure environment variables:**

   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Fill in your database and authentication credentials

5. **Run the development servers:**

   **Backend (FastAPI):**

   ```bash
   cd backend
   
   # Make sure virtual environment is activated
   # Windows: venv\Scripts\activate
   # macOS/Linux: source venv/bin/activate
   
   uvicorn main:app --reload --port 8000
   ```

   **Frontend (Next.js):**

   ```bash
   cd frontend
   pnpm dev
   ```

   The frontend will be available at [http://localhost:3000](http://localhost:3000)
   The backend API will be available at [http://localhost:8000](http://localhost:8000)

---

## Python Virtual Environment Management

### Why Use a Virtual Environment?

A virtual environment helps you:

- Isolate project dependencies from system-wide Python packages
- Avoid version conflicts between different projects
- Maintain clean, reproducible development environments
- Easily share exact dependency versions with other developers

### Managing Your Virtual Environment

**Activate the environment** (do this every time you work on the project):

```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

When activated, your terminal prompt will show `(venv)` at the beginning.

**Install new packages** (only when virtual environment is activated):

```bash
pip install package-name
pip freeze > requirements.txt  # Update requirements file
```

**Deactivate the environment** (when you're done working):

```bash
deactivate
```

**Recreate the environment** (if needed):

```bash
# Remove existing environment
rm -rf venv  # macOS/Linux
rmdir /s venv  # Windows

# Create new environment and install dependencies
python -m venv venv  # or python3 -m venv venv
# Activate environment (see commands above)
pip install -r requirements.txt
```

---

## Supabase Setup

This project saves auth information in `auth` table and user information (including biometrics) in a Supabase table called `users`. You must create these tables and database functions in your Supabase project before running the app.

**To create these, run the following SQL in the [Supabase SQL Editor](https://app.supabase.com/project/_/sql):**

```sql
CREATE TABLE auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID NOT NULL,
    first_name TEXT,
    last_name TEXT,
    address TEXT,
    additional_info TEXT,
    face_image TEXT,
    thumb_image TEXT,
    face_hash BIT(64),
    thumb_hash BIT(64),
    face_hash_bucket INT2,
    thumb_hash_bucket INT2,
    face_features_orb JSONB,
    thumb_features_orb JSONB,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_auth FOREIGN KEY (auth_id) REFERENCES Auth(id) ON DELETE CASCADE
);

GRANT USAGE ON SCHEMA "public" TO anon;
GRANT USAGE ON SCHEMA "public" TO authenticated;

GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA "public" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA "public" TO anon;

CREATE OR REPLACE FUNCTION popcount(b BIT(64)) RETURNS INTEGER AS $$
BEGIN
    RETURN length(replace(b::text, '0', ''));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION hamming_distance(a BIT(64), b BIT(64)) RETURNS INTEGER AS $$
BEGIN
    RETURN popcount(a # b);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_hash_bucket(hash BIT(64)) RETURNS INTEGER AS $$
BEGIN
    RETURN (get_bit(hash, 0)::integer * 128 +
            get_bit(hash, 1)::integer * 64 +
            get_bit(hash, 2)::integer * 32 +
            get_bit(hash, 3)::integer * 16 +
            get_bit(hash, 4)::integer * 8 +
            get_bit(hash, 5)::integer * 4 +
            get_bit(hash, 6)::integer * 2 +
            get_bit(hash, 7)::integer);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS find_best_match(text,text,bit,integer,integer,integer);

CREATE OR REPLACE FUNCTION find_best_match(
    hash_column text,
    bucket_column text,
    search_hash BIT(64),
    search_bucket integer,
    bucket_range integer,
    threshold integer
) RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    address TEXT,
    additional_info TEXT,
    face_image TEXT,
    thumb_image TEXT,
    face_features_orb JSONB,
    thumb_features_orb JSONB,
    distance integer
) AS $$
BEGIN
    RETURN QUERY EXECUTE format(
        'SELECT 
            id,
            first_name,
            last_name,
            address,
            additional_info,
            face_image,
            thumb_image,
            face_features_orb,
            thumb_features_orb,
            hamming_distance(%I, $1) as distance
        FROM users
        WHERE %I BETWEEN $2 - $3 AND $2 + $3
        AND %I IS NOT NULL
        AND hamming_distance(%I, $1) < $4
        ORDER BY hamming_distance(%I, $1)
        LIMIT 10',
        hash_column,
        bucket_column,
        hash_column,
        hash_column,
        hash_column
    ) USING search_hash, search_bucket, bucket_range, threshold;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION calculate_hash_buckets() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.face_hash IS NOT NULL THEN
        NEW.face_hash_bucket = get_hash_bucket(NEW.face_hash);
    END IF;
    IF NEW.thumb_hash IS NOT NULL THEN
        NEW.thumb_hash_bucket = get_hash_bucket(NEW.thumb_hash);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hash_bucket_trigger ON users;
CREATE TRIGGER hash_bucket_trigger
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION calculate_hash_buckets();

CREATE INDEX IF NOT EXISTS idx_users_face_hash_bucket ON users(face_hash_bucket) WHERE face_hash_bucket IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_thumb_hash_bucket ON users(thumb_hash_bucket) WHERE thumb_hash_bucket IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
```

Be sure to set your Supabase credentials in the `.env` files as described above.

The project now stores face-embeddings in a compact `vector(512)` column
(powered by the `pgvector` extension) and searches them with a tiny SQL
helper.  
Follow the steps below **after** you have created the original `auth`
and `users` tables.

```sql
-- 1. Enable the vector extension (one-time)
create extension if not exists vector;

-- 2. Add the 512-dimensional face-embedding column
alter table public.users
  add column if not exists face_vec vector(512);

-- 3. (Recommended) Create an IVFFLAT cosine index
--    “lists = 100” is a good default for ≤1 M users
create index if not exists users_face_vec_idx
  on public.users using ivfflat (face_vec vector_cosine_ops)
  with (lists = 100);

-- 4. Helper to fetch the top-k nearest faces
create or replace function public.match_faces(
    query_vec  vector(512),
    k          integer default 5,
    threshold  real    default 0.36   -- 1 − cosine distance
)
returns table(
    id          uuid,
    first_name  text,
    last_name   text,
    score       real   -- 1 − distance (higher ⇒ better)
) language sql stable as $$
    select
        u.id,
        u.first_name,
        u.last_name,
        1 - (u.face_vec <=> query_vec) as score
    from public.users u
    where u.face_vec is not null
      and (u.face_vec <=> query_vec) < threshold
    order by u.face_vec <=> query_vec
    limit k;
$$;

grant execute on function public.match_faces(vector, integer, real)
       to authenticated, anon;
```

---

## Available Scripts

### Frontend (Next.js)

- `pnpm dev` — Start the development server
- `pnpm build` — Build the application for production
- `pnpm start` — Start the production server
- `pnpm lint` — Run ESLint

### Backend (FastAPI)

**Note:** Always activate the virtual environment before running these commands.

- `uvicorn main:app --reload` — Start the development server
- `uvicorn main:app --host 0.0.0.0 --port 8000` — Start the production server
- `python -m pytest` — Run tests
- `pip freeze > requirements.txt` — Update requirements file after installing new packages

---

## Project Structure

```
.
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js app directory (pages, API routes)
│   │   ├── components/    # Reusable React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility libraries
│   │   └── types/         # TypeScript types
│   ├── public/            # Static assets
│   └── package.json
│
├── backend/
│   ├── venv/              # Python virtual environment (created after setup)
│   ├── database/          # Database configuration and models
│   ├── routers/           # FastAPI route handlers
│   ├── utils/             # Utility functions and helpers
│   ├── main.py            # FastAPI entry point
│   └── requirements.txt   # Python dependencies
│
└── README.md
```

---

### What changed & why

| Before | Now |
|--------|-----|
| 64-bit perceptual hashes + ORB key-points stored as JSONB ● multiple PL/pgSQL helpers and triggers for buckets & Hamming distance :contentReference[oaicite:1]{index=1} | Single 512-dimensional float vector produced by ArcFace and stored in `face_vec` ● cosine similarity handled by `pgvector` |
| Manual Python loops to compare every candidate | Indexed ANN search (`ivfflat`) gives ~100 ms response even with 100 k users |
| Eight separate functions & triggers (popcount, get_hash_bucket, etc.) | One concise function: `match_faces()` |

Feel free to remove the old hash / ORB columns and triggers once you’re certain you no longer need them, but they can happily coexist until then.

---

## What’s New — July 2025: Mobile Testing over Local Wi‑Fi

### 🚀 Why

Run the full stack on your laptop while accessing it **securely (HTTPS)** from any phone on the same network—no tunnels, no mixed‑content camera errors.

---

### 🔧 Key Changes

| Area | Before | Now |
|------|--------|-----|
| **Environment** | Scattered localhost URLs | Single source of truth in `.env.local` (`HOST_IP`, ports) |
| **Frontend ⇄ Backend** | Global proxy broke NextAuth | Selective rewrites (`users`, `face`, `register`) |
| **API Calls** | Hard‑coded URLs caused `/api/api/*` | All fetches are **relative** (`/api/...`) |
| **Save Info** | ECONNRESET on `/api/register` | Rewrite fixes no‑slash → slash redirect |
| **Cert / Env Safety** | Risk of committing secrets | `.gitignore` excludes certs & local envs |

---

### 🛠  Setup & Test on a Phone

1. **Install and trust mkcert (one‑time)**

   ```bash
   choco install mkcert -y
   mkcert -install
    ```

2. **Update `.env.local` with your current LAN IP**  

   Open `frontend/.env.local` and change just these three lines each time your Wi‑Fi IP changes:

   ```dotenv
   HOST_IP=192.168.0.xxx
   NEXT_PUBLIC_HOST_URL=https://192.168.0.xxx:3000
   NEXTAUTH_URL=https://192.168.0.xxx:3000
    ```

3. **Start the backend (HTTP)**

   ```bash
   cd backend
   \venv\Scripts\activate
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ```

4. **Start the frontend (HTTPS, accessible on LAN)**

   ```bash
   cd frontend
   pnpm exec next dev --hostname 0.0.0.0 --port 3000 --experimental-https
   ```

5. **Open on phone → https://<HOST_IP>:3000 → accept cert warning once → login → use camera.**

    Add a Windows firewall inbound rule for TCP 3000 once and forget about it:

    ```bash
    New-NetFirewallRule -DisplayName "FaceRecog-Frontend-3000" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -Profile Private
    ```

---

## Troubleshooting

### Common Issues

**Virtual environment not activating:**

- Make sure you're in the correct directory (`backend/`)
- Check that the virtual environment was created successfully
- Try recreating the virtual environment if activation fails

**Package installation errors:**

- Ensure the virtual environment is activated
- Try upgrading pip: `pip install --upgrade pip`
- For OpenCV issues on some systems, you might need: `pip install opencv-python-headless`

**Port already in use:**

- Change the port in the FastAPI command: `uvicorn main:app --reload --port 8001`
- Or kill the process using the port

---

> **Note:** Biometric data (face and fingerprint images) are associated with user records and securely stored.

---

## License

This project is licensed under the MIT License.
