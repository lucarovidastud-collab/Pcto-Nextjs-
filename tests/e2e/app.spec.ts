import { expect, test } from "@playwright/test";

test("health endpoint risponde ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.status).toBe("ok");
});

test("pagine legali sono raggiungibili", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Termini di Servizio" })).toBeVisible();
});

test("home mostra login social", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Continua con Google")).toBeVisible();
});
