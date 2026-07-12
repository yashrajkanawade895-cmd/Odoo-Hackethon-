# Bento — Team Project Documentation

**Enterprise Asset & Resource Management System (ERP)**

| | |
|---|---|
| Team | Yashraj (Backend), Harshit (Backend), Ashmit (Frontend) |
| Timeline | ~10–11 days, 6 phases |
| Constraint | Dynamic PostgreSQL database — no Firebase/Supabase, no static JSON data |

---

## 1. What We're Building

A centralized platform where any organization can track physical assets and shared resources:

- Departments, asset categories, and an employee directory (master data)
- Assets tracked through a full lifecycle: **Available, Allocated, Reserved, Under Maintenance, Lost, Retired, Disposed**
- Asset allocation to employees/departments with **no double-allocation** (blocked + transfer request offered)
- Time-slot booking of shared resources with **no overlaps**
- Maintenance requests routed through an **approval workflow** before repair starts
- Scheduled **audit cycles** with assigned auditors and auto-generated discrepancy reports
- Notifications, activity logs, KPI dashboard, and reports/analytics

**User roles:** Admin, Asset Manager, Department Head, Employee. Signup only ever creates an Employee — Admin promotes people from the Employee Directory (the only place roles change).

### The 3 rules judges will test (must be enforced in the database layer, not just UI)

1. **No double allocation** — one active allocation per asset. If Raj tries to allocate a laptop Priya holds, block it, show "currently held by Priya," offer a Transfer Request.
2. **No booking overlap** — `new.start < existing.end AND new.end > existing.start` → reject. Back-to-back is allowed (10:00–11:00 after 9:00–10:00 is fine).
3. **Lifecycle state machine** — assets only move through valid transitions (Available ↔ Under Maintenance, Allocated → Available, etc.), enforced server-side.

---

## 2. Tech Stack

### Backend (Yashraj + Harshit)
| Layer | Choice |
|---|---|
| Runtime | Node.js 20 LTS + Express 4 |
| Database | **PostgreSQL 16** (local install, port 5432) |
| ORM | Prisma (swap for `pg` + raw SQL if organizers require hand-written SQL) |
| Auth | JWT (`jsonwebtoken`) + `bcrypt`; role claims in token |
| Validation | Zod |
| File uploads | Multer + Cloudinary (free tier) |
| Scheduled jobs | node-cron (overdue flags, booking reminders) |

### Frontend (Ashmit)
| Layer | Choice |
|---|---|
| Framework | React 18 + Vite |
| UI | shadcn/ui + Tailwind CSS |
| Routing | React Router v6 (role-guarded routes) |
| Server state | TanStack Query (auto-refetch after mutations) |
| Forms | React Hook Form + Zod |
| Calendar | FullCalendar (Screen 6) |
| Charts | Recharts (Screen 9) |
| Toasts | sonner |

### Shared
- API contract: `docs/api-contract.md` — **the law**. Ashmit codes against it; backend implements it; any change is committed there first.
- Everything is dynamic: `React → Express API → Prisma → PostgreSQL`. No static JSON anywhere. Seed script only INSERTs a starting state.
- Deploy (demo day only): backend on Render, frontend on Vercel. Local Postgres until then.

### Deliberately NOT using
NestJS (learning curve), MongoDB/Firebase/Supabase (banned + wrong fit), Redux (TanStack Query suffices), Socket.io (poll every 30s instead).

---

## 3. System Setup (one-time, per machine)

### Everyone
1. **Git** — git-scm.com (default options)
2. **Node.js 20 LTS** — nodejs.org
3. **VS Code** — extensions: ESLint, Prettier; backend two also add **Prisma** + **PostgreSQL (`ms-ossdata.vscode-pgsql`)**; Ashmit adds Tailwind CSS IntelliSense
4. GitHub account; one repo, other two added as collaborators

Verify: `git --version`, `node --version` (v20.x), `npm --version`

### Backend only (Yashraj + Harshit)
1. **PostgreSQL 16** — postgresql.org/download/windows (EDB installer). Remember the postgres password, keep port 5432. pgAdmin optional (we use the VS Code extension instead).
2. If `psql` isn't recognized, add `C:\Program Files\PostgreSQL\16\bin` to PATH.
3. In the VS Code PostgreSQL extension: Add Connection → host `localhost`, port `5432`, user `postgres`, your password → run `CREATE DATABASE bento;` → reconnect to `bento`.
4. `backend/.env`:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/bento"
   JWT_SECRET="pick-a-long-random-string"
   CLOUDINARY_URL="..."   # when Cloudinary account exists
   ```
5. **Postman** — postman.com/downloads (or Thunder Client VS Code extension) for API testing.

### Frontend only (Ashmit)
Nothing extra — everything arrives via npm. Optional: React Developer Tools browser extension.

### Accounts (free, near demo day)
Cloudinary (photo uploads), Render (backend hosting), Vercel (frontend hosting).

---

## 4. Database Schema (12 tables)

```
users              id, name, email, password_hash, role (admin|asset_manager|dept_head|employee),
                   department_id FK, status (active|inactive), created_at

departments        id, name, head_id FK->users, parent_id FK->departments (hierarchy),
                   status (active|inactive)

asset_categories   id, name, custom_fields JSONB (e.g. warranty period for Electronics)

assets             id, tag (AF-0001, from a Postgres SEQUENCE), name, category_id FK,
                   serial_number, acquisition_date, acquisition_cost, condition, location,
                   photo_url, is_bookable BOOL,
                   status (available|allocated|reserved|under_maintenance|lost|retired|disposed)

allocations        id, asset_id FK, holder_user_id FK, holder_department_id FK,
                   allocated_at, expected_return_date, returned_at, checkin_notes
                   -- CRITICAL: CREATE UNIQUE INDEX one_active_allocation
                   --   ON allocations(asset_id) WHERE returned_at IS NULL;

transfer_requests  id, asset_id FK, from_user_id, to_user_id, status
                   (requested|approved|rejected), decided_by FK, created_at, decided_at

bookings           id, asset_id FK (bookable resource), user_id FK, start_ts, end_ts,
                   status (upcoming|ongoing|completed|cancelled), created_at
                   -- Overlap guard: check in a transaction, or exclusion constraint:
                   --   EXCLUDE USING gist (asset_id WITH =, tstzrange(start_ts,end_ts) WITH &&)
                   --   (requires btree_gist extension; back-to-back OK because range is half-open)

maintenance_requests id, asset_id FK, raised_by FK, issue, priority, photo_url,
                   status (pending|approved|rejected|technician_assigned|in_progress|resolved),
                   technician, decided_by FK, created_at, resolved_at

audit_cycles       id, name, scope_department_id FK, scope_location, start_date, end_date,
                   status (open|closed), created_by FK

audit_items        id, cycle_id FK, asset_id FK, auditor_id FK,
                   result (pending|verified|missing|damaged), notes

notifications      id, user_id FK, type, message, is_read BOOL, created_at

activity_logs      id, user_id FK, action, entity_type, entity_id, detail JSONB, created_at
```

**PostgreSQL features we showcase:** partial unique index (rule 1), exclusion constraint / range check (rule 2), sequence for asset tags, self-referencing FK for department hierarchy, JSONB for category custom fields, live SQL aggregates for the dashboard/reports.

---

## 5. Phase Plan

Work runs **in parallel inside every phase** — backend pairs never block each other, Ashmit builds against the previous phase's real API + the current phase's contract.

### Phase 0 — Setup & Contract (½ day, all together)
The only phase done sitting together.

**All three:** create repo (`backend/`, `frontend/`, `docs/`), finalize schema → `docs/schema.sql`, write API contract v1 → `docs/api-contract.md`.
- **Yashraj:** scaffold Express (folder-per-module), connect Postgres, error handler, `.env`
- **Harshit:** `seed.js` — 4 users (one per role), 3 departments, 4 categories, 20 assets, a few bookings
- **Ashmit:** scaffold React (Vite), router, sidebar layout with role-based menu (hardcoded role for now), install shadcn/ui

✅ Done when: both apps run with `npm run dev`, seed fills the DB, contract covers Phase 1–2 endpoints.

### Phase 1 — Auth, Roles & Org Setup (~2 days)

**Yashraj — Auth & RBAC (top priority, everyone depends on it):**
- `POST /auth/signup` → always creates role `employee` (no role field accepted)
- `POST /auth/login` → JWT `{id, role, department_id}`; `POST /auth/forgot-password`; `GET /auth/me`
- `requireAuth` + `requireRole(...)` middleware — exported for Harshit same day
- Stub notification service `notify(userId, type, message)` → inserts into `notifications` (Phases 2–4 call this everywhere)

**Harshit — Organization Setup APIs (Screen 3):**
- Departments CRUD (create/edit/deactivate, assign head, optional parent)
- Categories CRUD with JSONB custom fields
- Employee directory list/filter + `PATCH /employees/:id/role` — the ONLY endpoint that changes roles (admin-only)
- Activity-log middleware on every mutating request (later modules get logging for free)

**Ashmit — Screens 1, 2 (skeleton), 3:**
- Login/Signup (NO role picker), forgot-password
- Auth context: JWT storage, redirect by role, role-hidden menus
- Organization Setup: 3 tabs (Departments / Categories / Employee Directory with Promote action)
- Dashboard skeleton: 6 KPI cards (mock numbers), quick-action buttons

🔗 Sync: Ashmit swaps mock auth for real endpoints.
✅ Done when: sign up → admin promotes to Asset Manager → re-login shows manager menus.

### Phase 2 — Asset Registry + Allocation (~3 days, the core)

Modules touch only at the asset `status` field — agree state machine transitions in the contract, then work independently.

**Harshit — Asset Registration & Directory (Screen 4):**
- `POST /assets`: auto tag from sequence (AF-0001, race-safe), photo upload, `is_bookable` flag
- **`changeAssetStatus(assetId, newStatus)`** — the state machine; validates allowed transitions. All other code calls this, never raw updates
- Search/filter: tag, serial, category, status, department, location
- `GET /assets/:id/history` — allocation + maintenance combined

**Yashraj — Allocation & Transfer (Screen 5):**
- `POST /allocations` with conflict rule: active allocation exists → `409 {held_by: "Priya", suggest: "transfer"}` — enforced by partial unique index, not just app code
- Transfer workflow: request → approve/reject (Asset Manager / Dept Head) → on approve close old + open new allocation, history auto-updated
- Return flow: mark returned + condition notes → asset back to Available
- Overdue detection (cron): allocations past `expected_return_date` → flag + `notify()`

**Ashmit — Screens 4 & 5:**
- Registration form; directory table with all filters; asset detail page (info, status badge, history tabs)
- Allocation form; on 409 show "Currently held by Priya" + **Request Transfer** button (judges test exactly this)
- Transfer approval list; return dialog with condition notes

🔗 Sync mid-phase: test allocate → blocked → transfer → approve end-to-end.
✅ Done when: the Priya/Raj example works exactly as in the spec, history shows every step.

### Phase 3 — Booking + Maintenance (~2 days, fully parallel)

**Yashraj — Resource Booking (Screen 6):**
- `GET /resources/:id/bookings` (calendar data)
- `POST /bookings` with overlap rejection (rule 2); back-to-back succeeds
- Status: Upcoming / Ongoing / Completed / Cancelled (computed from time)
- Cancel + reschedule; reminder notification before slot (cron or on-login check)

**Harshit — Maintenance (Screen 7):**
- `POST /maintenance` (asset, issue, priority, photo)
- Workflow: Pending → Approved/Rejected (Asset Manager) → Technician Assigned → In Progress → Resolved
- On approve: `changeAssetStatus(→ under_maintenance)`; on resolve: back to Available
- `notify()` on every transition; history per asset

**Ashmit — Screens 6 & 7:**
- Booking calendar (FullCalendar week view), booking form with clear overlap error, my-bookings with cancel/reschedule
- Maintenance: raise-request form, pipeline view of workflow stage, role-gated approve/reject buttons

✅ Done when: Room B2 example works (9:30–10:30 rejected, 10:00–11:00 accepted); approving maintenance visibly flips asset status.

### Phase 4 — Audit + Notifications + Live Dashboard (~2 days)

**Harshit — Audit Cycles (Screen 8):**
- Create cycle (scope: department/location + date range), assign auditor(s)
- Auditor marks each in-scope asset: Verified / Missing / Damaged
- Auto-generate discrepancy report from flagged items
- Close cycle: lock, update statuses via state machine (confirmed Missing → Lost), retain history

**Yashraj — Notifications, Logs & Dashboard data (Screens 10 + 2):**
- Sweep Phases 2–3: every event calls `notify()` (assigned, approved/rejected, booking confirmed/cancelled/reminder, transfer approved, overdue, discrepancy)
- `GET /notifications` + mark-read; `GET /activity-logs` with filters (admin)
- Dashboard KPI endpoint: available, allocated, maintenance today, active bookings, pending transfers, upcoming returns — **overdue returns as a separate highlighted count**

**Ashmit — Screens 8, 10 + real Dashboard:**
- Audit: cycle creation wizard, auditor checklist, discrepancy report, close-cycle confirmation
- Notification bell with unread badge + notifications page; activity log table
- Replace dashboard mocks with live KPIs (overdue in red); wire quick-action buttons

✅ Done when: audit marks asset Missing → close cycle → asset shows Lost → discrepancy notification appears → dashboard updates.

### Phase 5 — Reports, Polish & Demo (~1–2 days)

- **Yashraj — Analytics (Screen 9):** utilization trends, most-used vs idle, maintenance frequency by asset/category, due-for-maintenance / nearing-retirement, department-wise allocation summary, booking heatmap data — all live SQL aggregates
- **Harshit — Hardening:** CSV export (`json2csv`), rich demo seed data, run the full Basic Workflow as an integration test (happy path + both rejection rules)
- **Ashmit — Charts & polish:** Recharts + heatmap, export buttons, loading/empty/error states, responsive pass, verify each role sees only what the spec's role table allows

✅ Done when: one person runs the whole demo script without touching the DB manually.

---

## 6. Cooperation Rules

1. **Branch per phase-task** (`p2-allocation`, `p2-asset-registry`), PR into `main`, quick review by the other backend person
2. **Contract file is the interface** — Ashmit never reads backend code, only `docs/api-contract.md`
3. **Two shared functions, one owner each:** Yashraj owns `notify()` + RBAC middleware; Harshit owns `changeAssetStatus()`. Everyone calls, only the owner edits
4. **15-min sync at each phase boundary** — merge, re-seed, click through new screens together
5. Backend endpoints land first within each phase (even minimal), so Ashmit always builds against a real running API with seeded data — never static JSON

---

## 7. API Contract Starter (endpoint list)

```
AUTH        POST /auth/signup · POST /auth/login · POST /auth/forgot-password · GET /auth/me
ORG         GET|POST|PATCH /departments · GET|POST|PATCH /categories
            GET /employees · PATCH /employees/:id/role        (admin only)
ASSETS      GET|POST /assets · GET|PATCH /assets/:id · GET /assets/:id/history
ALLOCATION  POST /allocations · PATCH /allocations/:id/return
TRANSFERS   POST /transfers · PATCH /transfers/:id (approve|reject) · GET /transfers?status=
BOOKINGS    GET /resources/:id/bookings · POST /bookings
            PATCH /bookings/:id (cancel|reschedule) · GET /my-bookings
MAINTENANCE POST /maintenance · PATCH /maintenance/:id (status transitions) · GET /maintenance?status=
AUDITS      POST /audit-cycles · POST /audit-cycles/:id/auditors
            PATCH /audit-items/:id (verified|missing|damaged)
            GET /audit-cycles/:id/discrepancies · PATCH /audit-cycles/:id/close
DASHBOARD   GET /dashboard/kpis
NOTIFY      GET /notifications · PATCH /notifications/:id/read
LOGS        GET /activity-logs                                  (admin)
REPORTS     GET /reports/utilization · /reports/maintenance-frequency
            /reports/department-allocation · /reports/booking-heatmap · /reports/export?type=csv
```

Error convention: `409` for conflict-rule violations with a helpful body (`{"error":"asset_already_allocated","held_by":"Priya","suggest":"transfer"}`), `403` for role violations, Zod `400`s for bad input.

---

## 8. Demo Script (= the spec's "Basic Workflow")

1. Admin sets up departments + categories, promotes one employee to Department Head and one to Asset Manager
2. Asset Manager registers a new asset → enters as **Available** (show the row appearing live in the VS Code PostgreSQL extension)
3. Allocate it to an employee → try allocating again → **blocked, "held by X", Transfer Request offered** → approve transfer → history updated
4. Mark another asset as shared/bookable → book a slot → attempt an overlapping booking → **rejected** → back-to-back booking → accepted
5. Holder raises a maintenance request → Asset Manager approves → asset flips to **Under Maintenance** → resolve → back to **Available**
6. Return an allocated asset late → **overdue flag** on dashboard + notification
7. Create an audit cycle → auditor marks one asset Missing → discrepancy report → close cycle → asset becomes **Lost**
8. Finish on the Dashboard + Notifications + a report chart showing all of the above

Rehearse twice. Keep pgAdmin/VS Code DB panel visible to prove the database is live and dynamic.

---

## 9. Progress Tracker

Copy into GitHub Issues or tick here:

- [ ] Phase 0 — repo, schema, contract, scaffolds, seed
- [ ] Phase 1 — auth + RBAC (Y) · org setup APIs (H) · screens 1/3 + shell (A)
- [ ] Phase 2 — allocation/transfer (Y) · asset registry + state machine (H) · screens 4/5 (A)
- [ ] Phase 3 — booking (Y) · maintenance (H) · screens 6/7 (A)
- [ ] Phase 4 — notifications/logs/KPIs (Y) · audit cycles (H) · screens 8/10 + dashboard (A)
- [ ] Phase 5 — analytics (Y) · exports + integration test (H) · charts + polish (A)
- [ ] Demo rehearsed twice end-to-end
