import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as employees from "./employees.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", employees.list);
router.patch("/:id/role", requireRole("admin"), employees.updateRole);
router.patch("/:id", requireRole("admin"), employees.update);

export default router;
