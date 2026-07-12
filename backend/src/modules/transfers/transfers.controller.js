import { z } from "zod";
import { prisma } from "../../db.js";
import { notify } from "../../services/notify.js";

// ── Validation ──────────────────────────────────────────────────────────
const createSchema = z.object({
  assetId: z.number().int().positive(),
  toUserId: z.number().int().positive(),
});

const decisionSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

// ── POST /transfers ──────────────────────────────────────────────────────
// Creates a transfer request for an already-allocated asset.
// The fromUserId is auto-detected from the active allocation.
export async function createTransfer(req, res, next) {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "invalid input", details: parsed.error.flatten() });

    const { assetId, toUserId } = parsed.data;

    // Asset must exist
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return res.status(404).json({ error: "asset not found" });

    // Must have an active allocation to transfer FROM
    const activeAlloc = await prisma.allocation.findFirst({
      where: { assetId, returnedAt: null },
      include: { holderUser: { select: { id: true, name: true } } },
    });
    if (!activeAlloc) {
      return res.status(409).json({
        error: "no_active_allocation",
        message: "Asset is not currently allocated — use allocate instead.",
      });
    }

    // Can't transfer to the same holder
    if (activeAlloc.holderUserId === toUserId) {
      return res.status(409).json({ error: "same_holder", message: "Asset is already held by this user." });
    }

    // Check if a pending transfer already exists for this asset
    const pendingTransfer = await prisma.transferRequest.findFirst({
      where: { assetId, status: "requested" },
    });
    if (pendingTransfer) {
      return res.status(409).json({
        error: "transfer_already_pending",
        transferId: pendingTransfer.id,
      });
    }

    // Verify the target user exists
    const toUser = await prisma.user.findUnique({ where: { id: toUserId } });
    if (!toUser) return res.status(404).json({ error: "target user not found" });

    const transfer = await prisma.transferRequest.create({
      data: {
        assetId,
        fromUserId: activeAlloc.holderUserId,
        toUserId,
      },
      include: {
        asset: { select: { id: true, tag: true, name: true } },
        fromUser: { select: { id: true, name: true, email: true } },
        toUser: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify asset managers about the pending transfer
    // (In a full system we'd query for all asset_managers; for now notify the target)
    notify(
      toUserId,
      "transfer_requested",
      `Transfer request: ${asset.tag} (${asset.name}) from ${activeAlloc.holderUser?.name ?? "department"} to you.`
    ).catch(() => {});

    res.status(201).json(transfer);
  } catch (err) {
    next(err);
  }
}

// ── PATCH /transfers/:id ─────────────────────────────────────────────────
// Approve: close old allocation → open new one → asset stays "allocated"
// Reject: just flip status, no allocation change
export async function handleTransfer(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "invalid transfer id" });

    const parsed = decisionSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "invalid input", details: parsed.error.flatten() });

    const { action } = parsed.data;

    const transfer = await prisma.transferRequest.findUnique({
      where: { id },
      include: {
        asset: { select: { id: true, tag: true, name: true } },
      },
    });
    if (!transfer) return res.status(404).json({ error: "transfer not found" });
    if (transfer.status !== "requested") {
      return res.status(409).json({
        error: "transfer_already_decided",
        status: transfer.status,
      });
    }

    if (action === "reject") {
      const updated = await prisma.transferRequest.update({
        where: { id },
        data: {
          status: "rejected",
          decidedById: req.user.id,
          decidedAt: new Date(),
        },
        include: {
          asset: { select: { id: true, tag: true, name: true } },
          fromUser: { select: { id: true, name: true } },
          toUser: { select: { id: true, name: true } },
        },
      });

      // Notify both parties
      if (transfer.fromUserId) {
        notify(transfer.fromUserId, "transfer_rejected",
          `Transfer of ${transfer.asset.tag} was rejected.`).catch(() => {});
      }
      if (transfer.toUserId) {
        notify(transfer.toUserId, "transfer_rejected",
          `Transfer of ${transfer.asset.tag} to you was rejected.`).catch(() => {});
      }

      return res.json(updated);
    }

    // ── APPROVE: transaction to close old + open new allocation ──
    const result = await prisma.$transaction(async (tx) => {
      // 1. Close old allocation
      const oldAlloc = await tx.allocation.findFirst({
        where: { assetId: transfer.assetId, returnedAt: null },
      });
      if (oldAlloc) {
        await tx.allocation.update({
          where: { id: oldAlloc.id },
          data: {
            returnedAt: new Date(),
            checkinNotes: `Transferred to user ${transfer.toUserId} (transfer #${id})`,
          },
        });
      }

      // 2. Open new allocation for the target user
      const newAlloc = await tx.allocation.create({
        data: {
          assetId: transfer.assetId,
          holderUserId: transfer.toUserId,
          expectedReturnDate: oldAlloc?.expectedReturnDate ?? null,
        },
        include: {
          asset: { select: { id: true, tag: true, name: true } },
          holderUser: { select: { id: true, name: true, email: true } },
        },
      });

      // 3. Asset stays "allocated" (no status change needed)

      // 4. Mark transfer as approved
      const updatedTransfer = await tx.transferRequest.update({
        where: { id },
        data: {
          status: "approved",
          decidedById: req.user.id,
          decidedAt: new Date(),
        },
        include: {
          asset: { select: { id: true, tag: true, name: true } },
          fromUser: { select: { id: true, name: true } },
          toUser: { select: { id: true, name: true } },
        },
      });

      return { transfer: updatedTransfer, newAllocation: newAlloc };
    });

    // Notify both parties
    if (transfer.fromUserId) {
      notify(transfer.fromUserId, "transfer_approved",
        `${transfer.asset.tag} has been transferred away from you.`).catch(() => {});
    }
    if (transfer.toUserId) {
      notify(transfer.toUserId, "asset_assigned",
        `${transfer.asset.tag} (${transfer.asset.name}) has been transferred to you.`).catch(() => {});
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}

// ── GET /transfers ───────────────────────────────────────────────────────
export async function listTransfers(req, res, next) {
  try {
    const { status, assetId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (assetId) where.assetId = parseInt(assetId, 10);

    const transfers = await prisma.transferRequest.findMany({
      where,
      include: {
        asset: { select: { id: true, tag: true, name: true } },
        fromUser: { select: { id: true, name: true, email: true } },
        toUser: { select: { id: true, name: true, email: true } },
        decidedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(transfers);
  } catch (err) {
    next(err);
  }
}
