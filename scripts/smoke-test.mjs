const baseUrl = process.env.APP_URL || "http://localhost:3000";

async function assertOk(name, response) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${name} failed (${response.status}): ${text.slice(0, 300)}`);
  }
}

async function run() {
  console.log(`[smoke] baseUrl=${baseUrl}`);

  const health = await fetch(`${baseUrl}/api/health`);
  await assertOk("health", health);
  const healthPayload = await health.json();
  console.log("[smoke] health:", healthPayload.status);

  const loginDisabled = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "x@y.z", password: "invalid" })
  });
  if (loginDisabled.status !== 410) {
    throw new Error(`expected login 410, got ${loginDisabled.status}`);
  }
  console.log("[smoke] password login correctly disabled (410)");

  const home = await fetch(`${baseUrl}/`);
  await assertOk("home", home);

  const loginPage = await fetch(`${baseUrl}/login`);
  await assertOk("login page", loginPage);

  console.log("[smoke] OK — use Firebase OAuth for authenticated API tests");
}

run().catch((error) => {
  console.error("[smoke] FAILED", error.message);
  process.exit(1);
});
