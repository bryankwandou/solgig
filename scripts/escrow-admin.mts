// Admin tasks for the on-chain escrow program. Runs on Node 24+ directly
// (type stripping), no build step.
//
//   node scripts/escrow-admin.mts show
//   node scripts/escrow-admin.mts init                 (upgrade authority only)
//   node scripts/escrow-admin.mts update --fee 250 --paused false
//   node scripts/escrow-admin.mts resolve <order-uuid> <seller-share-bps>
//
// Keypair: ESCROW_ADMIN_KEYPAIR (path to a JSON keypair file). Program,
// treasury, fee and RPC come from .env.local like the app itself.
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  configPda,
  decodeConfig,
  decodeOrder,
  escrowPda,
  initializeConfigIx,
  resolveIx,
  updateConfigIx,
} from "../src/lib/solana/program.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envFile = readFileSync(join(root, ".env.local"), "utf8");
const env = (k: string) =>
  process.env[k] ??
  envFile.split(/\r?\n/).find((l) => l.startsWith(k + "="))?.slice(k.length + 1).trim();

function need(k: string): string {
  const v = env(k);
  if (!v) throw new Error(`${k} is not set`);
  return v;
}

const connection = new Connection(env("NEXT_PUBLIC_SOLANA_RPC_URL") ?? "https://api.devnet.solana.com", "confirmed");
const programId = new PublicKey(need("NEXT_PUBLIC_ESCROW_PROGRAM_ID"));

function admin(): Keypair {
  const path = need("ESCROW_ADMIN_KEYPAIR");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path, "utf8"))));
}

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

async function config() {
  const acct = await connection.getAccountInfo(configPda(programId));
  return acct ? decodeConfig(acct.data) : null;
}

async function send(signer: Keypair, ...ixs: Parameters<Transaction["add"]>) {
  const sig = await sendAndConfirmTransaction(connection, new Transaction().add(...ixs), [signer]);
  console.log(`signature ${sig}`);
  console.log(`explorer  https://explorer.solana.com/tx/${sig}?cluster=devnet`);
}

const [cmd, ...args] = process.argv.slice(2);
switch (cmd) {
  case "show": {
    console.log("program", programId.toBase58());
    console.log("config ", configPda(programId).toBase58());
    console.log(await config());
    break;
  }
  case "init": {
    const kp = admin();
    await send(
      kp,
      initializeConfigIx(programId, kp.publicKey, {
        paused: false,
        feeBps: Number(env("NEXT_PUBLIC_PLATFORM_FEE_BPS") ?? 250),
        admin: kp.publicKey,
        treasury: new PublicKey(need("NEXT_PUBLIC_PLATFORM_TREASURY")),
      }),
    );
    console.log(await config());
    break;
  }
  case "update": {
    const kp = admin();
    const cur = await config();
    if (!cur) throw new Error("config not initialized");
    await send(
      kp,
      updateConfigIx(programId, kp.publicKey, {
        paused: (flag("paused") ?? String(cur.paused)) === "true",
        feeBps: Number(flag("fee") ?? cur.feeBps),
        admin: new PublicKey(flag("admin") ?? cur.admin),
        treasury: new PublicKey(flag("treasury") ?? cur.treasury),
      }),
    );
    console.log(await config());
    break;
  }
  case "resolve": {
    const [orderId, share] = args;
    const kp = admin();
    const cur = await config();
    const acct = await connection.getAccountInfo(escrowPda(programId, orderId));
    const esc = acct && decodeOrder(acct.data);
    if (!cur || !esc || esc.kind !== "escrow") throw new Error("no open escrow for that order");
    await send(
      kp,
      resolveIx(programId, {
        orderId,
        admin: kp.publicKey,
        buyer: new PublicKey(esc.buyer),
        seller: new PublicKey(esc.seller),
        treasury: new PublicKey(cur.treasury),
        sellerShareBps: Number(share),
      }),
    );
    break;
  }
  default:
    console.log("usage: node scripts/escrow-admin.mts show | init | update [--fee n] [--paused bool] [--treasury addr] [--admin addr] | resolve <order> <bps>");
    process.exit(cmd ? 1 : 0);
}
