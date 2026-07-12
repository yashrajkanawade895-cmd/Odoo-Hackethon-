import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as ctrl from "./categories.controller.js";

const router = Router();

router.get("/", requireAuth, ctrl.getCategories);
router.post("/", requireAuth, requireRole("admin"), ctrl.createCategory);
router.patch("/:id", requireAuth, requireRole("admin"), ctrl.updateCategory);

export default router;
