import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as ctrl from "./projects.controller.js";

const router = Router();

router.get("/", requireAuth, ctrl.getProjects);
router.post("/", requireAuth, requireRole("admin", "dept_head", "asset_manager"), ctrl.createProject);
router.patch("/:id", requireAuth, requireRole("admin", "dept_head", "asset_manager"), ctrl.updateProject);

export default router;
