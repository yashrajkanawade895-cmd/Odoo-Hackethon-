import { z } from "zod";
import { prisma } from "../../db.js";

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  departmentId: z.number().int().positive().optional().nullable(),
  meetingLocation: z.string().optional().nullable(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["active", "paused", "completed"]).optional(),
  departmentId: z.number().int().positive().optional().nullable(),
  meetingLocation: z.string().optional().nullable(),
});

// ── GET /projects ──────────────────────────────────────────────────────────
export async function getProjects(req, res, next) {
  try {
    const { department } = req.query;
    const where = {};
    if (department) {
      const deptId = parseInt(department, 10);
      if (!isNaN(deptId)) where.departmentId = deptId;
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        members: { select: { id: true, name: true, focusStatus: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(projects);
  } catch (err) {
    next(err);
  }
}

// ── POST /projects ─────────────────────────────────────────────────────────
export async function createProject(req, res, next) {
  try {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid input", details: parsed.error.flatten() });
    }

    const project = await prisma.project.create({
      data: parsed.data,
      include: {
        department: { select: { id: true, name: true } },
        members: { select: { id: true, name: true, focusStatus: true, role: true } },
      },
    });

    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
}

// ── PATCH /projects/:id ────────────────────────────────────────────────────
export async function updateProject(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "invalid id" });

    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid input", details: parsed.error.flatten() });
    }

    const project = await prisma.project.update({
      where: { id },
      data: parsed.data,
      include: {
        department: { select: { id: true, name: true } },
        members: { select: { id: true, name: true, focusStatus: true, role: true } },
      },
    });

    res.json(project);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "not found" });
    }
    next(err);
  }
}
