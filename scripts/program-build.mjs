// Builds programs/solgig-escrow for SBF and reports the size and deploy rent.
// Usage: npm run program:build
import { spawnSync } from "node:child_process";
import { statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "programs", "solgig-escrow");
// build-std needs the nightly switch; the platform toolchain accepts it.
const res = spawnSync(
  "cargo build-sbf -- -Zbuild-std=core -Zbuild-std-features=panic_immediate_abort",
  { cwd: dir, stdio: "inherit", shell: true, env: { ...process.env, RUSTC_BOOTSTRAP: "1" } },
);
if (res.status !== 0) process.exit(res.status ?? 1);

const bytes = statSync(join(dir, "target", "deploy", "solgig_escrow.so")).size;
// ProgramData = 45-byte header + binary; rent = (size + 128) * 5080 lamports.
const rent = (bytes + 45 + 128) * 5080;
console.log(`solgig_escrow.so: ${bytes} bytes, deploy rent ${(rent / 1e9).toFixed(6)} SOL`);
