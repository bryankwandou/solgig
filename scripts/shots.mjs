/**
 * Full-page screenshots of every SolGig page, in both languages, at desktop and
 * phone width.
 *
 * Uses the DevTools protocol rather than Chrome's --screenshot flag on purpose.
 * The flag ties the image height to the window height, so a hero sized in svh
 * stretches to whatever height you guessed, which is not what a visitor sees.
 * Here the viewport stays realistic and captureBeyondViewport extends the image.
 *
 *   node scripts/shots.mjs [--site https://solgig.vercel.app] [--out docs/screenshots]
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import WebSocket from "ws";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);
const SITE = (args.site ?? "https://solgig.vercel.app").replace(/\/$/, "");
const OUT = args.out ?? "docs/screenshots";
const PORT = Number(args.port ?? 9333);

const EDGE =
  process.env.EDGE_PATH ??
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";

const VIEWS = {
  desktop: { width: 1440, height: 900, scale: 1, mobile: false },
  mobile: { width: 390, height: 844, scale: 2, mobile: true },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function findSlug() {
  const r = await fetch(`${SITE}/api/products`);
  const d = await r.json();
  const slug = d.items?.[0]?.slug;
  if (!slug) throw new Error("no products returned by /api/products");
  return slug;
}

/** A tiny CDP client: one websocket, promise per command id. */
function connect(wsUrl) {
  const ws = new WebSocket(wsUrl, { maxPayload: 256 * 1024 * 1024 });
  const pending = new Map();
  let id = 0;
  ws.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
  });
  const ready = new Promise((res, rej) => {
    ws.once("open", res);
    ws.once("error", rej);
  });
  return {
    ready,
    send: (method, params = {}) =>
      new Promise((resolve, reject) => {
        const n = ++id;
        pending.set(n, { resolve, reject });
        ws.send(JSON.stringify({ id: n, method, params }));
      }),
    close: () => ws.close(),
  };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const slug = await findSlug();

  const pages = {
    "01-landing": "/",
    "02-marketplace": "/marketplace",
    "03-product": `/marketplace/${slug}`,
    "04-services": "/services",
    "05-feed": "/feed",
    "06-orders": "/orders",
    "07-dashboard": "/dashboard",
    "08-new-listing": "/dashboard/new",
    "09-profile": "/u/mira",
    "10-animations": "/dev/animations",
  };

  const profile = join(process.env.TEMP ?? ".", `solgig-shots-${Date.now()}`);
  const edge = spawn(
    EDGE,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-prefers-reduced-motion",
      "--no-first-run",
      "--force-device-scale-factor=1",
      `--user-data-dir=${profile}`,
      `--remote-debugging-port=${PORT}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  let target;
  for (let i = 0; i < 40 && !target; i++) {
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
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });

  const rows = [];
  for (const [name, path] of Object.entries(pages)) {
    for (const lang of ["en", "id"]) {
      for (const [view, v] of Object.entries(VIEWS)) {
        const file = join(OUT, `${name}-${lang}-${view}.png`);
        await rm(file, { force: true });

        await cdp.send("Emulation.setDeviceMetricsOverride", {
          width: v.width,
          height: v.height,
          deviceScaleFactor: v.scale,
          mobile: v.mobile,
        });

        const sep = path.includes("?") ? "&" : "?";
        await cdp.send("Page.navigate", { url: `${SITE}${path}${sep}lang=${lang}` });
        await sleep(3500);

        // Walk the page once so anything keyed to the scroll position settles,
        // then return to the top before the capture.
        await cdp.send("Runtime.evaluate", {
          expression: `(async () => {
            const step = innerHeight * 0.8;
            for (let y = 0; y < document.body.scrollHeight; y += step) {
              scrollTo(0, y);
              await new Promise(r => setTimeout(r, 120));
            }
            scrollTo(0, 0);
            await new Promise(r => setTimeout(r, 600));
          })()`,
          awaitPromise: true,
        });

        const { data } = await cdp.send("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: true,
          fromSurface: true,
        });
        const buf = Buffer.from(data, "base64");
        await writeFile(file, buf);
        rows.push(`${name}-${lang}-${view}.png  ${buf.length}`);
        console.log(rows.at(-1));
      }
    }
  }

  cdp.close();
  edge.kill();
  console.log(`\n${rows.length} screenshots written to ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
