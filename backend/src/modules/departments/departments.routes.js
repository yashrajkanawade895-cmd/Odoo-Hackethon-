import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as departments from "./departments.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", departments.list);
router.post("/", requireRole("admin"), departments.create);
router.patch("/:id", requireRole("admin"), departments.update);

export default router;
