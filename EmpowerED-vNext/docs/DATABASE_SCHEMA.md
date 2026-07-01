# EmpowerED — Database Schema

Supabase/PostgreSQL. Migration scripts: `supabase/migrations/0001_init.sql`, `0002_rls.sql`, `0003_seed.sql`.

| Table | Key columns | Notes |
|-------|-------------|-------|
| roles | role_id (PK), name unique (Admin/Manager) | RBAC roles |
| users | user_id (PK), auth_uid → auth.users, email unique, role, is_active, last_login | app users, approved only |
| user_roles | (user_id, role_id) PK | many-to-many (future RBAC) |
| departments | department_id (PK), name unique | master data |
| skill_categories | category_id (PK), name unique | skill grouping |
| skills | skill_id (PK), name unique, category_id → skill_categories | skill catalog |
| employees | employee_code (PK), full_name, department_id → departments, business_unit, email, manager_name, manager_email, experience_years | roster (no Band) |
| employee_skills | id (PK), employee_code → employees, skill_id → skills, level 1–4, experience_band, update_status, unique(employee_code, skill_id) | from Skills template |
| projects | project_code (PK), project_title, status | from Timesheet |
| project_assignments | id (PK), project_code → projects, employee_code → employees, milestone_*, product_*, mapped_date | from Timesheet template |
| resource_allocation | id (PK), employee_code → employees unique, allocation_pct, allocation_status (Unallocated/Partially Assigned/Fully Assigned), current_project → projects, available_date | status auto-set by trigger |
| audit_logs | id (PK), actor_email, action, detail, ip_address, created_at | security audit |

**Constraints & integrity**
- `allocation_status` is CHECK-constrained to the three labels and auto-derived from `allocation_pct` via `trg_alloc_status`.
- `employee_skills.level` CHECK 1–4; `update_status` CHECK Approved/Pending/Rejected.
- Foreign keys cascade on delete from parent employee/project.

**Indexes**: users(email), skills(name), employee_skills(employee_code, skill_id), employees(department_id), project_assignments(project_code, employee_code), resource_allocation(allocation_status), audit_logs(actor_email, created_at).

**Employee Band**: intentionally absent from every table.
