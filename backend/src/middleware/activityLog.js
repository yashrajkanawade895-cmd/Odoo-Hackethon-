import { prisma } from "../db.js";

// Middleware to log mutating requests (POST, PATCH, DELETE)
export function activityLogger(req, res, next) {
  // Only log mutating requests
  if (!["POST", "PATCH", "DELETE"].includes(req.method)) {
    return next();
  }

  // Hook into res.on('finish') to log after the response is sent successfully
  res.on("finish", async () => {
    // Only log if the request was successful (2xx)
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      try {
        const pathParts = req.baseUrl.split("/").filter(Boolean);
        const entityName = pathParts[0] || "unknown"; // e.g. "assets", "departments"
        
        // simple mapping, e.g. POST /assets -> asset.create
        let actionStr = "update";
        if (req.method === "POST") actionStr = "create";
        else if (req.method === "DELETE") actionStr = "delete";
        
        // remove plural for entityType
        const entityType = entityName.endsWith("s") ? entityName.slice(0, -1) : entityName;
        const action = `${entityType}.${actionStr}`;
        
        // determine entityId
        let entityId = null;
        if (req.params && req.params.id) {
            entityId = parseInt(req.params.id, 10);
        } else if (res.locals.entityId) {
            entityId = res.locals.entityId;
        }
        
        // We sanitize body to not log passwords or massive fields
        const safeBody = { ...req.body };
        delete safeBody.password;
        
        await prisma.activityLog.create({
          data: {
            userId: req.user.id,
            action,
            entityType,
            entityId: isNaN(entityId) ? null : entityId,
            detail: { method: req.method, path: req.originalUrl, body: safeBody },
          },
        });
      } catch (err) {
        console.error("Failed to write activity log:", err);
      }
    }
  });

  next();
}
