import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as ctrl from "./assets.controller.js";

const router = Router();

// All authenticated users can view assets
router.get("/",    requireAuth, ctrl.listAssets);
router.get("/:id", requireAuth, ctrl.getAsset);
router.get("/:id/history", requireAuth, ctrl.getAssetHistory);

// Only asset_manager / admin can create or edit assets
router.post(
  "/",
  requireAuth,
  requireRole("admin", "asset_manager"),
  ctrl.createAsset
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("admin", "asset_manager"),
  ctrl.updateAsset
);

export default router;
