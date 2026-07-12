import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as ctrl from "./allocations.controller.js";

const router = Router();

// Any authenticated user can view allocations
router.get("/", requireAuth, ctrl.listAllocations);

// Only asset_manager / admin / dept_head can allocate or return
router.post(
  "/",
  requireAuth,
  requireRole("admin", "asset_manager", "dept_head"),
  ctrl.createAllocation
);

router.patch(
  "/:id/return",
  requireAuth,
  requireRole("admin", "asset_manager", "dept_head"),
  ctrl.returnAllocation
);

export default router;
