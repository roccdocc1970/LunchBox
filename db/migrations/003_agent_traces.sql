-- 003_agent_traces.sql
-- Roadmap item 2 (tracing): one row per chat request, recording the story of that request —
-- each model call and tool call with timing, token counts and result SIZES. It stores
-- metadata, not payloads: no tool results and no student data, only a short truncated
-- copy of the question for debugging.
--
-- Lessons from item 0 applied here: every policy is `to authenticated` (not "all roles");
-- there is NO update policy and no UPDATE privilege (a trace, once written, is immutable);
-- anonymous callers have no privileges at all; staff can only see their own traces.
--
-- Run in the Supabase SQL editor, then re-run `npm run test:isolation` (the table is in its list).

create table if not exists public.agent_traces (
  id                    uuid primary key default gen_random_uuid(),
  school_id             uuid not null references auth.users(id) on delete cascade,
  user_id               uuid not null references auth.users(id) on delete cascade,
  created_at            timestamptz not null default now(),
  question              text,                -- truncated to 200 characters by the writer
  question_chars        integer,
  outcome               text not null,       -- reply | view | pending_action | navigate | max_turns | error
  model                 text,
  duration_ms           integer,
  model_calls           integer,
  input_tokens          integer,
  output_tokens         integer,
  cache_read_tokens     integer,
  cache_creation_tokens integer,
  steps                 jsonb not null default '[]'::jsonb,
  error                 text                 -- truncated to 300 characters by the writer
);

create index if not exists agent_traces_school_created_idx
  on public.agent_traces (school_id, created_at desc);

alter table public.agent_traces enable row level security;

-- Privileges: no anonymous access; signed-in users may read, add and delete (never update).
revoke all on public.agent_traces from anon, authenticated;
grant select, insert, delete on public.agent_traces to authenticated;

-- School admin: reads every trace for their school, records their own, may delete (retention).
create policy "admin read traces" on public.agent_traces
  for select to authenticated using (school_id = auth.uid());
create policy "admin insert traces" on public.agent_traces
  for insert to authenticated with check (school_id = auth.uid() and user_id = auth.uid());
create policy "admin delete traces" on public.agent_traces
  for delete to authenticated using (school_id = auth.uid());

-- Staff: record their own traces and read only their own.
create policy "staff insert own traces" on public.agent_traces
  for insert to authenticated
  with check (school_id = public.get_staff_school_id() and user_id = auth.uid());
create policy "staff read own traces" on public.agent_traces
  for select to authenticated
  using (school_id = public.get_staff_school_id() and user_id = auth.uid());
