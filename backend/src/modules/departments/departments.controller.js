import { z } from "zod";
import { prisma } from "../../db.js";

const createSchema = z.object({
  name: z.string().min(1),
  headId: z.number().int().positive().optional(),
  parentId: z.number().int().positive().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  headId: z.number().int().positive().optional().nullable(),
  parentId: z.number().int().positive().optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
});

// ── GET /departments ────────────────────────────────────────────────────────
export async function getDepartments(req, res, next) {
  try {
    const departments = await prisma.department.findMany({
      include: {
        head: { select: { id: true, name: true, email: true } },
        parent: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
      orderBy: { name: "asc" },
    });
    res.json(departments);
  } catch (err) {
    next(err);
  }
}

// ── POST /departments ───────────────────────────────────────────────────────
export async function createDepartment(req, res, next) {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid input", details: parsed.error.flatten() });
    }

    const dept = await prisma.department.create({
      data: parsed.data,
      include: {
        head: { select: { id: true, name: true, email: true } },
        parent: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
    });

    res.status(201).json(dept);
  } catch (err) {
    next(err);
  }
}

// ── PATCH /departments/:id ──────────────────────────────────────────────────
export async function updateDepartment(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "invalid id" });

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid input", details: parsed.error.flatten() });
    }

    const dept = await prisma.department.update({
      where: { id },
      data: parsed.data,
      include: {
        head: { select: { id: true, name: true, email: true } },
        parent: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
    });

    res.json(dept);
  } catch (err) {
    // Check if it's a "record not found" error
    if (err.code === "P2025") {
      return res.status(404).json({ error: "not found" });
    }
    next(err);
  }
}
