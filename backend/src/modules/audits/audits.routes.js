import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as ctrl from "./audits.controller.js";

export const auditCyclesRouter = Router();

// List and get details of audit cycles (viewable by all for transparency, or restrict to manager/admin)
auditCyclesRouter.get("/", requireAuth, ctrl.listAuditCycles);
auditCyclesRouter.get("/:id", requireAuth, ctrl.getAuditCycle);
auditCyclesRouter.get("/:id/discrepancies", requireAuth, ctrl.getDiscrepancies);

// Creating, assigning, closing is for admins/managers
auditCyclesRouter.post("/", requireAuth, requireRole("admin", "asset_manager"), ctrl.createAuditCycle);
auditCyclesRouter.post("/:id/auditors", requireAuth, requireRole("admin", "asset_manager"), ctrl.assignAuditors);
auditCyclesRouter.patch("/:id/close", requireAuth, requireRole("admin", "asset_manager"), ctrl.closeAuditCycle);

export const auditItemsRouter = Router();

// Auditors update the items
auditItemsRouter.patch("/:id", requireAuth, ctrl.updateAuditItem);
