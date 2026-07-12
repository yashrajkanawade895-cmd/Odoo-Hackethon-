# AssetFlow — Enterprise Asset & Resource Management System

AssetFlow is an enterprise asset management system built to simplify how organizations manage physical assets and shared resources. It provides a centralized platform to register, allocate, track, and maintain assets throughout their lifecycle while reducing manual record keeping.

The system includes asset allocation, resource booking, maintenance workflows, audit management, notifications, and reporting, with role-based access for administrators, asset managers, department heads, and employees.

**Team:** Yashraj (backend) · Harshit (backend) · Ashmit (frontend)

**Stack:** React + Vite + Tailwind/shadcn · Node.js + Express + Prisma + **PostgreSQL 16** · JWT RBAC — everything served live from the database, no static data.

| Read this | What it is |
|---|---|
| [docs/PIPELINE.md](docs/PIPELINE.md) | Full plan: phases, per-person tasks, schema, setup, demo script |
| [docs/api-contract.md](docs/api-contract.md) | **The law** — every endpoint's shape; frontend codes against this |
| [frontend/README.md](frontend/README.md) | Ashmit's scaffold + mock-first strategy |

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
