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
import { auditCyclesRouter, auditItemsRouter } from "./modules/audits/audits.routes.js";
import departmentsRoutes from "./modules/departments/departments.routes.js";
import categoriesRoutes from "./modules/categories/categories.routes.js";
import employeesRoutes from "./modules/employees/employees.routes.js";
import projectsRoutes from "./modules/projects/projects.routes.js";
import { activityLogger } from "./middleware/activityLog.js";

import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();

app.use(helmet());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
}));
app.use(express.json({ limit: "1mb" }));
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
app.use("/departments", departmentsRoutes);
app.use("/categories", categoriesRoutes);
app.use("/employees", employeesRoutes);
app.use("/projects", projectsRoutes);

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
  console.log(`Bento API running on http://localhost:${port}`)
);
