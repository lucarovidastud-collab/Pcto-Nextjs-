import { chromium } from "playwright";

const captureId = process.argv[2];
if (!captureId) {
  console.error("Usage: node scripts/figma-capture-test.mjs <captureId>");
  process.exit(1);
}

const base = "http://localhost:3000/figma-boards/hifi/01-landing.html";
const endpoint = encodeURIComponent(`https://mcp.figma.com/mcp/capture/${captureId}/submit`);
const url = `${base}#figmacapture=${captureId}&figmaendpoint=${endpoint}&figmadelay=2000`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

console.log("Opening with Figma hash capture...");
await page.goto(url, { waitUntil: "load", timeout: 30_000 });

// Wait for capture script auto-run + upload
for (let i = 0; i < 20; i++) {
  await page.waitForTimeout(3000);
  const state = await page.evaluate(() => ({
    hasFigma: Boolean(window.figma),
    done: document.body?.dataset?.figmaCaptureDone === "true"
  }));
  console.log(`poll ${i + 1}:`, state);
  if (state.done) break;
}

await page.waitForTimeout(2000);
await browser.close();
console.log("Done — check Figma file and run MCP poll for captureId");
