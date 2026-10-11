-- 002_close_public_schools_read.sql
-- Fixes finding F8 (Architecture Guide): the policy "Public can read schools" (role anon,
-- condition `true`) let anyone without a login read EVERY column of EVERY school
-- (address, phone, principal, capacity, and each school's tenant id). Row-level rules can't
-- limit columns, so the public application form gets a purpose-built function instead that
-- returns only the five fields it displays, for ONE school whose id the caller already holds.
--
-- Run this script in the Supabase SQL editor, then deploy the code change in
-- src/ApplicationPortal.jsx (it now calls get_public_school_info()). The editor will warn
-- about "destructive operations" because of DROP POLICY — expected.

-- 1. The only public window onto a school's data.
create or replace function public.get_public_school_info(p_school_id uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'name', name,
    'logo_url', logo_url,
    'primary_color', primary_color,
    'motto', motto,
    'divisions', divisions
  )
  from schools
  where user_id = p_school_id
$$;

revoke all on function public.get_public_school_info(uuid) from public;
grant execute on function public.get_public_school_info(uuid) to anon, authenticated;

-- 2. Close the open door. Admin ("Users can manage their own school") and staff
--    ("staff_read_school") policies are untouched.
drop policy if exists "Public can read schools" on public.schools;
