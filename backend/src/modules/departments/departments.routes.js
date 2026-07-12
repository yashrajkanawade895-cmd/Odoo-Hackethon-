import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as ctrl from "./departments.controller.js";

const router = Router();

router.get("/", requireAuth, ctrl.getDepartments);
router.post("/", requireAuth, requireRole("admin"), ctrl.createDepartment);
router.patch("/:id", requireAuth, requireRole("admin"), ctrl.updateDepartment);

export default router;
