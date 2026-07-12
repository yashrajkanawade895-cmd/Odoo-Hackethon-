import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../../db.js";

// Zod strips unknown keys by default, so a sneaky {"role":"admin"} in the
// signup body is silently ignored — signup ALWAYS creates an employee.
const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const publicUser = { id: true, name: true, email: true, role: true, departmentId: true, status: true };

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, departmentId: user.departmentId },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
}

export async function signup(req, res, next) {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "invalid input", details: parsed.error.flatten() });

    const { name, email, password } = parsed.data;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: "email already registered" });

    const user = await prisma.user.create({
      data: { name, email, passwordHash: await bcrypt.hash(password, 10) },
      select: publicUser,
    });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid input" });

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    // same message for unknown email and wrong password — don't leak which
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ error: "invalid credentials" });
    if (user.status !== "active")
      return res.status(403).json({ error: "account inactive" });

    res.json({
      token: signToken(user),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

// fresh from DB so a role promotion shows up without re-login
export async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: publicUser,
    });
    if (!user) return res.status(404).json({ error: "user not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

// Hackathon-simple reset: short-lived JWT instead of emailed link.
// The token is returned in the response (in production it would be emailed).
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email ?? "" } });
    // always 200 so the endpoint can't be used to probe registered emails
    if (!user) return res.json({ message: "if that email exists, a reset link was sent" });

    const resetToken = jwt.sign(
      { id: user.id, purpose: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    res.json({ message: "if that email exists, a reset link was sent", resetToken });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 6)
      return res.status(400).json({ error: "token and newPassword (min 6 chars) required" });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "invalid or expired reset token" });
    }
    if (payload.purpose !== "password_reset")
      return res.status(401).json({ error: "invalid reset token" });

    await prisma.user.update({
      where: { id: payload.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    });
    res.json({ message: "password updated" });
  } catch (err) {
    next(err);
  }
}
