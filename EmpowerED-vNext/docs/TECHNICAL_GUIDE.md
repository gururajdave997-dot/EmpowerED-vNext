# EmpowerED — Technical Implementation Guide

Baseline: the existing React + Vite + TypeScript + Tailwind POC. This guide documents the v-next changes: Resource Allocation Status relabel, Employee Band removal, Supabase Email-OTP authentication, the two Excel upload templates, the database schema, and deployment.

---

## A. Supabase Setup

### 1. Create the project
1. Go to https://supabase.com ▸ **New project**. Pick an org, name (`empowered`), region and a strong DB password.
2. After provisioning, open **Project Settings ▸ API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### 2. Authentication setup (Email OTP / passwordless)
1. **Authentication ▸ Providers ▸ Email**: enable **Email**.
2. Turn **ON** "Email OTP" (magic-code). You may turn **OFF** "Confirm email" for OTP-only.
3. **Authentication ▸ Providers ▸ Email ▸ "Allow new users to sign up"**: this is the public-signup switch. The app enforces its own allow-list regardless, but you may leave signup on so `signInWithOtp` can create the auth record for approved users. Access is still blocked for anyone not in `VITE_ALLOWED_USERS`.
4. (Optional) **Authentication ▸ Email Templates**: customize the OTP email.

### 3. OTP configuration notes
- The client calls `supabase.auth.signInWithOtp({ email })` → Supabase emails a 6-digit code.
- The client calls `supabase.auth.verifyOtp({ email, token, type: 'email' })` to complete sign-in.
- **The app validates the email against `VITE_ALLOWED_USERS` BEFORE sending the OTP**, so non-approved addresses never receive a code.

### 4. Database setup
Run the migrations in `supabase/migrations/` in order (SQL editor or `supabase db push`):
- `0001_init.sql` — tables, keys, constraints, indexes, allocation-status trigger.
- `0002_rls.sql` — Row-Level Security (read for authenticated approved users; writes for Admin).
- `0003_seed.sql` — roles, departments, skill catalog, seed admin.

### 5. User management
- Approved users live in `VITE_ALLOWED_USERS` (front-end gate) and in `public.users` (role + audit).
- On first successful login the app upserts the user into `public.users` and writes an `audit_logs` row.
- To add a user: add their email to `VITE_ALLOWED_USERS`, redeploy, and optionally insert a `public.users` row with their role.

---

## B. Environment Variables

Vite only exposes variables prefixed with `VITE_` to the browser. Configure in `.env` (local) or the host's env settings.

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_ALLOWED_USERS=user1@company.com,user2@company.com,user3@company.com
VITE_USER_ROLES=user1@company.com:Admin,user2@company.com:Manager
VITE_APP_ENV=production
```

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL. Blank ⇒ app runs in demo mode. |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (safe for the browser; RLS enforces access). |
| `VITE_ALLOWED_USERS` | Comma-separated approved emails. Only these can log in. |
| `VITE_USER_ROLES` | `email:Role` pairs (`Admin`/`Manager`). Defaults: `admin*`→Admin else Manager. |
| `VITE_APP_ENV` | `development` / `production`. |

> The spec lists `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ALLOWED_USERS`. In Vite these must carry the `VITE_` prefix to reach the client — mapping is 1:1.

**Demo mode:** if `VITE_SUPABASE_URL`/`ANON_KEY` are blank, the app still runs the full two-step OTP UX, generating the code locally and showing it on screen (labelled "Demo mode"). Access is still restricted to `VITE_ALLOWED_USERS` (defaults `admin@company.com`, `manager@company.com`).

---

## C. Authentication Flow

1. **Email entry** — user submits their email.
2. **Allow-list check** — app rejects immediately with *"Access Denied. Please contact the administrator."* if the email is not in `VITE_ALLOWED_USERS`. No OTP is sent.
3. **OTP send** — `signInWithOtp` emails a 6-digit code (demo mode shows it on screen).
4. **OTP verify** — `verifyOtp` validates the code; Supabase issues a session (JWT, auto-refresh, persisted).
5. **Profile + audit** — app upserts `public.users` (email, role, last_login) and inserts an `audit_logs` login entry (best-effort).
6. **Session** — restored on reload via `getSession()` + `onAuthStateChange`. Protected routes redirect unauthenticated users to `/login`.
7. **Logout** — `supabase.auth.signOut()` clears the session and returns to `/login`.

Roles are **Admin** and **Manager** (future-ready RBAC). No public sign-up, no self-registration, no auto-onboarding beyond the approved list.

---

## D. Excel Upload Process

Uploads happen on **Admin ▸ Uploads**. Files are parsed in-browser (SheetJS); headers are normalized (trim + case-insensitive + alias map). Rows merge into the dataset by `EmployeeCode`; dashboards refresh instantly.

### Timesheet upload — `Timesheet_Template.xlsx`
- **Columns:** ProjectCode, ProjectTitle, MilestoneCode, MilestoneTitle, MilestoneProductCode, DisplayProductTitle, EmployeeName, EmployeeCode, Department, MappedDate. *(EmployeeBand removed.)*
- **Validation:** ProjectCode mandatory; EmployeeCode mandatory & unique; MappedDate valid date; Department from dropdown master list.
- **Error handling:** rows missing EmployeeCode are rejected and listed (row number + reason) in the upload summary; valid rows still load (partial success).
- **Success response:** summary shows *rows read / loaded / rejected* with timestamp and file name.

### Skill upload — `Skills_Template.xlsx`
- **Columns:** EmployeeCode, EmployeeName, Department, EmailId, SkillUpdateStatus, ManagerName, ManagerEmailId, SkillName, Level, Experience.
- **Dropdowns:** SkillUpdateStatus (Approved/Pending/Rejected); Level (1-Beginner…4-Expert); Experience (0-1,1-2,2-5,5-8,8-10,10-15,More than 15); Department (master list).
- **Mapping:** Level → proficiency 1–4; Experience band → numeric mid-point; first skill → primary, next distinct → secondary.
- **Error handling / success:** same summary + rejected-row list as above.

Both templates include an **Instructions** sheet and sample records, with in-cell dropdown validation.

---

## E. Security

- **Allowed-user validation** — enforced client-side before OTP send, and again at verify; enforce server-side via RLS + `public.users` for production.
- **Route protection** — `<Protected>` wrapper gates all app routes; unauthenticated users are redirected to `/login`.
- **Session security** — Supabase JWT with auto-refresh and persisted session; logout revokes the session. Only the anon key ships to the client; never expose the service-role key.
- **Audit logging** — `audit_logs` table captures login events (and is ready for upload/export/admin actions). Readable by Admin under RLS.
- **RBAC readiness** — `roles`, `user_roles`, and `public.users.role` (Admin/Manager) are in place; RLS write policies already key off `current_app_role() = 'Admin'`.
- **No Employee Band** — removed from all UI, filters, charts, reports, exports, and the upload template.

---

## F. Deployment

### Local setup
```
npm install
cp .env.example .env       # optional; app runs in demo mode without it
npm run dev
```

### Development (Supabase-connected)
1. Fill `.env` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ALLOWED_USERS`, `VITE_USER_ROLES`.
2. Run the three migrations in your Supabase project.
3. `npm run dev` and sign in with an approved email (real OTP email arrives).

### Production
- **Build:** `npm run build` → static assets in `dist/`.
- **Host:** any static host (GitHub Pages workflow included at `.github/workflows/deploy.yml`, Vercel, Netlify, Azure Static Web Apps).
- **Env:** set the `VITE_*` variables in the host's build/environment settings (they are inlined at build time — rebuild after changing them).
- **Supabase:** point `VITE_SUPABASE_URL/ANON_KEY` at your production project; run migrations there; add production emails to `VITE_ALLOWED_USERS`.

### Build & release process
1. Merge to `main`.
2. CI installs, builds, and deploys (`.github/workflows/deploy.yml`).
3. Verify login (approved + denied email), upload both templates, and confirm the dashboard "Resource Allocation Status" widget renders Unallocated / Partially Assigned / Fully Assigned.
