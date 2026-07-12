# AssetFlow — Enterprise Asset & Resource Management System

AssetFlow is an enterprise asset management system built to simplify how organizations manage physical assets and shared resources. It provides a centralized platform to register, allocate, track, and maintain assets throughout their lifecycle while reducing manual record keeping.

The system includes asset allocation, resource booking, maintenance workflows, audit management, notifications, and reporting, with role-based access for administrators, asset managers, department heads, and employees.

**Team:** Yashraj (backend) · Harshit (backend) · Ashmit (frontend)

**Stack:** React 18 + Vite + Tailwind · Node.js + Express + Prisma + **PostgreSQL 16** · JWT role-based auth — everything served live from the database, no static data.

| Read this | What it is |
|---|---|
| [docs/PIPELINE.md](docs/PIPELINE.md) | Full plan: phases, per-person tasks, schema, setup, demo script |
| [docs/api-contract.md](docs/api-contract.md) | **The law** — every endpoint's shape; frontend codes against this |
| [frontend/README.md](frontend/README.md) | Frontend scaffold + API-layer notes |

## Features (10 screens)

1. **Auth** — email/password login + signup that only ever creates an Employee (no self-elevation); password reset. Roles are assigned only by an Admin.
2. **Dashboard** — live KPI cards (available, allocated, maintenance, bookings, pending transfers, upcoming/overdue returns), activity feed, and working quick-action + shortcut buttons.
3. **Organization Setup** (Admin) — 3 tabs: Departments (with head + parent hierarchy), Asset Categories (with custom fields), and the Employee Directory (the only place roles are promoted).
4. **Assets** — register with auto tag `AF-0001`, search/filter, per-asset detail drawer with allocation + maintenance history and a **QR code** of the tag.
5. **Allocation & Transfer** — allocate to a person/department; **double-allocation is blocked** ("held by X" → Request Transfer); transfer approval and return flow.
6. **Resource Booking** — time-slot booking of shared resources with **overlap rejection** (back-to-back allowed); cancel/reschedule.
7. **Maintenance** — raise → approve/reject → assign technician → in progress → resolve, with the asset status auto-flipping to *Under Maintenance* and back.
8. **Audit** — create scoped audit cycles, auto-populated items, mark Verified/Missing/Damaged, discrepancy report, close cycle (confirmed-missing → *Lost*).
9. **Reports & Analytics** — asset utilization, maintenance frequency by category, department-wise allocation, a booking heatmap, and assets due for maintenance / nearing retirement. CSV export.
10. **Notifications & Activity Log** — in-app notification bell with unread badge + a full audit log of who did what.

**Enforced at the database level (not just the UI):** one active allocation per asset (partial unique index), no overlapping bookings (exclusion constraint), asset-tag sequence. A background scheduler auto-flags overdue returns and sends booking reminders.

## Backend setup — teammates start here

Prerequisite: **PostgreSQL 16** installed and running (local), OR a shared cloud Postgres URL from the team.

```bash
cd backend
npm install
npm run setup     # first run creates backend/.env — open it, set your Postgres password, run setup again
npm run setup     # creates the DB, migrates, applies constraints, and seeds demo data
npm run dev       # http://localhost:5000/health
```

That's it — `npm run setup` builds the whole database from zero (it creates the `assetflow`
database automatically, applies the schema + the DB-level rules, and seeds the demo data).
Safe to re-run any time.

**Seeded logins (password `pass123`):** `admin@assetflow.test` · `manager@assetflow.test` · `head@assetflow.test` · `priya@assetflow.test`

> The logins live in **your** database, not in git — everyone must run `npm run setup` on their
> own machine (or all point `DATABASE_URL` at one shared cloud Postgres and seed once).

<details><summary>Manual steps (if you prefer to run them individually)</summary>

```bash
copy .env.example .env        # set your Postgres password in DATABASE_URL
npm run db:deploy             # apply migrations (creates the DB if missing)
npm run db:constraints        # partial unique index + booking-overlap constraint + tag sequence
npm run seed                  # 4 users, 3 departments, 4 categories, 10 assets
```
</details>

## Frontend
```bash
cd frontend
npm install
npm run dev       # http://localhost:5173  (expects the backend running on :5000)
```

## Roles

| Role | Can do |
|---|---|
| **Admin** | Organization Setup (departments, categories, audit cycles), promote employees, view org-wide analytics |
| **Asset Manager** | Register/allocate assets, approve transfers & maintenance, approve returns |
| **Department Head** | View their department's assets, approve dept transfers, book resources |
| **Employee** | View own assets, book resources, raise maintenance, initiate return/transfer |

## Project layout
```
backend/    Express + Prisma API (folder-per-module: auth, assets, allocations,
            transfers, bookings, maintenance, audits, dashboard, departments,
            categories, employees) + services/scheduler.js
frontend/   React + Vite app (pages/, components/, api/ layer, context/)
docs/       PIPELINE.md (plan) + api-contract.md (endpoint shapes)
```
