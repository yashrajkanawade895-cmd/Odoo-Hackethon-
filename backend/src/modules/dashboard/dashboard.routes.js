import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import * as ctrl from "./dashboard.controller.js";

const router = Router();

// Anyone can view the KPIs, but the frontend may display different cards depending on role.
router.get("/kpis", requireAuth, ctrl.getDashboardKpis);

export default router;
