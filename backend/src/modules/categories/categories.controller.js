import { z } from "zod";
import { prisma } from "../../db.js";

const createSchema = z.object({
  name: z.string().min(1),
  customFields: z.record(z.unknown()).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  customFields: z.record(z.unknown()).optional().nullable(),
});

// ── GET /categories ─────────────────────────────────────────────────────────
export async function getCategories(req, res, next) {
  try {
    const categories = await prisma.assetCategory.findMany({
      orderBy: { name: "asc" },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

// ── POST /categories ────────────────────────────────────────────────────────
export async function createCategory(req, res, next) {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid input", details: parsed.error.flatten() });
    }

    const category = await prisma.assetCategory.create({
      data: parsed.data,
    });

    res.status(201).json(category);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "category name already exists" });
    }
    next(err);
  }
}

// ── PATCH /categories/:id ───────────────────────────────────────────────────
export async function updateCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "invalid id" });

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid input", details: parsed.error.flatten() });
    }

    const category = await prisma.assetCategory.update({
      where: { id },
      data: parsed.data,
    });

    res.json(category);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "not found" });
    }
    if (err.code === "P2002") {
      return res.status(409).json({ error: "category name already exists" });
    }
    next(err);
  }
}
