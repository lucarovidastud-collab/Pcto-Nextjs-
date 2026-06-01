/**
 * Runs Figma html-to-design capture for all boards in manifest.
 * Requires figma-captures.json with { captures: [{ captureId, path, title }] }
 * generated via Figma MCP generate_figma_design (existingFile).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CAPTURE_JS = "https://mcp.figma.com/mcp/html-to-design/capture.js";
const BASE_URL = process.env.FIGMA_CAPTURE_BASE_URL || "http://localhost:3000";
const MANIFEST = join(ROOT, "public", "figma-boards", "manifest.json");
const CAPTURES_FILE = join(ROOT, "figma-captures.json");

function endpoint(captureId) {
  return `https://mcp.figma.com/mcp/capture/${captureId}/submit`;
}

async function captureOne(page, { captureId, path, title }) {
  const url = `${BASE_URL}${path}`;
  console.log(`→ ${title}: ${url}`);
  await page.goto(url, { waitUntil: "load", timeout: 45_000 });
  await page.waitForTimeout(600);
  const script = await page.context().request.get(CAPTURE_JS);
  if (!script.ok()) throw new Error(`Failed to load capture.js: ${script.status()}`);
  await page.evaluate((source) => {
    const el = document.createElement("script");
    el.textContent = source;
    document.head.appendChild(el);
  }, await script.text());
  await page.waitForTimeout(2000);
  const result = await page.evaluate(
    async ({ captureId, endpoint }) => {
      if (!window.figma?.captureForDesign) {
        return { ok: false, error: "figma.captureForDesign missing" };
      }
      const out = await window.figma.captureForDesign({
        captureId,
        endpoint,
        selector: "body"
      });
      return out ?? { ok: true };
    },
    { captureId, endpoint: endpoint(captureId) }
  );
  console.log(`  ✓ submit:`, JSON.stringify(result).slice(0, 160));
  return result;
}

async function main() {
  if (!existsSync(CAPTURES_FILE)) {
    console.error("Missing figma-captures.json — run MCP registration first.");
    process.exit(1);
  }
  const { captures } = JSON.parse(readFileSync(CAPTURES_FILE, "utf8"));
  const only = process.env.FIGMA_CAPTURE_ONLY;
  const list = only ? captures.filter((c) => c.title.includes(only) || c.path.includes(only)) : captures;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/*", async (route) => {
    const response = await route.fetch();
    const headers = { ...response.headers() };
    delete headers["content-security-policy"];
    delete headers["content-security-policy-report-only"];
    await route.fulfill({ response, headers });
  });
  const results = [];

  for (const item of list) {
    try {
      const r = await captureOne(page, item);
      results.push({ ...item, result: r, ok: true });
      await page.waitForTimeout(2000);
    } catch (e) {
      console.error(`  ✗ ${item.title}:`, e.message);
      results.push({ ...item, ok: false, error: e.message });
    }
  }

  await browser.close();
  writeFileSync(join(ROOT, "figma-capture-results.json"), JSON.stringify(results, null, 2));
  console.log(`Done. ${results.filter((r) => r.ok).length}/${results.length} submitted.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
