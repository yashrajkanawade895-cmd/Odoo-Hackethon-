import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as ctrl from "./maintenance.controller.js";

const router = Router();

// Anyone authenticated can view maintenance history/status and report issues
router.get("/", requireAuth, ctrl.listMaintenance);
router.post("/", requireAuth, ctrl.createMaintenance);

// Only admins and asset managers can approve, reject, assign tech, resolve, etc.
router.patch("/:id", requireAuth, requireRole("admin", "asset_manager"), ctrl.updateMaintenance);

export default router;
