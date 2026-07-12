# Bento API Contract

**THE LAW.** Ashmit codes against this file; backend implements it. Any endpoint
change is committed HERE first, then coded. Base URL (dev): `http://localhost:5000`

Auth: `Authorization: Bearer <jwt>` on everything except signup/login/forgot/reset.

Error conventions:
- `400` invalid input (Zod details included)
- `401` missing/bad token or credentials
- `403` role not allowed
- `409` conflict-rule violation, with a helpful body, e.g.
  `{"error":"asset_already_allocated","held_by":"Priya Employee","suggest":"transfer"}`
  or `{"error":"booking_overlap"}`

---

## Auth (implemented — Phase 1, Yashraj)

### POST /auth/signup
Always creates role `employee`. A `role` field in the body is ignored.
```json
// request
{ "name": "Raj Kumar", "email": "raj@test.com", "password": "secret123" }
// 201
{ "id": 5, "name": "Raj Kumar", "email": "raj@test.com", "role": "employee", "departmentId": null, "status": "active" }
// 409 { "error": "email already registered" }
```

### POST /auth/login
```json
// request
{ "email": "admin@bento.test", "password": "pass123" }
// 200
{ "token": "<jwt>", "user": { "id": 1, "name": "Admin User", "email": "...", "role": "admin" } }
// 401 { "error": "invalid credentials" }
```

### GET /auth/me  (auth)
Returns the current user fresh from DB (role promotions visible without re-login).

### POST /auth/forgot-password → `{ message, resetToken }` (token would be emailed in production)
### POST /auth/reset-password → `{ token, newPassword }` → `{ message: "password updated" }`

---

## Organization Setup (Phase 1, Harshit) — admin only

```
GET  /departments                 list (include head name, parent, member count)
POST /departments                 { name, headId?, parentId? }
PATCH /departments/:id            edit / { status: "inactive" } to deactivate

GET  /categories
POST /categories                  { name, customFields? }   e.g. {"warranty_months":24}
PATCH /categories/:id

GET  /employees?department=&role=&status=&q=
PATCH /employees/:id/role         { role: "asset_manager" | "dept_head" | "employee" }
                                  ⚠ THE ONLY endpoint in the app that changes roles
PATCH /employees/:id              { departmentId?, status? }
```

## Assets (Phase 2, Harshit)
```
POST /assets                      auto tag AF-xxxx from sequence; asset_manager only
GET  /assets?q=&category=&status=&department=&location=&bookable=
GET  /assets/:id                  detail incl. category custom fields
PATCH /assets/:id                 edit fields; status changes ONLY via changeAssetStatus rules
GET  /assets/:id/history          combined allocation + maintenance history, newest first
```

## Allocations & Transfers (Phase 2, Yashraj)
```
POST /allocations                 { assetId, holderUserId | holderDepartmentId, expectedReturnDate? }
                                  → 409 asset_already_allocated + held_by + suggest:"transfer"
PATCH /allocations/:id/return     { checkinNotes? } → asset back to available
GET  /allocations?assetId=&holder=&overdue=true

POST /transfers                   { assetId, toUserId }
GET  /transfers?status=requested
PATCH /transfers/:id              { action: "approve" | "reject" }  asset_manager/dept_head
                                  approve → old allocation closed, new one opened, history updated
```

## Bookings (Phase 3, Yashraj)
```
GET  /resources                   assets where is_bookable=true
GET  /resources/:id/bookings?from=&to=      calendar data
POST /bookings                    { assetId, startTs, endTs } → 409 booking_overlap
                                  back-to-back allowed (half-open ranges)
GET  /my-bookings
PATCH /bookings/:id               { action: "cancel" } | { startTs, endTs } to reschedule
```

## Maintenance (Phase 3, Harshit)
```
POST /maintenance                 { assetId, issue, priority, photoUrl? }
GET  /maintenance?status=&assetId=
PATCH /maintenance/:id            { action: "approve"|"reject"|"assign_technician"|"start"|"resolve", technician? }
                                  approve → asset under_maintenance; resolve → available
```

## Audits (Phase 4, Harshit)
```
POST /audit-cycles                { name, scopeDepartmentId? , scopeLocation?, startDate, endDate }
POST /audit-cycles/:id/auditors   { auditorIds: [..] }
GET  /audit-cycles /:id           incl. items + progress
PATCH /audit-items/:id            { result: "verified"|"missing"|"damaged", notes? }
GET  /audit-cycles/:id/discrepancies
PATCH /audit-cycles/:id/close     locks cycle; confirmed missing → asset lost
```

## Dashboard, Notifications, Logs, Reports (Phase 4–5, Yashraj)
```
GET /dashboard/kpis               { available, allocated, maintenanceToday, activeBookings,
                                    pendingTransfers, upcomingReturns, overdueReturns }
GET /notifications                newest first, unread count
PATCH /notifications/:id/read
GET /activity-logs?user=&action=&from=&to=          admin only
GET /reports/utilization · /reports/maintenance-frequency
GET /reports/department-allocation · /reports/booking-heatmap
GET /reports/export?report=...&type=csv
```
