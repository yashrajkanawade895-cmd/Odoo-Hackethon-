// Seed: gives every dev + the demo an identical starting state.
// Run with:  npm run seed   (idempotent — safe to re-run)
// OWNER: Harshit — extend with more demo data in Phase 5.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const hash = (p) => bcrypt.hash(p, 10);

async function main() {
  // --- Departments ---
  const [it, hr, ops] = await Promise.all(
    ["IT", "HR", "Operations"].map((name) =>
      prisma.department.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  // --- Users: one per role. Signup only creates employees; these four
  // exist so the demo can start with a working admin. Password: pass123
  const password = await hash("pass123");
  const users = [
    { name: "Admin User", email: "admin@bento.test", role: "admin", departmentId: it.id },
    { name: "Meera Manager", email: "manager@bento.test", role: "asset_manager", departmentId: it.id },
    { name: "Dev Head", email: "head@bento.test", role: "dept_head", departmentId: ops.id },
    { name: "Priya Employee", email: "priya@bento.test", role: "employee", departmentId: hr.id },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role },
      create: { ...u, passwordHash: password },
    });
  }
  // point dept heads at real users
  const head = await prisma.user.findUnique({ where: { email: "head@bento.test" } });
  await prisma.department.update({ where: { id: ops.id }, data: { headId: head.id } });

  // --- Categories ---
  const cats = {};
  for (const [name, customFields] of [
    ["Electronics", { warranty_months: 24 }],
    ["Furniture", null],
    ["Vehicles", { registration_no: "" }],
    ["Meeting Rooms", null],
  ]) {
    cats[name] = await prisma.assetCategory.upsert({
      where: { name },
      update: {},
      create: { name, customFields: customFields ?? undefined },
    });
  }

  // --- Assets (tags AF-0001..; app-generated tags start at AF-0101 via sequence) ---
  const assets = [
    ["Dell Latitude 5540", "Electronics", "SN-LAP-001", "Mumbai HQ", false],
    ["MacBook Air M3", "Electronics", "SN-LAP-002", "Mumbai HQ", false],
    ['Monitor 27" LG', "Electronics", "SN-MON-001", "Mumbai HQ", false],
    ["Projector Epson X41", "Electronics", "SN-PRJ-001", "Mumbai HQ", true],
    ["Office Chair Ergo", "Furniture", null, "Mumbai HQ", false],
    ["Standing Desk", "Furniture", null, "Pune Office", false],
    ["Tata Ace Van", "Vehicles", "MH-12-AB-1234", "Pune Office", true],
    ["Conference Room B2", "Meeting Rooms", null, "Mumbai HQ", true],
    ["Meeting Room A1", "Meeting Rooms", null, "Mumbai HQ", true],
    ["Canon Printer G3010", "Electronics", "SN-PRN-001", "Pune Office", false],
  ];
  let i = 1;
  for (const [name, cat, serialNumber, location, isBookable] of assets) {
    const tag = `AF-${String(i++).padStart(4, "0")}`;
    await prisma.asset.upsert({
      where: { tag },
      update: {},
      create: {
        tag,
        name,
        categoryId: cats[cat].id,
        serialNumber,
        location,
        isBookable,
        condition: "good",
        acquisitionDate: new Date("2025-06-01"),
        acquisitionCost: 25000,
      },
    });
  }

  // app-generated tags continue from AF-0101
  await prisma.$executeRawUnsafe(`SELECT setval('asset_tag_seq', 100)`);

  // --- Projects (Bento workspace) + focus statuses so the dashboard/directory demo well ---
  const projectDefs = [
    ["Website Revamp", "Redesign of the public site and dashboard", it.id, "Conference Room B2"],
    ["Asset Migration Q3", "Physical asset re-tagging across offices", ops.id, "Meeting Room A1"],
    ["Onboarding 2.0", "New-hire onboarding workflow", hr.id, null],
  ];
  const projects = {};
  for (const [name, description, departmentId, meetingLocation] of projectDefs) {
    const existing = await prisma.project.findFirst({ where: { name } });
    projects[name] = existing ?? (await prisma.project.create({
      data: { name, description, departmentId, meetingLocation },
    }));
  }

  const focusByEmail = {
    "admin@assetflow.test": ["available", "Website Revamp"],
    "manager@assetflow.test": ["in_meeting", "Asset Migration Q3"],
    "head@assetflow.test": ["focus_time", "Asset Migration Q3"],
    "priya@assetflow.test": ["wfh", "Onboarding 2.0"],
  };
  for (const [email, [focusStatus, projectName]] of Object.entries(focusByEmail)) {
    await prisma.user.updateMany({
      where: { email },
      data: { focusStatus, projectId: projects[projectName].id },
    });
  }

  console.log("Seed complete: 4 users (pass123), 3 departments, 4 categories, 10 assets, 3 projects");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
