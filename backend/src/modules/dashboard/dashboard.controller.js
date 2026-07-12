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

// ── GET /reports/maintenance-frequency ──────────────────────────────────────
export async function getMaintenanceFrequencyReport(req, res, next) {
  try {
    // Pull all maintenance requests with their asset's category, aggregate in JS.
    const requests = await prisma.maintenanceRequest.findMany({
      include: { asset: { include: { category: true } } }
    });

    const counts = {}; // category name -> count
    for (const r of requests) {
      const name = r.asset?.category?.name;
      if (!name) continue;
      counts[name] = (counts[name] || 0) + 1;
    }

    const report = Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    res.json(report);
  } catch(err) { next(err); }
}

// ── GET /reports/department-allocation ──────────────────────────────────────
export async function getDepartmentAllocationReport(req, res, next) {
  try {
    // Currently active allocations only (returnedAt = null).
    const allocations = await prisma.allocation.findMany({
      where: { returnedAt: null },
      include: {
        holderDepartment: true,
        holderUser: { include: { department: true } }
      }
    });

    const counts = {}; // department name -> count
    for (const a of allocations) {
      const name = a.holderDepartment?.name || a.holderUser?.department?.name;
      if (!name) continue; // skip if neither
      counts[name] = (counts[name] || 0) + 1;
    }

    const report = Object.entries(counts)
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count);

    res.json(report);
  } catch(err) { next(err); }
}

// ── GET /reports/booking-heatmap ────────────────────────────────────────────
export async function getBookingHeatmapReport(req, res, next) {
  try {
    // Non-cancelled bookings, grouped by day-of-week (0=Sun..6=Sat) and start hour.
    const bookings = await prisma.booking.findMany({
      where: { status: { not: "cancelled" } },
      select: { startTs: true }
    });

    const counts = {}; // "day-hour" -> count
    for (const b of bookings) {
      const d = new Date(b.startTs);
      const day = d.getDay();
      const hour = d.getHours();
      const key = `${day}-${hour}`;
      counts[key] = (counts[key] || 0) + 1;
    }

    const report = Object.entries(counts).map(([key, count]) => {
      const [day, hour] = key.split("-").map(Number);
      return { day, hour, count };
    });

    res.json(report);
  } catch(err) { next(err); }
}

// ── GET /reports/maintenance-due ────────────────────────────────────────────
export async function getMaintenanceDueReport(req, res, next) {
  try {
    const now = new Date();
    const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());

    // Assets currently under maintenance, or acquired long enough ago to near retirement.
    const assets = await prisma.asset.findMany();

    // Assets with an open maintenance request.
    const openRequests = await prisma.maintenanceRequest.findMany({
      where: {
        status: { in: ["pending", "approved", "technician_assigned", "in_progress"] }
      },
      select: { assetId: true }
    });
    const openAssetIds = new Set(openRequests.map(r => r.assetId));

    const byId = new Map(); // asset id -> report entry (maintenance reason wins over retirement)
    for (const a of assets) {
      let reason = null;
      if (a.status === "under_maintenance") {
        reason = "Currently under maintenance";
      } else if (openAssetIds.has(a.id)) {
        reason = "Open maintenance request";
      } else if (a.acquisitionDate && new Date(a.acquisitionDate) < threeYearsAgo) {
        reason = `Nearing retirement (acquired ${new Date(a.acquisitionDate).getFullYear()})`;
      }
      if (!reason) continue;

      byId.set(a.id, {
        id: a.id,
        tag: a.tag,
        name: a.name,
        status: a.status,
        reason
      });
    }

    res.json([...byId.values()]);
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
