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
