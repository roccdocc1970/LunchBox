-- 006_hybrid_search.sql
-- Roadmap Step 8 (ID 17): hybrid retrieval = keyword search + meaning (vector) search, merged by rank.
--
-- Why: vector search finds passages by meaning but can miss exact codes, numbers and names
-- ("Form PU-7", "extension 4417"); keyword search finds exact words but misses paraphrases.
-- Reciprocal rank fusion (RRF) merges the two ranked lists: each passage scores 1/(60 + rank) in every
-- list it appears in; the scores are added. No tuning of incompatible score scales is needed.
--
-- Design rules (same as 005):
--  * SECURITY INVOKER (the default): RLS applies to every search, so a school never sees another's passages;
--  * only new objects and one added column — nothing is dropped or rewritten, and match_policy_chunks
--    (the Step 7 search) keeps working unchanged, so the two can be compared side by side.
--
-- Run in the Supabase SQL editor. Existing rows are filled in automatically (generated column).

-- 1. A keyword index over each chunk: its heading plus its text, stemmed English ("pickups" ~ "pickup").
alter table public.policy_chunks
  add column if not exists content_tsv tsvector
  generated always as (to_tsvector('english', coalesce(heading, '') || ' ' || content)) stored;

create index if not exists policy_chunks_tsv_idx on public.policy_chunks using gin (content_tsv);

-- 2. Hybrid search. Takes BOTH the question's embedding (for meaning) and the question text (for keywords).
create or replace function public.match_policy_chunks_hybrid(
  query_embedding extensions.vector(384),
  query_text      text,
  match_count     int default 4
)
returns table (
  chunk_id       uuid,
  document_id    uuid,
  document_title text,
  heading        text,
  content        text,
  similarity     double precision,   -- cosine similarity (meaning); comparable with match_policy_chunks
  rrf_score      double precision,   -- fused rank score; higher is better
  vector_rank    int,                -- position in the meaning list (null = not in its top 20)
  keyword_rank   int,                -- position in the keyword list (null = no keyword match)
  document_date  timestamptz
)
language sql
stable
set search_path = public, extensions
as $$
  with q as (
    -- Any-word match: plainto_tsquery joins words with AND, which is too strict for a whole question,
    -- so the ANDs are swapped for ORs and ranking sorts out which passages match the most words.
    select replace(plainto_tsquery('english', query_text)::text, '&', '|')::tsquery as tsq
  ),
  vec as (
    select c.id, (row_number() over (order by c.embedding <=> query_embedding))::int as r
      from public.policy_chunks c
     order by c.embedding <=> query_embedding
     limit 20
  ),
  kw as (
    select c.id, (row_number() over (order by ts_rank_cd(c.content_tsv, q.tsq) desc))::int as r
      from public.policy_chunks c, q
     where c.content_tsv @@ q.tsq
     order by ts_rank_cd(c.content_tsv, q.tsq) desc
     limit 20
  ),
  fused as (
    select coalesce(vec.id, kw.id) as id,
           coalesce(1.0 / (60 + vec.r), 0) + coalesce(1.0 / (60 + kw.r), 0) as score,
           vec.r as vr, kw.r as kr
      from vec full outer join kw on vec.id = kw.id
  )
  select c.id, c.document_id, d.title, c.heading, c.content,
         1 - (c.embedding <=> query_embedding) as similarity,
         f.score::double precision, f.vr, f.kr, d.created_at
    from fused f
    join public.policy_chunks c on c.id = f.id
    join public.policy_documents d on d.id = c.document_id
   order by f.score desc
   limit least(match_count, 10)
$$;

revoke all on function public.match_policy_chunks_hybrid(extensions.vector, text, int) from public, anon;
grant execute on function public.match_policy_chunks_hybrid(extensions.vector, text, int) to authenticated;
