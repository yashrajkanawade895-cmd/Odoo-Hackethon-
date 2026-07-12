import { prisma } from "../../db.js";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.enum(["asset_manager", "dept_head", "employee"]),
});

const updateSchema = z.object({
  departmentId: z.number().int().positive().optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const list = async (req, res, next) => {
  try {
    const { department, role, status, q } = req.query;

    const where = {};
    if (department) where.departmentId = parseInt(department, 10);
    if (role) where.role = role;
    if (status) where.status = status;
    
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const employees = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        departmentId: true,
        createdAt: true,
        department: {
          select: { name: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(employees);
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = updateRoleSchema.parse(req.body);

    if (req.user.id === id) {
      return res.status(400).json({ error: "cannot change your own role" });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role: data.role },
      select: { id: true, name: true, email: true, role: true }
    });
    res.json(user);
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

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, departmentId: true, status: true }
    });
    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "validation error", details: error.errors });
    }
    next(error);
  }
};
