-- 1. make sure the extension is on
create extension if not exists vector;

-- 2. add the embedding column
alter table public.users
  add column if not exists face_vec vector(512);

-- 3. optional ANN index
create index if not exists users_face_vec_idx
  on public.users using ivfflat (face_vec vector_cosine_ops)
  with (lists = 100);

-- 4. matcher helper
create or replace function public.match_faces(
    query_vec  vector(512),
    k          integer   default 5,
    threshold  real      default 0.36
)
returns table(
    id          uuid,
    first_name  text,
    last_name   text,
    score       real
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