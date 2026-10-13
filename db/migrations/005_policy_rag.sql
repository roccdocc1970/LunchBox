-- 005_policy_rag.sql
-- Roadmap Step 7 (ID 4): policy documents for retrieval-augmented generation (RAG).
-- A school's policy documents are split into chunks; each chunk is stored with a vector (embedding)
-- so the chat agent can find the passages most relevant to a question and answer from them.
--
-- Design rules (lessons from Steps 1-4, applied from the start):
--  * every table has RLS and every policy is `to authenticated` (anonymous callers get nothing);
--  * school isolation is enforced by the database: admin = own school; staff = READ only, own school;
--  * the search function is SECURITY INVOKER (the default), so RLS applies to every search —
--    a school can never retrieve another school's passages, whatever the model asks for;
--  * policy_documents changes are audited (the Step 4 audit trigger), because who changed a school's
--    policies is an accountability question; chunks are not (high volume, derived data);
--  * the vector column has a FIXED size (384 = the local embedding model in api/_lib/embed.js);
--    changing the embedding model later means re-embedding every document.
--
-- Run in the Supabase SQL editor. It only creates new objects (no destructive warning expected).
-- No vector index is created on purpose: at this size a sequential scan is fast, and an index
-- (hnsw) can be added when a school has thousands of chunks.

create extension if not exists vector with schema extensions;

create table if not exists public.policy_documents (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  filename    text,
  uploaded_by uuid,
  chunk_count integer not null default 0,
  char_count  integer not null default 0,
  created_at  timestamptz not null default now()      -- doubles as "version date" shown in citations
);

create table if not exists public.policy_chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.policy_documents(id) on delete cascade,
  school_id   uuid not null references auth.users(id) on delete cascade,
  chunk_index integer not null,
  heading     text,                                    -- section path, e.g. "Parent Handbook > Late pickup"
  content     text not null,
  embedding   extensions.vector(384) not null,
  created_at  timestamptz not null default now()
);

create index if not exists policy_chunks_document_idx on public.policy_chunks (document_id);
create index if not exists policy_documents_school_idx on public.policy_documents (school_id);

alter table public.policy_documents enable row level security;
alter table public.policy_chunks    enable row level security;

revoke all on public.policy_documents, public.policy_chunks from anon, authenticated;
grant select, insert, update, delete on public.policy_documents, public.policy_chunks to authenticated;

-- School admin: full control of their own school's policies.
create policy "admin manage policy documents" on public.policy_documents
  for all to authenticated
  using (school_id = auth.uid()) with check (school_id = auth.uid());
create policy "admin manage policy chunks" on public.policy_chunks
  for all to authenticated
  using (school_id = auth.uid()) with check (school_id = auth.uid());

-- Staff: may read their own school's policies (so chat can answer their questions); never change them.
create policy "staff read policy documents" on public.policy_documents
  for select to authenticated using (school_id = public.get_staff_school_id());
create policy "staff read policy chunks" on public.policy_chunks
  for select to authenticated using (school_id = public.get_staff_school_id());

-- Find the passages closest in meaning to a question (cosine distance). SECURITY INVOKER: RLS applies.
create or replace function public.match_policy_chunks(
  query_embedding extensions.vector(384),
  match_count int default 4
)
returns table (
  chunk_id       uuid,
  document_id    uuid,
  document_title text,
  heading        text,
  content        text,
  similarity     double precision,
  document_date  timestamptz
)
language sql
stable
set search_path = public, extensions
as $$
  select c.id, c.document_id, d.title, c.heading, c.content,
         1 - (c.embedding <=> query_embedding) as similarity,
         d.created_at
    from public.policy_chunks c
    join public.policy_documents d on d.id = c.document_id
   order by c.embedding <=> query_embedding
   limit least(match_count, 10)
$$;

revoke all on function public.match_policy_chunks(extensions.vector, int) from public, anon;
grant execute on function public.match_policy_chunks(extensions.vector, int) to authenticated;

-- Audit changes to policy documents (uses the Step 4 trigger function; needs id and school_id columns).
drop trigger if exists audit_row_change on public.policy_documents;
create trigger audit_row_change
  after insert or update or delete on public.policy_documents
  for each row execute function public.audit_row_change();
