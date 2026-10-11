-- 001_fix_staff_self_update.sql
-- Fixes finding F9 (Architecture Guide): the `staff_update_own` policy let a staff member
-- (or any school admin who gave themselves a staff row) edit ANY column of their own staff
-- row, including school_id, which get_staff_school_id() uses to decide which school's data
-- they may read. Confirmed exploitable by `npm run test:staff-escalation` on 2026-10-11.
--
-- Three parts. Safe to run as one script in the Supabase SQL editor.
-- (The editor will warn about "destructive operations" because of the DROP POLICY — expected.)
--
-- Order matters for the app: run this script FIRST, then deploy the code change in
-- src/hooks/useSchool.js (first-login linking now calls link_staff_account()).

-- 1. A narrow, purpose-built way for a staff member to link their own login.
--    It can only set auth_user_id, only on the single not-yet-linked row whose email
--    matches the caller's confirmed email. It can't touch any other column.
create or replace function public.link_staff_account()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_school uuid;
begin
  if auth.uid() is null or auth.email() is null then
    return null;
  end if;

  select count(*) into v_count
    from staff
   where auth_user_id is null
     and lower(email) = lower(auth.email());

  -- Link only when exactly one row matches (zero: nothing to link; several: ambiguous).
  if v_count <> 1 then
    return null;
  end if;

  update staff
     set auth_user_id = auth.uid()
   where auth_user_id is null
     and lower(email) = lower(auth.email())
  returning school_id into v_school;

  return v_school;
end;
$$;

revoke all on function public.link_staff_account() from public, anon;
grant execute on function public.link_staff_account() to authenticated;

-- 2. Defense in depth: a staff row can never be moved to a different school.
create or replace function public.staff_freeze_school_id()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.school_id is distinct from old.school_id then
    raise exception 'staff.school_id cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists staff_freeze_school_id on public.staff;
create trigger staff_freeze_school_id
  before update on public.staff
  for each row execute function public.staff_freeze_school_id();

-- 3. Remove the over-broad policy. After this, only the school's admin (policy
--    "Users manage own staff") can modify staff rows; staff can still READ their own row
--    (policy staff_read_own) and link their login through link_staff_account().
drop policy if exists "staff_update_own" on public.staff;
