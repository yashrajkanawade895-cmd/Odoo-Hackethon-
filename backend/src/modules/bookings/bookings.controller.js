import { z } from "zod";
import { prisma } from "../../db.js";
import { notify } from "../../services/notify.js";

// ── Validation ──────────────────────────────────────────────────────────────

const bookingSchema = z.object({
  assetId: z.number().int().positive(),
  startTs: z.coerce.date(),
  endTs: z.coerce.date(),
}).refine(data => data.endTs > data.startTs, { message: "endTs must be after startTs" })
  .refine(data => data.startTs > new Date(), { message: "error, select a present or fututre date", path: ["startTs"] });

const patchSchema = z.object({
  action: z.enum(["cancel"]).optional(),
  startTs: z.coerce.date().optional(),
  endTs: z.coerce.date().optional(),
}).refine(data => {
  if (data.action) return true;
  if (data.startTs && data.endTs) return data.endTs > data.startTs;
  return false;
}, { message: "Provide either action='cancel' or BOTH startTs and endTs to reschedule" })
  .refine(data => !data.startTs || data.startTs > new Date(), { message: "error, select a present or fututre date", path: ["startTs"] });

// ── GET /resources ──────────────────────────────────────────────────────────
export async function listResources(req, res, next) {
  try {
    const resources = await prisma.asset.findMany({
      where: { 
        isBookable: true, 
        status: { notIn: ["retired", "disposed", "lost"] } 
      },
      include: { category: { select: { name: true } } },
      orderBy: { name: "asc" }
    });
    res.json(resources);
  } catch(err) { next(err); }
}

// ── GET /resources/:id/bookings ─────────────────────────────────────────────
export async function getResourceBookings(req, res, next) {
  try {
    const assetId = parseInt(req.params.id, 10);
    const { from, to } = req.query;
    if (isNaN(assetId)) return res.status(400).json({ error: "invalid asset id" });

    const where = { assetId, status: { not: "cancelled" } };
    if (from) where.endTs = { gte: new Date(from) };
    if (to) where.startTs = { lte: new Date(to) };

    const bookings = await prisma.booking.findMany({
      where,
      include: { user: { select: { id: true, name: true } } },
      orderBy: { startTs: "asc" }
    });
    res.json(bookings);
  } catch(err) { next(err); }
}

// ── POST /bookings ──────────────────────────────────────────────────────────
export async function createBooking(req, res, next) {
  try {
    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid input", details: parsed.error.flatten() });
    
    const { assetId, startTs, endTs } = parsed.data;
    
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset || !asset.isBookable) return res.status(400).json({ error: "asset is not bookable or not found" });

    const booking = await prisma.booking.create({
      data: {
        assetId,
        userId: req.user.id,
        startTs,
        endTs
      },
      include: { asset: { select: { tag: true, name: true } } }
    });
    
    notify(req.user.id, "booking_confirmed", `Booking confirmed for ${asset.name}`).catch(()=>{});
    res.status(201).json(booking);
  } catch(err) {
    if (err.message && err.message.includes("no_overlapping_bookings")) {
      return res.status(409).json({ error: "booking_overlap", message: "This resource is already booked for the selected time." });
    }
    next(err);
  }
}

// ── GET /my-bookings ────────────────────────────────────────────────────────
export async function listMyBookings(req, res, next) {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: { asset: { select: { id: true, tag: true, name: true, location: true } } },
      orderBy: { startTs: "desc" }
    });
    res.json(bookings);
  } catch(err) { next(err); }
}

// ── PATCH /bookings/:id ─────────────────────────────────────────────────────
export async function updateBooking(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "invalid booking id" });
    
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid input", details: parsed.error.flatten() });

    const booking = await prisma.booking.findUnique({ where: { id }, include: { asset: true } });
    if (!booking) return res.status(404).json({ error: "booking not found" });
    
    // Only the owner, an admin, or an asset_manager can modify
    if (booking.userId !== req.user.id && req.user.role !== "admin" && req.user.role !== "asset_manager") {
      return res.status(403).json({ error: "forbidden" });
    }
    
    if (booking.status === "cancelled") return res.status(400).json({ error: "booking is already cancelled" });
    if (booking.endTs < new Date() && booking.userId === req.user.id) return res.status(400).json({ error: "cannot modify past bookings" });

    if (parsed.data.action === "cancel") {
      const updated = await prisma.booking.update({
        where: { id },
        data: { status: "cancelled" }
      });
      return res.json(updated);
    }
    
    // Reschedule
    const { startTs, endTs } = parsed.data;
    const updated = await prisma.booking.update({
      where: { id },
      data: { startTs, endTs }
    });
    res.json(updated);
  } catch (err) {
    if (err.message && err.message.includes("no_overlapping_bookings")) {
      return res.status(409).json({ error: "booking_overlap", message: "This resource is already booked for the selected time." });
    }
    next(err);
  }
}
