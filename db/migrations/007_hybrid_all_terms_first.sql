-- 007_hybrid_all_terms_first.sql
-- Roadmap Step 8 (ID 17): improves the keyword half of hybrid search found weak in the 006 evaluation.
--
-- Finding: for "Who is at extension 4471?" the keyword list ranked "Who to call" (the word "extension"
-- repeated five times) above "Athletics contacts" (the only passage containing 4471). Postgres ts_rank_cd
-- counts how often query words occur but does not weigh them by rarity (no inverse document frequency),
-- so a rare, decisive term (4471) was outweighed by a common one (extension).
--
-- Fix: within the keyword list, passages that contain ALL the question's meaningful words rank first;
-- the remaining passages follow, ordered by the same score as before. For long conversational questions
-- no passage contains every word, so behaviour is unchanged for them.
--
-- Same name and signature as 006, so this simply replaces the function (create or replace).
-- Run in the Supabase SQL editor. Expect "Success. No rows returned."

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
  similarity     double precision,
  rrf_score      double precision,
  vector_rank    int,
  keyword_rank   int,
  document_date  timestamptz
)
language sql
stable
set search_path = public, extensions
as $$
  with q as (
    select plainto_tsquery('english', query_text) as all_terms,                                   -- every word required
           replace(plainto_tsquery('english', query_text)::text, '&', '|')::tsquery as any_term   -- any word
  ),
  vec as (
    select c.id, (row_number() over (order by c.embedding <=> query_embedding))::int as r
      from public.policy_chunks c
     order by c.embedding <=> query_embedding
     limit 20
  ),
  kw as (
    select c.id,
           (row_number() over (order by (c.content_tsv @@ q.all_terms) desc,
                                        ts_rank_cd(c.content_tsv, q.any_term) desc))::int as r
      from public.policy_chunks c, q
     where c.content_tsv @@ q.any_term
     order by (c.content_tsv @@ q.all_terms) desc, ts_rank_cd(c.content_tsv, q.any_term) desc
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
