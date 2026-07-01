# EmpowerED — POC

AI-powered Internal Resource Management Portal. **React + Vite + TypeScript + Tailwind + shadcn-style UI + Recharts**, with **Supabase Email-OTP authentication** and in-browser Excel import. Runs on mock data out of the box; the two workbooks — **Skill Management Report** and **Time Sheet** — upload from the Admin page.

## Run
```bash
npm install
cp .env.example .env      # optional — runs in demo mode without it
npm run dev
```
Also runnable with no local setup via GitHub Codespaces, and auto-deploys to GitHub Pages (`.github/workflows/deploy.yml`).

## Authentication (Supabase Email OTP, passwordless)
- Enter email -> receive a 6-digit code -> verify -> signed in.
- **Only administrator-approved emails** (in `VITE_ALLOWED_USERS`) may sign in. No public sign-up, no self-registration. Unapproved emails get *"Access Denied. Please contact the administrator."* and never receive a code.
- Roles: **Admin**, **Manager** (RBAC-ready).
- **Demo mode:** with no Supabase env vars set, the full OTP flow still works — the code is generated locally and shown on screen. Approved demo logins: `admin@company.com`, `manager@company.com`.
- For real OTP, set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` and run the migrations (see `docs/TECHNICAL_GUIDE.md`).

## What changed in this version
- Dashboard widget **"Allocation Mix" -> "Resource Allocation Status"**.
- Allocation labels **Unallocated / Partially Assigned / Fully Assigned** everywhere (chart, legend, tooltip, KPIs, drill-down, reports, exports).
- **Employee Band removed** from all UI, filters, charts, reports, exports, and the upload template.
- **Supabase Email-OTP** auth with approved-email allow-list and Admin/Manager roles.
- New upload templates: `public/templates/Timesheet_Template.xlsx`, `public/templates/Skills_Template.xlsx`.
- Supabase migrations in `supabase/migrations/`; docs in `docs/`.

## Environment variables
```
VITE_SUPABASE_URL=            # blank => demo mode
VITE_SUPABASE_ANON_KEY=
VITE_ALLOWED_USERS=admin@company.com,manager@company.com
VITE_USER_ROLES=admin@company.com:Admin,manager@company.com:Manager
VITE_APP_ENV=development
```
Vite only exposes `VITE_`-prefixed vars to the browser (so `SUPABASE_URL` -> `VITE_SUPABASE_URL`, etc.).

## Upload templates
- **Timesheet_Template.xlsx** — ProjectCode, ProjectTitle, MilestoneCode, MilestoneTitle, MilestoneProductCode, DisplayProductTitle, EmployeeName, EmployeeCode, Department, MappedDate. (ProjectCode & EmployeeCode mandatory; Department dropdown; MappedDate date.)
- **Skills_Template.xlsx** — EmployeeCode, EmployeeName, Department, EmailId, SkillUpdateStatus, ManagerName, ManagerEmailId, SkillName, Level, Experience. (Dropdowns for status/level/experience/department.)

Both include an Instructions sheet, sample rows, and in-cell validation. Upload on **Admin > Uploads**; rejected rows are listed with reasons.

## Structure
```
src/
  pages/        Login (OTP), Dashboard, Resources, Skills, Availability, Projects, AIAssistant, Reports, Admin
  components/    Layout, SkillFilterBar, ResourceTable, PageHeader, ui/*
  data/          mockData.ts, dataService.ts (Excel import for both templates)
  ai/            queryParser.ts, scoring.ts, insights.ts
  lib/           auth.tsx (Supabase OTP + allow-list + roles), supabase.ts, alloc.ts, types.ts, utils.ts
supabase/migrations/   0001_init.sql, 0002_rls.sql, 0003_seed.sql
docs/                  TECHNICAL_GUIDE.md, DATABASE_SCHEMA.md
public/templates/      Timesheet_Template.xlsx, Skills_Template.xlsx
```
See `docs/TECHNICAL_GUIDE.md` for Supabase setup, auth flow, upload rules, security, and deployment.
