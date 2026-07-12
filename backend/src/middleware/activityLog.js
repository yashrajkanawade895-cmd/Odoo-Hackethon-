import { prisma } from "../db.js";

// Extracts entity type and action based on HTTP method and URL
function getActionDetails(method, url) {
  // Strip query strings
  const path = url.split("?")[0];
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  // The first segment is usually the entity type (e.g., 'departments', 'assets')
  const baseEntity = segments[0];
  // Singularize rudimentary (remove trailing 's' if present)
  let entityType = baseEntity;
  if (entityType.endsWith("s")) {
    entityType = entityType.slice(0, -1);
  }
  // Convert special cases like 'asset-categories' to 'asset_category' or just 'asset-category'
  
  let actionStr = "unknown";
  if (method === "POST") actionStr = "create";
  else if (method === "PATCH" || method === "PUT") actionStr = "update";
  else if (method === "DELETE") actionStr = "delete";

  // e.g. "department.create", "asset.update"
  const action = `${entityType}.${actionStr}`;

  return { entityType, action };
}

export function activityLogger(req, res, next) {
  // Only log mutating requests
  if (["POST", "PATCH", "PUT", "DELETE"].includes(req.method)) {
    const originalJson = res.json;

    // Hook into res.json to capture the response body
    res.json = function (body) {
      // Call the original res.json first to not block the response
      originalJson.call(this, body);

      // Only log on successful mutations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const details = getActionDetails(req.method, req.originalUrl);
          if (details) {
            let entityId = null;
            // Try to extract entity ID from the response body if it's an object with an 'id'
            if (body && typeof body === "object" && body.id !== undefined) {
              entityId = parseInt(body.id, 10);
              if (isNaN(entityId)) entityId = null;
            }

            // Fire and forget logging
            prisma.activityLog.create({
              data: {
                userId: req.user?.id || null,
                action: details.action,
                entityType: details.entityType,
                entityId: entityId,
                detail: { url: req.originalUrl, method: req.method }
              }
            }).catch(err => {
              console.error("Failed to log activity:", err);
            });
          }
        } catch (e) {
          console.error("Activity logger error:", e);
        }
      }
    };
  }
  next();
}
