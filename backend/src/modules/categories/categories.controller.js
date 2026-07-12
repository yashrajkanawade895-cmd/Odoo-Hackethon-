import { prisma } from "../../db.js";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  customFields: z.record(z.any()).optional().nullable(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  customFields: z.record(z.any()).optional().nullable(),
});

export const list = async (req, res, next) => {
  try {
    const categories = await prisma.assetCategory.findMany({
      include: {
        _count: {
          select: { assets: true },
        },
      },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const category = await prisma.assetCategory.create({ data });
    res.status(201).json(category);
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

    const category = await prisma.assetCategory.update({
      where: { id },
      data,
    });
    res.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "validation error", details: error.errors });
    }
    next(error);
  }
};
