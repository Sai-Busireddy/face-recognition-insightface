# Fingerprint & Face Verification

## A modern web application for secure, lightning-fast biometric verification using fingerprints and facial recognition.

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
- **Backend**: Next.js API routes, Supabase
- **Database**: supabase
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
- [pnpm](https://pnpm.io/) (or npm/yarn)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/fingerprint-face-verification.git
   cd fingerprint-face-verification
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Configure environment variables:**

   - Copy `.env.example` to `.env` and fill in your database and authentication credentials.

4. **Run the development server:**
   ```bash
   pnpm dev
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Supabase Setup

This project saves auth information in `auth` table and user information (including biometrics) in a Supabase table called `users`. You must create this tables and some db level functions to trigger in your Supabase project before running the app.

**To create these, run the following SQL in the [Supabase SQL Editor](https://app.supabase.com/project/_/sql):**

```sql
-- Auth table
CREATE TABLE auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Users table with foreign key to Auth
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
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_auth FOREIGN KEY (auth_id) REFERENCES Auth(id) ON DELETE CASCADE
);
grant usage on schema "public" to anon;
grant usage on schema "public" to authenticated;

GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA "public" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA "public" TO anon;

-- Function to calculate Hamming weight (population count)
CREATE OR REPLACE FUNCTION popcount(b BIT(64)) RETURNS INTEGER AS $$
BEGIN
    RETURN length(replace(b::text, '0', ''));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate Hamming distance between two bit strings
CREATE OR REPLACE FUNCTION hamming_distance(a BIT(64), b BIT(64)) RETURNS INTEGER AS $$
BEGIN
    RETURN popcount(a # b); -- # is the XOR operator
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get hash bucket (based on first 8 bits)
CREATE OR REPLACE FUNCTION get_hash_bucket(hash BIT(64)) RETURNS INTEGER AS $$
BEGIN
    -- Convert first 8 bits to integer (0-255)
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

-- Function to find best match
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
            hamming_distance(%I, $1) as distance
        FROM users
        WHERE %I BETWEEN $2 - $3 AND $2 + $3
        AND %I IS NOT NULL
        AND hamming_distance(%I, $1) < $4
        ORDER BY hamming_distance(%I, $1)
        LIMIT 1',
        hash_column,
        bucket_column,
        hash_column,
        hash_column,
        hash_column
    ) USING search_hash, search_bucket, bucket_range, threshold;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger function to automatically calculate hash buckets
CREATE OR REPLACE FUNCTION calculate_hash_buckets()
RETURNS TRIGGER AS $$
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

-- Create trigger
DROP TRIGGER IF EXISTS hash_bucket_trigger ON users;
CREATE TRIGGER hash_bucket_trigger
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION calculate_hash_buckets();

```

Be sure to set your Supabase credentials in the `.env` file as described above.

---

## Available Scripts

- `pnpm dev` — Start the development server
- `pnpm build` — Build the application for production
- `pnpm start` — Start the production server
- `pnpm lint` — Run ESLint
- `pnpm test:generate` — Generate test data

---

## Project Structure

```
.
├── src/
│   ├── app/           # Next.js app directory (pages, API routes)
│   ├── components/    # Reusable React components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility libraries
│   ├── types/         # TypeScript types
│
├── public/            # Static assets
├── scripts/           # Utility scripts
├── package.json
└── README.md
```

---

> **Note:** Biometric data (face and fingerprint images) are associated with user records and securely stored.

---

## License

This project is licensed under the MIT License.
