import { z } from "zod";
import { prisma } from "../../db.js";

// ── Validation ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  name:            z.string().min(1),
  categoryId:      z.number().int().positive(),
  serialNumber:    z.string().optional(),
  location:        z.string().min(1),
  condition:       z.enum(["new", "good", "fair", "poor"]).default("good"),
  isBookable:      z.boolean().default(false),
  acquisitionDate: z.coerce.date().optional(),
  acquisitionCost: z.number().positive().optional(),
  customData:      z.record(z.unknown()).optional(), // freeform JSONB
});

const patchSchema = z.object({
  name:            z.string().min(1).optional(),
  categoryId:      z.number().int().positive().optional(),
  serialNumber:    z.string().optional(),
  location:        z.string().optional(),
  condition:       z.enum(["new", "good", "fair", "poor"]).optional(),
  isBookable:      z.boolean().optional(),
  acquisitionDate: z.coerce.date().optional(),
  acquisitionCost: z.number().positive().optional(),
  customData:      z.record(z.unknown()).optional(),
  // NOTE: status can only be changed by allocation/maintenance/audit flows,
  // not directly via PATCH. This is enforced here.
});

// ── Asset include shape (reused in all handlers) ────────────────────────────
const assetInclude = {
  category: { select: { id: true, name: true, customFields: true } },
  allocations: {
    where: { returnedAt: null },
    take: 1,
    include: {
      holderUser:       { select: { id: true, name: true, email: true } },
      holderDepartment: { select: { id: true, name: true } },
    },
  },
};

// ── GET /assets ─────────────────────────────────────────────────────────────
export async function listAssets(req, res, next) {
  try {
    const { q, category, status, location, bookable } = req.query;

    const where = {};

    if (q) {
      where.OR = [
        { name:         { contains: q, mode: "insensitive" } },
        { tag:          { contains: q, mode: "insensitive" } },
        { serialNumber: { contains: q, mode: "insensitive" } },
        { location:     { contains: q, mode: "insensitive" } },
      ];
    }

    if (category) {
      // accept either category id (number) or name (string)
      const catId = parseInt(category, 10);
      where.category = isNaN(catId)
        ? { name: { contains: category, mode: "insensitive" } }
        : { id: catId };
    }

    if (status) where.status = status;
    if (location) where.location = { contains: location, mode: "insensitive" };
    if (bookable !== undefined) where.isBookable = bookable === "true";

    const assets = await prisma.asset.findMany({
      where,
      include: assetInclude,
      orderBy: { tag: "asc" },
    });

    res.json(assets);
  } catch (err) {
    next(err);
  }
}

// ── GET /assets/:id ─────────────────────────────────────────────────────────
export async function getAsset(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "invalid asset id" });

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: assetInclude,
    });

    if (!asset) return res.status(404).json({ error: "asset not found" });
    res.json(asset);
  } catch (err) {
    next(err);
  }
}

// ── POST /assets ────────────────────────────────────────────────────────────
// Tag is auto-generated from the asset_tag_seq sequence (AF-0101, AF-0102, …)
export async function createAsset(req, res, next) {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "invalid input", details: parsed.error.flatten() });

    // Verify category exists
    const category = await prisma.assetCategory.findUnique({
      where: { id: parsed.data.categoryId },
    });
    if (!category) return res.status(404).json({ error: "category not found" });

    // Auto-generate tag from DB sequence
    const [{ nextval }] = await prisma.$queryRaw`
      SELECT nextval('asset_tag_seq')::int AS nextval
    `;
    const tag = `AF-${String(nextval).padStart(4, "0")}`;

    const asset = await prisma.asset.create({
      data: {
        tag,
        name:            parsed.data.name,
        categoryId:      parsed.data.categoryId,
        serialNumber:    parsed.data.serialNumber ?? null,
        location:        parsed.data.location,
        condition:       parsed.data.condition,
        isBookable:      parsed.data.isBookable,
        acquisitionDate: parsed.data.acquisitionDate ?? null,
        acquisitionCost: parsed.data.acquisitionCost ?? null,
        customData:      parsed.data.customData ?? undefined,
      },
      include: assetInclude,
    });

    res.status(201).json(asset);
  } catch (err) {
    next(err);
  }
}

// ── PATCH /assets/:id ───────────────────────────────────────────────────────
// Status changes are intentionally blocked here — they happen via
// allocation/return, maintenance approve/resolve, audit close flows.
export async function updateAsset(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "invalid asset id" });

    if (req.body.status) {
      return res.status(400).json({
        error: "status_change_not_allowed",
        message: "Asset status is managed by allocation, maintenance, and audit flows.",
      });
    }

    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "invalid input", details: parsed.error.flatten() });

    const exists = await prisma.asset.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ error: "asset not found" });

    if (parsed.data.categoryId) {
      const cat = await prisma.assetCategory.findUnique({ where: { id: parsed.data.categoryId } });
      if (!cat) return res.status(404).json({ error: "category not found" });
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        ...(parsed.data.name            && { name: parsed.data.name }),
        ...(parsed.data.categoryId      && { categoryId: parsed.data.categoryId }),
        ...(parsed.data.serialNumber !== undefined && { serialNumber: parsed.data.serialNumber }),
        ...(parsed.data.location        && { location: parsed.data.location }),
        ...(parsed.data.condition       && { condition: parsed.data.condition }),
        ...(parsed.data.isBookable !== undefined   && { isBookable: parsed.data.isBookable }),
        ...(parsed.data.acquisitionDate && { acquisitionDate: parsed.data.acquisitionDate }),
        ...(parsed.data.acquisitionCost && { acquisitionCost: parsed.data.acquisitionCost }),
        ...(parsed.data.customData      && { customData: parsed.data.customData }),
      },
      include: assetInclude,
    });

    res.json(asset);
  } catch (err) {
    next(err);
  }
}

// ── GET /assets/:id/history ─────────────────────────────────────────────────
// Combined allocation + maintenance history, newest first
export async function getAssetHistory(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "invalid asset id" });

    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return res.status(404).json({ error: "asset not found" });

    const [allocations, maintenance] = await Promise.all([
      prisma.allocation.findMany({
        where: { assetId: id },
        include: {
          holderUser:       { select: { id: true, name: true, email: true } },
          holderDepartment: { select: { id: true, name: true } },
        },
        orderBy: { allocatedAt: "desc" },
      }),
      prisma.maintenanceRequest.findMany({
        where: { assetId: id },
        include: {
          raisedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Merge and sort newest first
    const history = [
      ...allocations.map((a) => ({ type: "allocation", ...a, _ts: a.allocatedAt })),
      ...maintenance.map((m) => ({ type: "maintenance", ...m, _ts: m.createdAt })),
    ].sort((a, b) => new Date(b._ts) - new Date(a._ts));

    res.json(history);
  } catch (err) {
    next(err);
  }
}
