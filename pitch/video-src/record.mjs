import { chromium } from "playwright";
import { renameSync, writeFileSync } from "node:fs";
const size = { width: 1920, height: 1080 };
const scenes = [
  { id: "s1", url: "file:///home/user/solgig/pitch/video-src/scenes.html#s1", dur: 7.5 },
  { id: "s2", url: "file:///home/user/solgig/pitch/video-src/scenes.html#s2", dur: 12.5 },
  { id: "s3", url: "http://localhost:3100/", dur: 13 },
  { id: "s4", url: "file:///home/user/solgig/pitch/video-src/scenes.html#s4", dur: 38.5 },
  { id: "s5", url: "file:///home/user/solgig/pitch/video-src/scenes.html#s5", dur: 15 },
  { id: "s6", url: "file:///home/user/solgig/pitch/video-src/scenes.html#s6", dur: 12 },
];
const only = process.argv[2];
const b = await chromium.launch();
const offsets = {};
for (const s of scenes) {
  if (only && s.id !== only) continue;
  const t0 = Date.now();
  const ctx = await b.newContext({ viewport: size, recordVideo: { dir: "rec", size } });
  const p = await ctx.newPage();
  await p.goto(s.url, { waitUntil: "load" });
  if (s.id === "s3") {
    await p.waitForTimeout(1500);
    await p.evaluate(() => {
      const c = document.createElement("div");
      c.textContent = "Every product answers HTTP 402 with a price in SOL or USDC.";
      Object.assign(c.style, { position: "fixed", left: "50%", bottom: "48px", transform: "translateX(-50%)", background: "rgba(16,20,27,.9)", color: "#EDEBE4", font: "600 34px 'Liberation Sans',Arial", padding: "18px 34px", borderRadius: "14px", zIndex: 99999 });
      document.body.appendChild(c);
    });
  }
  const start = (Date.now() - t0) / 1000;
  if (s.id === "s3") {
    await p.waitForTimeout(3500);
    const y = await p.evaluate(() => document.querySelector("#agents").getBoundingClientRect().top + scrollY - 40);
    const steps = 90;
    for (let i = 1; i <= steps; i++) {
      const k = i / steps, e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      await p.evaluate((v) => scrollTo(0, v), y * e);
      await p.waitForTimeout(25);
    }
    await p.waitForTimeout((s.dur - 3.5 - 2.3) * 1000);
  } else {
    await p.waitForTimeout(s.dur * 1000);
  }
  const v = p.video();
  await ctx.close();
  const path = await v.path();
  renameSync(path, `rec/${s.id}.webm`);
  offsets[s.id] = { start, dur: s.dur };
  console.log(s.id, start.toFixed(2));
}
writeFileSync(`rec/offsets${only ? "-" + only : ""}.json`, JSON.stringify(offsets));
await b.close();
