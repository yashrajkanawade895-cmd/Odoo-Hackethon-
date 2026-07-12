import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as ctrl from "./employees.controller.js";

const router = Router();

router.get("/", requireAuth, ctrl.getEmployees);
router.patch("/:id/role", requireAuth, requireRole("admin"), ctrl.updateEmployeeRole);
router.patch("/:id/focus", requireAuth, ctrl.updateEmployeeFocus);
router.patch("/:id", requireAuth, requireRole("admin"), ctrl.updateEmployee);

export default router;
