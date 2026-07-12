import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import * as auth from "./auth.controller.js";

const router = Router();

router.post("/signup", auth.signup);
router.post("/login", auth.login);
router.post("/forgot-password", auth.forgotPassword);
router.post("/reset-password", auth.resetPassword);
router.get("/me", requireAuth, auth.me);

export default router;
