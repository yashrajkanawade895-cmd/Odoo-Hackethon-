import cron from "node-cron";
import { prisma } from "../db.js";
import { notify } from "./notify.js";

// Background scheduler — runs every minute.
// OVERDUE: flags allocations past their expected return date and feeds Notifications.
// REMINDERS: notifies bookers before their slot starts.
// Idempotent via Allocation.overdueNotified / Booking.reminderSent.

async function runOverdue(now) {
  const overdue = await prisma.allocation.findMany({
    where: {
      returnedAt: null,
      expectedReturnDate: { lt: now },
      overdueNotified: false,
    },
    include: { asset: { select: { tag: true, name: true } } },
  });

  let flagged = 0;
  for (const a of overdue) {
    try {
      if (a.holderUserId) {
        await notify(
          a.holderUserId,
          "overdue_return",
          `Asset ${a.asset.tag} (${a.asset.name}) is overdue for return.`
        );
      }
      await prisma.allocation.update({
        where: { id: a.id },
        data: { overdueNotified: true },
      });
      flagged++;
    } catch (err) {
      console.error(`[scheduler] overdue allocation ${a.id} failed:`, err);
    }
  }
  return flagged;
}

async function runReminders(now) {
  const soon = new Date(now.getTime() + 60 * 60 * 1000);
  const bookings = await prisma.booking.findMany({
    where: {
      status: { not: "cancelled" },
      reminderSent: false,
      startTs: { gte: now, lte: soon },
    },
    include: { asset: { select: { tag: true, name: true } } },
  });

  let sent = 0;
  for (const b of bookings) {
    try {
      await notify(
        b.userId,
        "booking_reminder",
        `Reminder: your booking of ${b.asset.tag} (${b.asset.name}) starts soon.`
      );
      await prisma.booking.update({
        where: { id: b.id },
        data: { reminderSent: true },
      });
      sent++;
    } catch (err) {
      console.error(`[scheduler] booking reminder ${b.id} failed:`, err);
    }
  }
  return sent;
}

async function tick() {
  const now = new Date();
  try {
    const flagged = await runOverdue(now);
    const sent = await runReminders(now);
    if (flagged || sent) {
      console.log(
        `[scheduler] flagged ${flagged} overdue allocation(s), sent ${sent} booking reminder(s)`
      );
    }
  } catch (err) {
    console.error("[scheduler] tick failed:", err);
  }
}

export function startScheduler() {
  cron.schedule("* * * * *", tick);
  console.log("[scheduler] started — checking overdue returns & booking reminders every minute");
}
