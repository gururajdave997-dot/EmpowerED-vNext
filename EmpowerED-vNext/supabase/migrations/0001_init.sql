-- EmowerED — Supabase schema (PostgreSQL)
-- Migration 0001: core tables, keys, constraints, indexes.
-- Run in Supabase SQL editor or via `supabase db push`.

-- ---------- Roles ----------
create table if not exists public.roles (
  role_id      serial primary key,
  name         text not null unique check (name in ('Admin','Manager')),
  description  text,
  created_at   timestamptz not null default now()
);

-- ---------- Users (mirrors auth.users; only admin-approved emails ever created) ----------
create table if not exists public.users (
  user_id      uuid primary key default gen_random_uuid(),
  auth_uid     uuid unique references auth.users(id) on delete cascade,
  email        text not null unique,
  full_name    text,
  role         text not null default 'Manager' check (role in ('Admin','Manager')),
  is_active    boolean not null default true,
  last_login   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_users_email on public.users(email);

-- ---------- UserRoles (future-ready many-to-many) ----------
create table if not exists public.user_roles (
  user_id  uuid not null references public.users(user_id) on delete cascade,
  role_id  int  not null references public.roles(role_id) on delete cascade,
  primary key (user_id, role_id)
);

-- ---------- Departments (master data) ----------
create table if not exists public.departments (
  department_id serial primary key,
  name          text not null unique
);

-- ---------- Skill catalog ----------
create table if not exists public.skill_categories (
  category_id serial primary key,
  name        text not null unique
);
create table if not exists public.skills (
  skill_id     serial primary key,
  name         text not null unique,
  category_id  int references public.skill_categories(category_id) on delete set null
);
create index if not exists idx_skills_name on public.skills(name);

-- ---------- Employees ----------
create table if not exists public.employees (
  employee_code text primary key,
  full_name     text not null,
  department_id int references public.departments(department_id) on delete set null,
  business_unit text,
  email         text,
  manager_name  text,
  manager_email text,
  experience_years numeric(4,1) default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_emp_department on public.employees(department_id);

-- ---------- EmployeeSkills (from Skill Management Report) ----------
create table if not exists public.employee_skills (
  id             bigserial primary key,
  employee_code  text not null references public.employees(employee_code) on delete cascade,
  skill_id       int  not null references public.skills(skill_id) on delete cascade,
  level          int  check (level between 1 and 4),          -- 1-Beginner..4-Expert
  experience_band text,                                        -- 0-1,1-2,2-5,5-8,8-10,10-15,More than 15
  update_status  text check (update_status in ('Approved','Pending','Rejected')),
  updated_at     timestamptz not null default now(),
  unique (employee_code, skill_id)
);
create index if not exists idx_empskill_emp on public.employee_skills(employee_code);
create index if not exists idx_empskill_skill on public.employee_skills(skill_id);

-- ---------- Projects ----------
create table if not exists public.projects (
  project_code   text primary key,
  project_title  text not null,
  status         text not null default 'Active' check (status in ('Active','Closed')),
  created_at     timestamptz not null default now()
);

-- ---------- ProjectAssignments (from Time Sheet mapping) ----------
create table if not exists public.project_assignments (
  id              bigserial primary key,
  project_code    text not null references public.projects(project_code) on delete cascade,
  employee_code   text not null references public.employees(employee_code) on delete cascade,
  milestone_code  text,
  milestone_title text,
  product_code    text,
  product_title   text,
  mapped_date     date,
  created_at      timestamptz not null default now(),
  unique (project_code, employee_code, milestone_code)
);
create index if not exists idx_pa_project on public.project_assignments(project_code);
create index if not exists idx_pa_emp on public.project_assignments(employee_code);

-- ---------- ResourceAllocation (derived allocation status) ----------
create table if not exists public.resource_allocation (
  id                bigserial primary key,
  employee_code     text not null references public.employees(employee_code) on delete cascade,
  allocation_pct    numeric(5,2) not null default 0 check (allocation_pct >= 0),
  allocation_status text not null default 'Unallocated'
                    check (allocation_status in ('Unallocated','Partially Assigned','Fully Assigned')),
  current_project   text references public.projects(project_code) on delete set null,
  available_date    date,
  as_of             timestamptz not null default now(),
  unique (employee_code)
);
create index if not exists idx_ra_status on public.resource_allocation(allocation_status);

-- ---------- AuditLogs ----------
create table if not exists public.audit_logs (
  id           bigserial primary key,
  actor_email  text,
  action       text not null,
  detail       text,
  ip_address   text,
  created_at   timestamptz not null default now()
);
create index if not exists idx_audit_actor on public.audit_logs(actor_email);
create index if not exists idx_audit_created on public.audit_logs(created_at);

-- Derive allocation_status automatically from allocation_pct
create or replace function public.set_allocation_status() returns trigger as $$
begin
  new.allocation_status :=
    case when new.allocation_pct <= 0 then 'Unallocated'
         when new.allocation_pct < 100 then 'Partially Assigned'
         else 'Fully Assigned' end;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_alloc_status on public.resource_allocation;
create trigger trg_alloc_status before insert or update on public.resource_allocation
  for each row execute function public.set_allocation_status();
