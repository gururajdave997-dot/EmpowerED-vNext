-- Migration 0002: Row-Level Security. Read for authenticated approved users; writes for Admin.
alter table public.users               enable row level security;
alter table public.employees           enable row level security;
alter table public.employee_skills     enable row level security;
alter table public.skills              enable row level security;
alter table public.skill_categories    enable row level security;
alter table public.projects            enable row level security;
alter table public.project_assignments enable row level security;
alter table public.resource_allocation enable row level security;
alter table public.audit_logs          enable row level security;

-- helper: current user's app role from public.users
create or replace function public.current_app_role() returns text as $$
  select role from public.users where auth_uid = auth.uid();
$$ language sql stable;

-- authenticated users can read reference/resource data
do $$ declare t text;
begin
  foreach t in array array['employees','employee_skills','skills','skill_categories','projects','project_assignments','resource_allocation'] loop
    execute format('drop policy if exists %I_read on public.%I;', t, t);
    execute format('create policy %I_read on public.%I for select to authenticated using (true);', t, t);
    execute format('drop policy if exists %I_admin_write on public.%I;', t, t);
    execute format('create policy %I_admin_write on public.%I for all to authenticated using (public.current_app_role() = ''Admin'') with check (public.current_app_role() = ''Admin'');', t, t);
  end loop;
end $$;

-- users table: a user can read own row; Admin reads all; Admin writes
drop policy if exists users_self_read on public.users;
create policy users_self_read on public.users for select to authenticated
  using (auth_uid = auth.uid() or public.current_app_role() = 'Admin');
drop policy if exists users_admin_write on public.users;
create policy users_admin_write on public.users for all to authenticated
  using (public.current_app_role() = 'Admin') with check (public.current_app_role() = 'Admin');

-- audit logs: insert by any authenticated; read by Admin
drop policy if exists audit_insert on public.audit_logs;
create policy audit_insert on public.audit_logs for insert to authenticated with check (true);
drop policy if exists audit_admin_read on public.audit_logs;
create policy audit_admin_read on public.audit_logs for select to authenticated using (public.current_app_role() = 'Admin');
