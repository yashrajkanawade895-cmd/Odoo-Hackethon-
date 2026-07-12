import { z } from "zod";
import { prisma } from "../../db.js";

const updateRoleSchema = z.object({
  role: z.enum(["asset_manager", "dept_head", "employee", "admin"]),
});

const updateEmployeeSchema = z.object({
  departmentId: z.number().int().positive().optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
  contactEmail: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  projectId: z.number().int().positive().optional().nullable(),
});

const updateFocusSchema = z.object({
  focusStatus: z.enum(["available", "focus_time", "in_meeting", "wfh", "away"]),
});

// ── GET /employees ──────────────────────────────────────────────────────────
export async function getEmployees(req, res, next) {
  try {
    const { department, role, status, q } = req.query;

    const where = {};

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    if (department) {
      const deptId = parseInt(department, 10);
      if (!isNaN(deptId)) {
        where.departmentId = deptId;
      }
    }

    if (role) where.role = role;
    if (status) where.status = status;

    const employees = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        focusStatus: true,
        contactEmail: true,
        phone: true,
        createdAt: true,
        department: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, meetingLocation: true } },
        manager: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });

    res.json(employees);
  } catch (err) {
    next(err);
  }
}

// ── PATCH /employees/:id/role ───────────────────────────────────────────────
export async function updateEmployeeRole(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "invalid id" });

    // Prevent changing your own role to avoid locking out the only admin
    if (id === req.user.id) {
      return res.status(400).json({ error: "cannot change your own role" });
    }

    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid input", details: parsed.error.flatten() });
    }

    const employee = await prisma.user.update({
      where: { id },
      data: { role: parsed.data.role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        focusStatus: true,
        department: { select: { id: true, name: true } },
      },
    });

    res.json(employee);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "not found" });
    }
    next(err);
  }
}

// ── PATCH /employees/:id ────────────────────────────────────────────────────
export async function updateEmployee(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "invalid id" });

    const parsed = updateEmployeeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid input", details: parsed.error.flatten() });
    }

    const employee = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        focusStatus: true,
        department: { select: { id: true, name: true } },
      },
    });

    res.json(employee);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "not found" });
    }
    next(err);
  }
}
