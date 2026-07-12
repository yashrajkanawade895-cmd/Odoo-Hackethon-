import { z } from "zod";
import { prisma } from "../../db.js";
import { notify } from "../../services/notify.js";

// ── Validation ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  assetId:  z.number().int().positive(),
  issue:    z.string().min(5),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  photoUrl: z.string().url().optional(),
});

const patchSchema = z.object({
  action:     z.enum(["approve", "reject", "assign_technician", "start", "resolve"]),
  technician: z.string().optional(),
}).refine(data => {
  if (data.action === "assign_technician" && !data.technician) return false;
  return true;
}, { message: "technician name is required when action is 'assign_technician'" });

// ── POST /maintenance ───────────────────────────────────────────────────────
export async function createMaintenance(req, res, next) {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid input", details: parsed.error.flatten() });

    const { assetId, issue, priority, photoUrl } = parsed.data;

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return res.status(404).json({ error: "asset not found" });

    const request = await prisma.maintenanceRequest.create({
      data: {
        assetId,
        raisedById: req.user.id,
        issue,
        priority,
        photoUrl: photoUrl ?? null,
      },
      include: {
        asset: { select: { tag: true, name: true } },
        raisedBy: { select: { id: true, name: true } }
      }
    });

    res.status(201).json(request);
  } catch(err) {
    next(err);
  }
}

// ── GET /maintenance ────────────────────────────────────────────────────────
export async function listMaintenance(req, res, next) {
  try {
    const { status, assetId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (assetId) where.assetId = parseInt(assetId, 10);

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      include: {
        asset: { select: { id: true, tag: true, name: true, location: true } },
        raisedBy: { select: { id: true, name: true, email: true } },
        decidedBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(requests);
  } catch(err) {
    next(err);
  }
}

// ── PATCH /maintenance/:id ──────────────────────────────────────────────────
export async function updateMaintenance(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "invalid maintenance id" });

    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid input", details: parsed.error.flatten() });

    const request = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: { asset: true }
    });

    if (!request) return res.status(404).json({ error: "maintenance request not found" });

    const { action, technician } = parsed.data;
    let updated;

    if (action === "reject") {
      updated = await prisma.maintenanceRequest.update({
        where: { id },
        data: {
          status: "rejected",
          decidedById: req.user.id
        }
      });
      notify(request.raisedById, "maintenance_rejected", `Maintenance request for ${request.asset.name} was rejected.`).catch(()=>{});
      return res.json(updated);
    }

    if (action === "approve") {
      if (request.status !== "pending") return res.status(400).json({ error: "can only approve pending requests" });
      
      updated = await prisma.$transaction(async (tx) => {
        const m = await tx.maintenanceRequest.update({
          where: { id },
          data: { status: "approved", decidedById: req.user.id }
        });
        await tx.asset.update({
          where: { id: request.assetId },
          data: { status: "under_maintenance" }
        });
        return m;
      });
      notify(request.raisedById, "maintenance_approved", `Maintenance for ${request.asset.name} was approved.`).catch(()=>{});
      return res.json(updated);
    }

    if (action === "assign_technician") {
      updated = await prisma.maintenanceRequest.update({
        where: { id },
        data: { status: "technician_assigned", technician }
      });
      return res.json(updated);
    }

    if (action === "start") {
      updated = await prisma.maintenanceRequest.update({
        where: { id },
        data: { status: "in_progress" }
      });
      return res.json(updated);
    }

    if (action === "resolve") {
      updated = await prisma.$transaction(async (tx) => {
        const m = await tx.maintenanceRequest.update({
          where: { id },
          data: { status: "resolved", resolvedAt: new Date() }
        });
        // Wait, if an asset was allocated before maintenance, should it go back to allocated?
        // Let's check if there is an active allocation for this asset.
        const alloc = await tx.allocation.findFirst({
          where: { assetId: request.assetId, returnedAt: null }
        });
        
        await tx.asset.update({
          where: { id: request.assetId },
          data: { status: alloc ? "allocated" : "available" }
        });
        return m;
      });
      notify(request.raisedById, "maintenance_resolved", `Maintenance for ${request.asset.name} was completed.`).catch(()=>{});
      return res.json(updated);
    }

  } catch(err) {
    next(err);
  }
}
