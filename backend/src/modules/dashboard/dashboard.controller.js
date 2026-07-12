import { prisma } from "../../db.js";

// ── GET /dashboard/kpis ─────────────────────────────────────────────────────
export async function getDashboardKpis(req, res, next) {
  try {
    const now = new Date();
    
    // We run all these aggregations in parallel for speed.
    const [
      available,
      allocated,
      activeBookings,
      pendingTransfers,
      maintenanceToday,
      upcomingReturns,
      overdueReturns,
    ] = await Promise.all([
      // Available assets
      prisma.asset.count({ where: { status: "available" } }),
      
      // Allocated assets
      prisma.asset.count({ where: { status: "allocated" } }),
      
      // Active future bookings
      prisma.booking.count({ 
        where: { 
          endTs: { gt: now },
          status: { not: "cancelled" }
        }
      }),
      
      // Pending transfers
      prisma.transferRequest.count({ 
        where: { status: "requested" }
      }),
      
      // Active maintenance (pending, approved, in_progress, technician_assigned)
      prisma.maintenanceRequest.count({
        where: { 
          status: { in: ["pending", "approved", "in_progress", "technician_assigned"] }
        }
      }),
      
      // Upcoming returns (expectedReturnDate > now and not returned)
      prisma.allocation.count({
        where: {
          returnedAt: null,
          expectedReturnDate: { gt: now }
        }
      }),
      
      // Overdue returns (expectedReturnDate < now and not returned)
      prisma.allocation.count({
        where: {
          returnedAt: null,
          expectedReturnDate: { lt: now }
        }
      })
    ]);

    res.json({
      available,
      allocated,
      activeBookings,
      pendingTransfers,
      maintenanceToday,
      upcomingReturns,
      overdueReturns
    });

  } catch(err) {
    next(err);
  }
}

// ── GET /notifications ──────────────────────────────────────────────────────
export async function getNotifications(req, res, next) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 50 // Limit to recent 50 for performance
    });
    
    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false }
    });

    res.json({ unreadCount, notifications });
  } catch(err) { next(err); }
}

// ── PATCH /notifications/:id/read ───────────────────────────────────────────
export async function markNotificationRead(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "invalid id" });

    // Ensure they own it
    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif) return res.status(404).json({ error: "not found" });
    if (notif.userId !== req.user.id) return res.status(403).json({ error: "forbidden" });

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    res.json(updated);
  } catch(err) { next(err); }
}

// ── GET /activity-logs ──────────────────────────────────────────────────────
export async function getActivityLogs(req, res, next) {
  try {
    const { user, action, from, to } = req.query;
    
    const where = {};
    if (user) where.userId = parseInt(user, 10);
    if (action) where.action = action;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const logs = await prisma.activityLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    res.json(logs);
  } catch(err) { next(err); }
}

// ── GET /reports/utilization ────────────────────────────────────────────────
export async function getUtilizationReport(req, res, next) {
  try {
    // Simple utilization: group assets by category, count total vs allocated
    const categories = await prisma.assetCategory.findMany({
      include: {
        _count: {
          select: { assets: true }
        },
        assets: {
          where: { status: "allocated" },
          select: { id: true }
        }
      }
    });

    const report = categories.map(cat => ({
      category: cat.name,
      total: cat._count.assets,
      allocated: cat.assets.length,
      utilizationPercentage: cat._count.assets > 0 
        ? Math.round((cat.assets.length / cat._count.assets) * 100) 
        : 0
    }));

    res.json(report);
  } catch(err) { next(err); }
}

// ── GET /reports/export ─────────────────────────────────────────────────────
export async function exportReport(req, res, next) {
  try {
    const { type } = req.query; // only "csv" supported for now
    if (type !== "csv") return res.status(400).json({ error: "only csv is supported" });

    // We'll export a simple asset list as a CSV
    const assets = await prisma.asset.findMany({
      include: { category: true }
    });

    const headers = ["ID", "Tag", "Name", "Category", "Status", "Location", "Condition"];
    const rows = assets.map(a => [
      a.id, 
      a.tag, 
      `"${a.name}"`, 
      `"${a.category.name}"`, 
      a.status, 
      `"${a.location || ""}"`, 
      a.condition || ""
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="assets-export.csv"');
    res.send(csv);
  } catch(err) { next(err); }
}
