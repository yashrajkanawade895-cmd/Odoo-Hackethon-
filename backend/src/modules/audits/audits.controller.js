import { z } from "zod";
import { prisma } from "../../db.js";
import { changeAssetStatus } from "../../services/assetStatus.js";

const createCycleSchema = z.object({
  name: z.string().min(1),
  scopeDepartmentId: z.number().int().positive().optional(),
  scopeLocation: z.string().min(1).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine(data => data.endDate > data.startDate, { message: "endDate must be after startDate" });

const patchItemSchema = z.object({
  result: z.enum(["verified", "missing", "damaged"]),
  notes: z.string().optional(),
});

const assignAuditorsSchema = z.object({
  auditorIds: z.array(z.number().int().positive()).min(1),
});

// ── POST /audit-cycles ──────────────────────────────────────────────────────
export async function createAuditCycle(req, res, next) {
  try {
    const parsed = createCycleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid input", details: parsed.error.flatten() });

    const { name, scopeDepartmentId, scopeLocation, startDate, endDate } = parsed.data;

    const cycle = await prisma.$transaction(async (tx) => {
      // 1. Create the cycle
      const createdCycle = await tx.auditCycle.create({
        data: {
          name,
          scopeDepartmentId,
          scopeLocation,
          startDate,
          endDate,
          createdById: req.user.id
        }
      });

      // 2. Determine assets in scope (exclude retired/lost)
      const assetWhere = { status: { notIn: ["retired", "disposed", "lost"] } };
      
      if (scopeLocation) {
        assetWhere.location = { contains: scopeLocation, mode: "insensitive" };
      }
      
      if (scopeDepartmentId) {
        // If scoped to a department, find assets allocated to it
        const activeAllocations = await tx.allocation.findMany({
          where: { holderDepartmentId: scopeDepartmentId, returnedAt: null },
          select: { assetId: true }
        });
        const allocatedAssetIds = activeAllocations.map(a => a.assetId);
        assetWhere.id = { in: allocatedAssetIds };
      }

      const assetsInScope = await tx.asset.findMany({
        where: assetWhere,
        select: { id: true }
      });

      // 3. Create AuditItems
      if (assetsInScope.length > 0) {
        await tx.auditItem.createMany({
          data: assetsInScope.map(a => ({
            cycleId: createdCycle.id,
            assetId: a.id,
            result: "pending"
          }))
        });
      }

      return createdCycle;
    });

    res.status(201).json(cycle);
  } catch(err) { next(err); }
}

// ── POST /audit-cycles/:id/auditors ─────────────────────────────────────────
export async function assignAuditors(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "invalid cycle id" });

    const parsed = assignAuditorsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid input", details: parsed.error.flatten() });

    const { auditorIds } = parsed.data;

    // Distribute unassigned items evenly among auditors
    await prisma.$transaction(async (tx) => {
      const items = await tx.auditItem.findMany({
        where: { cycleId: id, auditorId: null }
      });

      if (items.length === 0) return;

      for (let i = 0; i < items.length; i++) {
        const auditorId = auditorIds[i % auditorIds.length];
        await tx.auditItem.update({
          where: { id: items[i].id },
          data: { auditorId }
        });
      }
    });

    res.json({ message: "Auditors assigned successfully" });
  } catch(err) { next(err); }
}

// ── GET /audit-cycles ───────────────────────────────────────────────────────
export async function listAuditCycles(req, res, next) {
  try {
    const cycles = await prisma.auditCycle.findMany({
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { items: true } }
      },
      orderBy: { startDate: "desc" }
    });
    res.json(cycles);
  } catch(err) { next(err); }
}

// ── GET /audit-cycles/:id ───────────────────────────────────────────────────
export async function getAuditCycle(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "invalid cycle id" });

    const cycle = await prisma.auditCycle.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true } },
        scopeDepartment: { select: { name: true } },
        items: {
          include: {
            asset: { select: { tag: true, name: true, location: true } },
            auditor: { select: { name: true } }
          }
        }
      }
    });

    if (!cycle) return res.status(404).json({ error: "cycle not found" });

    // Calculate progress
    const total = cycle.items.length;
    const completed = cycle.items.filter(i => i.result !== "pending").length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.json({ ...cycle, progress, completed, total });
  } catch(err) { next(err); }
}

// ── GET /audit-cycles/:id/discrepancies ─────────────────────────────────────
export async function getDiscrepancies(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "invalid cycle id" });

    const discrepancies = await prisma.auditItem.findMany({
      where: { 
        cycleId: id, 
        result: { in: ["missing", "damaged"] } 
      },
      include: {
        asset: { select: { tag: true, name: true, location: true } },
        auditor: { select: { name: true } }
      }
    });

    res.json(discrepancies);
  } catch(err) { next(err); }
}

// ── PATCH /audit-cycles/:id/close ───────────────────────────────────────────
export async function closeAuditCycle(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "invalid cycle id" });

    const cycle = await prisma.auditCycle.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!cycle) return res.status(404).json({ error: "cycle not found" });
    if (cycle.status === "closed") return res.status(400).json({ error: "cycle is already closed" });

    await prisma.$transaction(async (tx) => {
      // Mark missing items as "lost"
      const missingItems = cycle.items.filter(i => i.result === "missing");
      if (missingItems.length > 0) {
        for (const i of missingItems) {
          await changeAssetStatus(i.assetId, "lost", { userId: req.user?.id, tx });
        }
      }

      // Lock the cycle
      await tx.auditCycle.update({
        where: { id },
        data: { status: "closed" }
      });
    });

    res.json({ message: "Audit cycle closed successfully" });
  } catch(err) { next(err); }
}

// ── PATCH /audit-items/:id ──────────────────────────────────────────────────
export async function updateAuditItem(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "invalid audit item id" });

    const parsed = patchItemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid input", details: parsed.error.flatten() });

    // Make sure cycle is not closed
    const item = await prisma.auditItem.findUnique({
      where: { id },
      include: { cycle: true }
    });

    if (!item) return res.status(404).json({ error: "audit item not found" });
    if (item.cycle.status === "closed") return res.status(400).json({ error: "cannot modify item in closed cycle" });
    
    // Check permission (only assigned auditor or admin/asset_manager can update)
    if (item.auditorId && item.auditorId !== req.user.id && req.user.role !== "admin" && req.user.role !== "asset_manager") {
      return res.status(403).json({ error: "forbidden" });
    }

    const updated = await prisma.auditItem.update({
      where: { id },
      data: {
        result: parsed.data.result,
        notes: parsed.data.notes
      }
    });

    res.json(updated);
  } catch(err) { next(err); }
}
