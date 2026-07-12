# AssetFlow Frontend — Ashmit

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

## Rules
1. Build against [docs/api-contract.md](../docs/api-contract.md) — never read backend code.
2. **Mock behind one API layer** (see below). Flip `VITE_USE_MOCKS=false` per module as real endpoints land. NOTHING is mocked by the final demo.
3. Mock the ERRORS too: the 409 "held by Priya" and "booking overlap" UI states matter most for judging.
4. At each phase boundary, the previous phase's screens must run on the real API.

## API layer (built)
```
src/api/client.js        // axios instance, baseURL = VITE_API_URL, attaches
                          // Authorization: Bearer <token> from localStorage
src/api/auth.js           src/api/dashboard.js
src/api/departments.js    src/api/categories.js     src/api/employees.js
src/api/assets.js         src/api/allocations.js    src/api/transfers.js
src/api/bookings.js       src/api/maintenance.js    src/api/audits.js
src/api/notifications.js  src/api/logs.js           src/api/reports.js
src/api/index.js          // barrel: import { api } from '../api'
src/mocks/*.json          // shapes copied from api-contract.md
```
Every function in every module branches once on `USE_MOCKS` (`src/api/client.js`)
and either resolves from the matching `src/mocks/*.json` or calls the real
endpoint through the shared axios client. Mocked 409s (`asset_already_allocated`,
`booking_overlap`) throw the same `{status, body}` shape a real failed request
would, so error-handling code never has to know which mode it's in.

**Currently flipped to real endpoints:** `auth` (login/signup/me), `dashboard`
(kpis) — these are the two things `backend` already serves per `README.md`.
Everything else still resolves from mocks by default; flip a module by setting
`VITE_USE_MOCKS=false` and confirming its `src/api/*.js` file matches whatever
Yashraj/Harshit actually shipped for that phase.

**Still on local component state, not yet wired to `src/api/*`:** Assets,
Allocations/Transfers, Bookings, Maintenance, Audit, OrgSetup, Notifications,
Reports. The API modules and mocks exist and are contract-accurate — wiring a
page is a `useQuery`/`useMutation` swap from `seedData.js` to `api.<module>.*`,
same pattern as `Dashboard.jsx`. Do this per module as its backend phase lands.

`.env.development`:
```
VITE_API_URL=http://localhost:5000
VITE_USE_MOCKS=true
```

## Backend is live for Phase 1
`cd backend && npm run dev` → http://localhost:5000. Seeded logins (password `pass123`):
admin@assetflow.test · manager@assetflow.test · head@assetflow.test · priya@assetflow.test
