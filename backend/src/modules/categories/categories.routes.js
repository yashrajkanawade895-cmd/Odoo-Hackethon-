import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as categories from "./categories.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", categories.list);
router.post("/", requireRole("admin"), categories.create);
router.patch("/:id", requireRole("admin"), categories.update);

export default router;
