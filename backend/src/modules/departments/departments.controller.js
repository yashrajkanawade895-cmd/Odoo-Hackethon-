import { prisma } from "../../db.js";
import { z } from "zod";

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

export const list = async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        head: {
          select: { name: true, email: true },
        },
        parent: {
          select: { name: true },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { name: 'asc' }
    });
    res.json(departments);
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const dept = await prisma.department.create({ data });
    res.status(201).json(dept);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "validation error", details: error.errors });
    }
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = updateSchema.parse(req.body);

    if (data.parentId === id) {
      return res.status(400).json({ error: "department cannot be its own parent" });
    }

    const dept = await prisma.department.update({
      where: { id },
      data,
    });
    res.json(dept);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "validation error", details: error.errors });
    }
    next(error);
  }
};
