import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as ctrl from "./transfers.controller.js";

const router = Router();

// Any authenticated user can view and request transfers
router.get("/", requireAuth, ctrl.listTransfers);
router.post("/", requireAuth, ctrl.createTransfer);

// Only asset_manager / admin / dept_head can approve or reject
router.patch(
  "/:id",
  requireAuth,
  requireRole("admin", "asset_manager", "dept_head"),
  ctrl.handleTransfer
);

export default router;
