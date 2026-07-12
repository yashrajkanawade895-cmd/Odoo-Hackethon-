import { prisma } from "../db.js";

const VALID_TRANSITIONS = {
  available: ["allocated", "reserved", "under_maintenance", "retired", "disposed"],
  allocated: ["available", "under_maintenance", "lost"],
  reserved: ["allocated", "available"],
  under_maintenance: ["available", "allocated"],
  lost: ["available"],
  retired: ["disposed", "available"],
  disposed: [],
};

/**
 * Validates and changes an asset's status according to the state machine.
 * @param {number} assetId
 * @param {string} newStatus
 * @param {object} options - { reason, userId, tx }
 * @returns {Promise<object>} The updated asset
 */
export async function changeAssetStatus(assetId, newStatus, { reason, userId, tx = prisma } = {}) {
  // 1. Get current asset status
  const asset = await tx.asset.findUnique({
    where: { id: assetId },
    select: { status: true },
  });

  if (!asset) {
    const err = new Error("asset not found");
    err.status = 404;
    throw err;
  }

  const currentStatus = asset.status;

  // 2. No-op if status is unchanged
  if (currentStatus === newStatus) {
    return asset;
  }

  // 3. Validate transition
  const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(newStatus)) {
    const err = new Error(`invalid_transition: cannot move from ${currentStatus} to ${newStatus}`);
    err.status = 400;
    throw err;
  }

  // 4. Update the asset
  const updatedAsset = await tx.asset.update({
    where: { id: assetId },
    data: { status: newStatus },
  });

  // 5. Log the transition
  if (userId) {
    await tx.activityLog.create({
      data: {
        userId,
        action: "asset.status_change",
        entityType: "asset",
        entityId: assetId,
        detail: { from: currentStatus, to: newStatus, reason: reason || null },
      },
    });
  }

  return updatedAsset;
}
