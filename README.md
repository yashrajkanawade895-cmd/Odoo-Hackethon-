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

## Backend quick start (Yashraj / Harshit)
```bash
cd backend
npm install
copy .env.example .env        # then put your real Postgres password in .env
# create the database once (VS Code PostgreSQL extension): CREATE DATABASE assetflow;
npm run migrate               # prisma migrate dev
npm run db:constraints        # partial unique index + booking overlap constraint + tag sequence
npm run seed                  # 4 users (pass123), departments, categories, 10 assets
npm run dev                   # http://localhost:5000/health
```

Seeded logins (password `pass123`): `admin@assetflow.test`, `manager@assetflow.test`, `head@assetflow.test`, `priya@assetflow.test`
