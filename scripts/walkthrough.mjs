/**
 * Records a scripted walkthrough of SolGig to an MP4.
 *
 * Drives headless Edge over the DevTools protocol, collects screencast frames
 * with their timestamps, then hands them to ffmpeg as a concat list so each
 * frame is held for as long as it was actually on screen.
 *
 *   node scripts/walkthrough.mjs [--site http://localhost:3100] [--out docs/video/solgig-walkthrough.mp4]
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import WebSocket from "ws";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);
const SITE = (args.site ?? "https://solgig.vercel.app").replace(/\/$/, "");
const OUT = resolve(args.out ?? "docs/video/solgig-walkthrough.mp4");
const PORT = Number(args.port ?? 9334);
const EDGE =
  process.env.EDGE_PATH ??
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const W = 1280;
const H = 720;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl, { maxPayload: 256 * 1024 * 1024 });
  const pending = new Map();
  const listeners = new Map();
  let id = 0;
  ws.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.method) {
      listeners.get(msg.method)?.(msg.params);
      return;
    }
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
  });
  const ready = new Promise((res, rej) => {
    ws.once("open", res);
    ws.once("error", rej);
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const n = ++id;
      pending.set(n, { resolve, reject });
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  return { ready, send, on: (m, fn) => listeners.set(m, fn), close: () => ws.close() };
}

async function main() {
  const products = await (await fetch(`${SITE}/api/products`)).json();
  const slug = products.items?.[0]?.slug;
  if (!slug) throw new Error("no products returned by /api/products");

  const frameDir = join(dirname(OUT), "frames");
  await rm(frameDir, { recursive: true, force: true });
  await mkdir(frameDir, { recursive: true });

  const profile = join(process.env.TEMP ?? ".", `solgig-video-${Date.now()}`);
  const edge = spawn(
    EDGE,
    [
      "--headless=new",
      "--hide-scrollbars",
      "--no-first-run",
      `--window-size=${W},${H}`,
      `--user-data-dir=${profile}`,
      `--remote-debugging-port=${PORT}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  let target;
  for (let i = 0; i < 60 && !target; i++) {
    await sleep(500);
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      target = (await r.json()).find((t) => t.type === "page");
    } catch {
      /* browser still booting */
    }
  }
  if (!target) throw new Error("Edge never exposed a debugging target");

  const cdp = connect(target.webSocketDebuggerUrl);
  await cdp.ready;
  await cdp.send("Page.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: W,
    height: H,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const frames = [];
  const writes = [];
  cdp.on("Page.screencastFrame", (p) => {
    const file = join(frameDir, `f${String(frames.length).padStart(5, "0")}.jpg`);
    frames.push({ file, t: p.metadata.timestamp });
    writes.push(writeFile(file, Buffer.from(p.data, "base64")));
    cdp.send("Page.screencastFrameAck", { sessionId: p.sessionId }).catch(() => {});
  });

  const go = async (path, hold = 2500) => {
    await cdp.send("Page.navigate", { url: `${SITE}${path}` });
    await sleep(hold);
  };
  const scroll = (px, ms = 2600) =>
    cdp.send("Runtime.evaluate", {
      expression: `(async () => {
        const start = scrollY, steps = ${Math.round(ms / 16)};
        for (let i = 1; i <= steps; i++) {
          scrollTo(0, start + (${px}) * (i / steps));
          await new Promise(r => setTimeout(r, 16));
        }
      })()`,
      awaitPromise: true,
    });
  const toTop = () => cdp.send("Runtime.evaluate", { expression: "scrollTo(0,0)" });

  // Load the landing page once before recording so the first frame is not blank.
  await go("/?lang=en", 5000);
  await cdp.send("Page.startScreencast", {
    format: "jpeg",
    quality: 85,
    maxWidth: W,
    maxHeight: H,
    everyNthFrame: 1,
  });

  // Landing: hero, then the full story down the page.
  await sleep(3500);
  await scroll(1400, 5000);
  await sleep(1200);
  await scroll(2200, 6000);
  await sleep(1500);

  // Marketplace, then one product with its on-chain checkout panel.
  await go("/marketplace?lang=en", 3500);
  await scroll(700, 3000);
  await sleep(1000);
  await go(`/marketplace/${slug}?lang=en`, 4000);
  await scroll(600, 3000);
  await sleep(2000);

  // Services and the escrow-backed order flow.
  await go("/services?lang=en", 3500);
  await scroll(600, 2500);
  await go("/orders?lang=en", 3500);

  // Social feed and seller dashboard.
  await go("/feed?lang=en", 3500);
  await scroll(700, 3000);
  await go("/dashboard?lang=en", 3500);
  await go("/dashboard/new?lang=en", 3000);
  await go("/u/mira?lang=en", 3500);

  // The agent-facing catalog, which is what lets an AI agent shop on its own.
  await go("/api/products", 3000);

  // Same landing page in Indonesian to show the language switch.
  await go("/?lang=id", 4000);
  await scroll(900, 3000);
  await toTop();

  // Motion library showcase.
  await go("/dev/animations?lang=en", 3500);
  await scroll(1500, 5000);
  await sleep(1500);

  await cdp.send("Page.stopScreencast");
  await Promise.all(writes);
  cdp.close();
  edge.kill();

  if (frames.length < 10) throw new Error(`only ${frames.length} frames captured`);

  // ffmpeg concat list: each frame lasts until the next one arrived.
  const lines = ["ffconcat version 1.0"];
  frames.forEach((f, i) => {
    const next = frames[i + 1]?.t ?? f.t + 1.5;
    const d = Math.max(0.01, Math.min(next - f.t, 5));
    lines.push(`file '${f.file.replace(/\\/g, "/")}'`, `duration ${d.toFixed(3)}`);
  });
  lines.push(`file '${frames.at(-1).file.replace(/\\/g, "/")}'`);
  const list = join(frameDir, "list.txt");
  await writeFile(list, lines.join("\n"));

  const ff = spawnSync(
    "ffmpeg",
    [
      "-y", "-loglevel", "error",
      "-f", "concat", "-safe", "0", "-i", list,
      "-vf", `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p`,
      "-c:v", "libx264", "-crf", "18", "-preset", "medium",
      "-movflags", "+faststart",
      OUT,
    ],
    { stdio: "inherit" },
  );
  if (ff.status !== 0) throw new Error("ffmpeg failed");
  await rm(frameDir, { recursive: true, force: true });
  const secs = frames.at(-1).t - frames[0].t;
  console.log(`${frames.length} frames, ${secs.toFixed(1)}s -> ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
