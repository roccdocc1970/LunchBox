-- 004_audit_log.sql
-- Roadmap item 15 (audit log): a permanent, append-only record of WHO changed WHAT, and which
-- changes an agent proposed and a human approved. Two layers:
--   (B) database triggers on selected sensitive tables — capture every change by ANY path
--       (screens, chat, MCP server, SQL editor), with old and new values and the actor;
--   (A) record_agent_approval() — called by the chat confirm endpoint, records the "why":
--       this change was proposed by the agent and approved by this person.
--
-- Selected tables: students, parents, staff, incidents, student_health, student_health_entries,
-- report_cards, donations. Not audited on purpose: high-volume or low-risk tables (attendance,
-- grade history, enrollments, scheduling, rooms…) — add a table later with one line (see the end).
--
-- Design rules (lessons from items 0 and 2):
--  * nobody can write the log through the API: no INSERT/UPDATE/DELETE privilege for any API role;
--    only the trigger function and record_agent_approval() (both SECURITY DEFINER, pinned
--    search_path) insert;
--  * append-only even for the table owner: a trigger blocks UPDATE, DELETE and TRUNCATE
--    (retention will need a deliberate, separate procedure);
--  * only a school's admin can read its log; staff cannot; anonymous callers have nothing;
--  * the log has no foreign keys, so deleting a user or school never deletes its history;
--  * the log contains sensitive old/new values, so it is protected like the tables it watches.
--
-- Run in the Supabase SQL editor. It only creates new objects (no destructive warning expected).

create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  school_id   uuid,                                   -- owning school, taken from the changed row
  actor_id    uuid,                                   -- auth.uid() when the change happened
  actor_kind  text not null check (actor_kind in ('user', 'service')),  -- 'service' = no signed-in user
  table_name  text not null,                          -- audited table, or 'agent_action' for approvals
  row_id      uuid,                                   -- id of the changed row (or the target student)
  action      text not null check (action in ('INSERT', 'UPDATE', 'DELETE', 'AGENT_APPROVED')),
  changes     jsonb                                   -- INSERT/DELETE: the row; UPDATE: {column:{old,new}}
);

create index if not exists audit_log_school_time_idx on public.audit_log (school_id, occurred_at desc);
create index if not exists audit_log_row_idx on public.audit_log (table_name, row_id);

alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

create policy "admin read audit log" on public.audit_log
  for select to authenticated using (school_id = auth.uid());

-- Append-only, even for the table owner.
create or replace function public.audit_log_block_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'audit_log is append-only';
end;
$$;

drop trigger if exists audit_log_no_update_delete on public.audit_log;
create trigger audit_log_no_update_delete
  before update or delete on public.audit_log
  for each row execute function public.audit_log_block_change();

drop trigger if exists audit_log_no_truncate on public.audit_log;
create trigger audit_log_no_truncate
  before truncate on public.audit_log
  for each statement execute function public.audit_log_block_change();

-- (B) The row-change recorder. Runs after every insert/update/delete on an audited table.
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row     jsonb;
  v_old     jsonb;
  v_new     jsonb;
  v_changes jsonb;
  v_key     text;
  v_school  uuid;
  v_id      uuid;
begin
  if TG_OP = 'DELETE' then v_row := to_jsonb(OLD); else v_row := to_jsonb(NEW); end if;
  v_school := nullif(v_row ->> 'school_id', '')::uuid;
  v_id     := nullif(v_row ->> 'id', '')::uuid;

  if TG_OP in ('INSERT', 'DELETE') then
    v_changes := v_row - 'created_at' - 'updated_at';
  else
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_changes := '{}'::jsonb;
    for v_key in select jsonb_object_keys(v_new) loop
      if v_key in ('created_at', 'updated_at') then continue; end if;
      if (v_new -> v_key) is distinct from (v_old -> v_key) then
        v_changes := v_changes || jsonb_build_object(v_key, jsonb_build_object('old', v_old -> v_key, 'new', v_new -> v_key));
      end if;
    end loop;
    if v_changes = '{}'::jsonb then
      return null;                                     -- nothing actually changed
    end if;
  end if;

  insert into public.audit_log (school_id, actor_id, actor_kind, table_name, row_id, action, changes)
  values (v_school, auth.uid(), case when auth.uid() is null then 'service' else 'user' end,
          TG_TABLE_NAME, v_id, TG_OP, v_changes);
  return null;
end;
$$;

revoke all on function public.audit_row_change() from public, anon, authenticated;

-- Attach it to the selected tables. To audit another table later, add its name to this list
-- (it needs `id` and `school_id` columns) and re-run this block.
do $$
declare t text;
begin
  foreach t in array array['students', 'parents', 'staff', 'incidents',
                           'student_health', 'student_health_entries', 'report_cards', 'donations']
  loop
    execute format('drop trigger if exists audit_row_change on public.%I', t);
    execute format('create trigger audit_row_change after insert or update or delete on public.%I '
                   'for each row execute function public.audit_row_change()', t);
  end loop;
end
$$;

-- (A) "The agent proposed it and this person approved it." Called by the chat confirm endpoint.
-- The actor and school are taken from the caller's own login on the server side, so an entry
-- cannot be written in anyone else's name or into another school's log. Pass only ids and
-- enum values in p_summary (never free text such as an incident description).
create or replace function public.record_agent_approval(p_tool text, p_target uuid, p_summary jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  v_school := coalesce((select user_id from public.schools where user_id = auth.uid()),
                       public.get_staff_school_id());
  if v_school is null then
    raise exception 'no school for this account';
  end if;
  insert into public.audit_log (school_id, actor_id, actor_kind, table_name, row_id, action, changes)
  values (v_school, auth.uid(), 'user', 'agent_action', p_target, 'AGENT_APPROVED',
          jsonb_build_object('tool', p_tool, 'summary', coalesce(p_summary, '{}'::jsonb)));
end;
$$;

revoke all on function public.record_agent_approval(text, uuid, jsonb) from public, anon;
grant execute on function public.record_agent_approval(text, uuid, jsonb) to authenticated;
