import jwt from "jsonwebtoken";

// OWNER: Yashraj. Everyone uses these; only Yashraj edits this file.

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "no token" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "invalid or expired token" });
  }
}

// usage: router.post("/departments", requireAuth, requireRole("admin"), handler)
export const requireRole =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user?.role)
      ? next()
      : res.status(403).json({ error: "forbidden" });
