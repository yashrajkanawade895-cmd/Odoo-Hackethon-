import { prisma } from "../db.js";

// OWNER: Yashraj. Phase 1 stub — every module calls this on events
// (asset_assigned, maintenance_approved, booking_reminder, overdue_return, ...).
// Phase 4 may extend it (batching, websockets) without changing the signature.
export function notify(userId, type, message) {
  return prisma.notification.create({ data: { userId, type, message } });
}
