// using built-in fetch

async function run() {
  console.log("Logging in as admin...");
  const loginRes = await fetch("http://localhost:5000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@bento.test", password: "pass123" })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    console.error("Login failed", loginData);
    process.exit(1);
  }
  const token = loginData.token;
  console.log("Logged in!");

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };

  // 1. Create a department
  console.log("Creating department...");
  const deptRes = await fetch("http://localhost:5000/departments", {
    method: "POST",
    headers,
    body: JSON.stringify({ name: "Security Team" })
  });
  console.log("Department response:", deptRes.status, await deptRes.json());

  // 2. Create a category
  console.log("Creating category...");
  const catRes = await fetch("http://localhost:5000/categories", {
    method: "POST",
    headers,
    body: JSON.stringify({ name: "Firearms", customFields: { ammo_type: "9mm" } })
  });
  console.log("Category response:", catRes.status, await catRes.json());

  // 3. Get employees
  console.log("Getting employees...");
  const empRes = await fetch("http://localhost:5000/employees", { headers });
  const empData = await empRes.json();
  console.log(`Found ${empData.length} employees`);

  // 4. Update an employee role (find Priya)
  const priya = empData.find(e => e.email === "priya@bento.test");
  if (priya) {
    console.log(`Updating role for ${priya.name}...`);
    const patchRes = await fetch(`http://localhost:5000/employees/${priya.id}/role`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ role: "dept_head" })
    });
    console.log("Role update response:", patchRes.status, await patchRes.json());
  }

  // 5. Check activity logs to see if our middleware worked
  console.log("Checking activity logs...");
  const logsRes = await fetch("http://localhost:5000/activity-logs", { headers });
  const logs = await logsRes.json();
  console.log("Recent logs:", logs.slice(0, 3).map(l => `${l.action} (entity ${l.entityId}) by user ${l.userId}`));
}

run().catch(console.error);
