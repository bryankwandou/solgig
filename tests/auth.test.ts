import { describe, it, expect } from "vitest";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";
import { verifySiwsSignature, randomNonce } from "../src/lib/auth/siws";
import { buildSiwsMessage } from "../src/lib/auth/message";

describe("SIWS sign-in", () => {
  const keypair = Keypair.generate();
  const address = keypair.publicKey.toBase58();
  const message = buildSiwsMessage({
    domain: "solgig.xyz",
    address,
    nonce: randomNonce(),
    issuedAt: new Date().toISOString(),
  });

  function sign(msg: string) {
    const sig = nacl.sign.detached(
      new TextEncoder().encode(msg),
      keypair.secretKey,
    );
    return bs58.encode(sig);
  }

  it("accepts a valid signature from the right wallet", () => {
    expect(verifySiwsSignature(message, sign(message), address)).toBe(true);
  });

  it("rejects a signature from a different wallet", () => {
    const other = Keypair.generate().publicKey.toBase58();
    expect(verifySiwsSignature(message, sign(message), other)).toBe(false);
  });

  it("rejects a tampered message", () => {
    expect(verifySiwsSignature(message + "x", sign(message), address)).toBe(false);
  });

  it("rejects garbage input without throwing", () => {
    expect(verifySiwsSignature(message, "not-base58!!!", address)).toBe(false);
    expect(verifySiwsSignature(message, sign(message), "not-an-address")).toBe(false);
  });

  it("binds the nonce into the message", () => {
    const nonce = randomNonce();
    const msg = buildSiwsMessage({
      domain: "solgig.xyz",
      address,
      nonce,
      issuedAt: new Date().toISOString(),
    });
    expect(msg).toContain(`Nonce: ${nonce}`);
    expect(msg).toContain(address);
  });

  it("generates unique nonces", () => {
    const seen = new Set(Array.from({ length: 100 }, () => randomNonce()));
    expect(seen.size).toBe(100);
  });
});
