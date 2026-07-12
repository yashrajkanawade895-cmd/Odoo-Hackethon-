import { z } from "zod";
import { prisma } from "../../db.js";
import { notify } from "../../services/notify.js";

// ── Validation ──────────────────────────────────────────────────────────
const createSchema = z.object({
  assetId: z.number().int().positive(),
  holderUserId: z.number().int().positive().optional(),
  holderDepartmentId: z.number().int().positive().optional(),
  expectedReturnDate: z.coerce.date().optional(),
}).refine(
  (d) => d.holderUserId || d.holderDepartmentId,
  { message: "holderUserId or holderDepartmentId required" }
).refine(
  (d) => !d.expectedReturnDate || d.expectedReturnDate > new Date(),
  { message: "error: past date:", path: ["expectedReturnDate"] }
);

const returnSchema = z.object({
  checkinNotes: z.string().optional(),
});

// ── POST /allocations ────────────────────────────────────────────────────
// Rule 1: no double allocation — partial unique index backs this up,
// but we do an app-level check first to return a helpful 409 body.
export async function createAllocation(req, res, next) {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "invalid input", details: parsed.error.flatten() });

    const { assetId, holderUserId, holderDepartmentId, expectedReturnDate } = parsed.data;

    // Asset must exist and be available
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return res.status(404).json({ error: "asset not found" });
    if (asset.isBookable) return res.status(400).json({ error: "asset is bookable and cannot be allocated" });

    if (asset.status !== "available") {
      // Check if there's an active allocation to give a helpful message
      const active = await prisma.allocation.findFirst({
        where: { assetId, returnedAt: null },
        include: {
          holderUser: { select: { id: true, name: true, email: true } },
          holderDepartment: { select: { id: true, name: true } },
        },
      });

      if (active) {
        const heldBy = active.holderUser?.name || active.holderDepartment?.name || "unknown";
        return res.status(409).json({
          error: "asset_already_allocated",
          held_by: heldBy,
          holder: active.holderUser || active.holderDepartment,
          allocationId: active.id,
          suggest: "transfer",
        });
      }

      return res.status(409).json({
        error: "asset_not_available",
        currentStatus: asset.status,
      });
    }

    // Create allocation + flip asset status in a transaction
    const allocation = await prisma.$transaction(async (tx) => {
      const alloc = await tx.allocation.create({
        data: {
          assetId,
          holderUserId: holderUserId ?? null,
          holderDepartmentId: holderDepartmentId ?? null,
          expectedReturnDate: expectedReturnDate ?? null,
        },
        include: {
          asset: { select: { id: true, tag: true, name: true } },
          holderUser: { select: { id: true, name: true, email: true } },
          holderDepartment: { select: { id: true, name: true } },
        },
      });

      await tx.asset.update({
        where: { id: assetId },
        data: { status: "allocated" },
      });

      return alloc;
    });

    // Notify the holder
    if (holderUserId) {
      notify(holderUserId, "asset_assigned", `Asset ${asset.tag} (${asset.name}) has been allocated to you.`).catch(() => {});
    }

    res.status(201).json(allocation);
  } catch (err) {
    // Prisma unique constraint violation (race condition fallback)
    if (err.code === "P2002") {
      return res.status(409).json({ error: "asset_already_allocated", suggest: "transfer" });
    }
    next(err);
  }
}

// ── PATCH /allocations/:id/return ────────────────────────────────────────
export async function returnAllocation(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "invalid allocation id" });

    const parsed = returnSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "invalid input", details: parsed.error.flatten() });

    const allocation = await prisma.allocation.findUnique({
      where: { id },
      include: { asset: true },
    });
    if (!allocation) return res.status(404).json({ error: "allocation not found" });
    if (allocation.returnedAt)
      return res.status(409).json({ error: "already returned", returnedAt: allocation.returnedAt });

    // Return allocation + flip asset back to available
    const updated = await prisma.$transaction(async (tx) => {
      const alloc = await tx.allocation.update({
        where: { id },
        data: {
          returnedAt: new Date(),
          checkinNotes: parsed.data.checkinNotes ?? null,
        },
        include: {
          asset: { select: { id: true, tag: true, name: true } },
          holderUser: { select: { id: true, name: true } },
        },
      });

      await tx.asset.update({
        where: { id: allocation.assetId },
        data: { status: "available" },
      });

      return alloc;
    });

    // Notify the holder that their asset was returned
    if (allocation.holderUserId) {
      notify(
        allocation.holderUserId,
        "asset_returned",
        `Asset ${allocation.asset.tag} has been returned.`
      ).catch(() => {});
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// ── GET /allocations ─────────────────────────────────────────────────────
export async function listAllocations(req, res, next) {
  try {
    const { assetId, holder, overdue, active } = req.query;

    const where = {};

    if (assetId) where.assetId = parseInt(assetId, 10);

    // "holder" can be a user name search
    if (holder) {
      where.holderUser = { name: { contains: holder, mode: "insensitive" } };
    }

    // overdue=true → returned_at IS NULL AND expected_return_date < NOW
    if (overdue === "true") {
      where.returnedAt = null;
      where.expectedReturnDate = { lt: new Date() };
    }

    // active=true → only un-returned allocations
    if (active === "true") {
      where.returnedAt = null;
    }

    const allocations = await prisma.allocation.findMany({
      where,
      include: {
        asset: { select: { id: true, tag: true, name: true, status: true } },
        holderUser: { select: { id: true, name: true, email: true } },
        holderDepartment: { select: { id: true, name: true } },
      },
      orderBy: { allocatedAt: "desc" },
    });

    res.json(allocations);
  } catch (err) {
    next(err);
  }
}
