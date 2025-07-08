-- Ensure pgvector is ready (safe to run if it already exists)
create extension if not exists vector;

-- ------------------------------------------------------------------
-- 1. Public-profile face table
-- ------------------------------------------------------------------
create table if not exists public_profiles (
  id           uuid primary key default gen_random_uuid(),
  platform     text            not null,      -- e.g. 'twitter'
  profile_id   text            not null,      -- e.g. '12345678' or '@handle'
  display_name text,
  image_url    text,
  face_vec     vector(512),                   -- InsightFace embedding
  inserted_at  timestamptz     default now(),
  unique (platform, profile_id)               -- avoid duplicates
);

-- 2. Cosine index – lists=10 is fine for ~10–20 k rows
create index if not exists public_profiles_vec_idx
  on public_profiles using ivfflat (face_vec vector_cosine_ops)
  with (lists = 10);

-- 3. Make sure your API key roles can read / write
grant select, insert, update, delete
  on public_profiles to authenticated, anon;   -- adjust if you lock anon out

-- 4. Matcher helper function
create or replace function public.match_public_faces(
    query_vec vector(512),
    k         integer default 5,
    threshold real    default 0.36
)
returns table (
    id          uuid,
    display_name text,
    score       real,      -- 1 – cosine distance
    platform    text
) language sql stable as $$
    select
        p.id,
        p.display_name,
        1 - (p.face_vec <=> query_vec) as score,
        p.platform
    from public_profiles p
    where p.face_vec is not null
      and (p.face_vec <=> query_vec) < threshold
    order by p.face_vec <=> query_vec
    limit k;
$$;

grant execute on function public.match_public_faces(vector, integer, real)
  to authenticated, anon;

