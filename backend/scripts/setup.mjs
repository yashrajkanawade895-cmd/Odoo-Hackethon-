// One-command local setup for a fresh machine:  npm run setup
// - creates backend/.env from the template on first run (then asks you to set your password)
// - creates the database if missing, applies migrations, DB constraints, and seed data
// Safe to re-run.
import { execSync } from "node:child_process";
import { existsSync, copyFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(backendDir, ".env");
const examplePath = join(backendDir, ".env.example");

function run(cmd) {
  execSync(cmd, { cwd: backendDir, stdio: "inherit" });
}

// 1) Ensure .env exists
if (!existsSync(envPath)) {
  copyFileSync(examplePath, envPath);
  console.log("\n Created backend/.env from the template.");
  console.log("   Open backend/.env and set DATABASE_URL:");
  console.log("     • LOCAL:  put your own Postgres password in place of YOUR_PASSWORD");
  console.log("     • SHARED: paste the cloud Postgres URL your team is using");
  console.log("   Then run  npm run setup  again.\n");
  process.exit(0);
}

// 2) Guard against the untouched placeholder
const env = readFileSync(envPath, "utf8");
if (env.includes("YOUR_PASSWORD")) {
  console.error("\n backend/.env still has the placeholder password.");
  console.error("   Edit DATABASE_URL in backend/.env (replace YOUR_PASSWORD), then re-run npm run setup.\n");
  process.exit(1);
}

// 3) Build the database from zero (Prisma creates it if missing)
try {
  console.log("\n[1/3] Applying migrations…");
  run("npx prisma migrate deploy");
  console.log("\n[2/3] Applying DB constraints (unique index, booking overlap, tag sequence)…");
  run("npm run db:constraints");
  console.log("\n[3/3] Seeding demo data…");
  run("npm run seed");
} catch {
  console.error("\n Setup failed. Most common causes:");
  console.error("   • PostgreSQL isn't running, or DATABASE_URL host/port is wrong");
  console.error("   • wrong password in DATABASE_URL");
  console.error("   • (local) PostgreSQL 16 isn't installed\n");
  process.exit(1);
}

console.log("\n Setup complete. Start the API with:  npm run dev");
console.log("   Seeded logins (password: pass123):");
console.log("     admin@assetflow.test · manager@assetflow.test · head@assetflow.test · priya@assetflow.test\n");
