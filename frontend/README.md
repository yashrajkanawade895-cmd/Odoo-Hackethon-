# AssetFlow Frontend — Ashmit

Scaffold (run inside `frontend/`):
```bash
npm create vite@latest . -- --template react
npm install
npm install react-router-dom @tanstack/react-query react-hook-form zod axios sonner
npx tailwindcss init -p   # follow shadcn/ui install guide after Tailwind
# later phases: @fullcalendar/react @fullcalendar/timegrid recharts
```

## Rules
1. Build against [docs/api-contract.md](../docs/api-contract.md) — never read backend code.
2. **Mock behind one API layer** (see below). Flip `VITE_USE_MOCKS=false` per module as real endpoints land. NOTHING is mocked by the final demo.
3. Mock the ERRORS too: the 409 "held by Priya" and "booking overlap" UI states matter most for judging.
4. At each phase boundary, the previous phase's screens must run on the real API.

## API layer pattern
```
src/
  api/client.js      // axios instance, baseURL = import.meta.env.VITE_API_URL,
                     // attaches Authorization: Bearer <token> from auth context
  api/assets.js      // getAssets(), createAsset()...  each checks USE_MOCKS
  mocks/assets.json  // shapes copied EXACTLY from api-contract.md
```
```js
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";
export async function getAssets(params) {
  if (USE_MOCKS) return mockAssets;
  return (await client.get("/assets", { params })).data;
}
```

`.env.development`:
```
VITE_API_URL=http://localhost:5000
VITE_USE_MOCKS=true
```

## Backend is live for Phase 1
`cd backend && npm run dev` → http://localhost:5000. Seeded logins (password `pass123`):
admin@assetflow.test · manager@assetflow.test · head@assetflow.test · priya@assetflow.test
