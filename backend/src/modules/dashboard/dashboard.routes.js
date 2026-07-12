import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as ctrl from "./dashboard.controller.js";

const router = Router();

export const dashboardRouter = Router();
dashboardRouter.get("/kpis", requireAuth, ctrl.getDashboardKpis);

export const notificationsRouter = Router();
notificationsRouter.get("/", requireAuth, ctrl.getNotifications);
notificationsRouter.patch("/:id/read", requireAuth, ctrl.markNotificationRead);

export const activityLogsRouter = Router();
activityLogsRouter.get("/", requireAuth, requireRole("admin"), ctrl.getActivityLogs);

export const reportsRouter = Router();
reportsRouter.get("/utilization", requireAuth, ctrl.getUtilizationReport);
reportsRouter.get("/maintenance-frequency", requireAuth, ctrl.getMaintenanceFrequencyReport);
reportsRouter.get("/department-allocation", requireAuth, ctrl.getDepartmentAllocationReport);
reportsRouter.get("/booking-heatmap", requireAuth, ctrl.getBookingHeatmapReport);
reportsRouter.get("/export", requireAuth, ctrl.exportReport);

