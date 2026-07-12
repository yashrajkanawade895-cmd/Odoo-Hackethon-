import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes.js";
import allocationRoutes from "./modules/allocations/allocations.routes.js";
import transferRoutes from "./modules/transfers/transfers.routes.js";
import assetRoutes from "./modules/assets/assets.routes.js";
import { resourcesRouter, bookingsRouter, myBookingsRouter } from "./modules/bookings/bookings.routes.js";
import maintenanceRoutes from "./modules/maintenance/maintenance.routes.js";
import { dashboardRouter, notificationsRouter, activityLogsRouter, reportsRouter } from "./modules/dashboard/dashboard.routes.js";
import departmentRoutes from "./modules/departments/departments.routes.js";
import categoryRoutes from "./modules/categories/categories.routes.js";
import employeeRoutes from "./modules/employees/employees.routes.js";
import { activityLogger } from "./middleware/activityLog.js";

const app = express();
app.use(cors());
app.use(express.json());

// Global activity logger middleware
app.use(activityLogger);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/assets", assetRoutes);
app.use("/allocations", allocationRoutes);
app.use("/transfers", transferRoutes);
app.use("/resources", resourcesRouter);
app.use("/bookings", bookingsRouter);
app.use("/my-bookings", myBookingsRouter);
app.use("/maintenance", maintenanceRoutes);
app.use("/dashboard", dashboardRouter);
app.use("/notifications", notificationsRouter);
app.use("/activity-logs", activityLogsRouter);
app.use("/reports", reportsRouter);
app.use("/audit-cycles", auditCyclesRouter);
app.use("/audit-items", auditItemsRouter);
app.use("/departments", departmentRoutes);
app.use("/categories", categoryRoutes);
app.use("/employees", employeeRoutes);
// Phase 2+: assets, bookings, maintenance, audits, dashboard, reports

app.use((_req, res) => res.status(404).json({ error: "not found" }));

// central error handler — controllers call next(err)
app.use((err, _req, res, _next) => {
  console.error(err);
  // Prisma unique violations surface as P2002
  if (err.code === "P2002") {
    return res.status(409).json({ error: "conflict", detail: err.meta });
  }
  res.status(err.status || 500).json({ error: err.message || "internal error" });
});

const port = process.env.PORT || 5000;
app.listen(port, () =>
  console.log(`AssetFlow API running on http://localhost:${port}`)
);
