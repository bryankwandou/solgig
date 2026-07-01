import nacl from "tweetnacl";
import bs58 from "bs58";
import { PublicKey } from "@solana/web3.js";

export { buildSiwsMessage, SIWS_DOMAIN } from "./message";

/** Verify a base58 signature over the message for the given address. */
export function verifySiwsSignature(
  message: string,
  signatureBase58: string,
  address: string,
): boolean {
  try {
    const msg = new TextEncoder().encode(message);
    const sig = bs58.decode(signatureBase58);
    const pubkey = new PublicKey(address).toBytes();
    return nacl.sign.detached.verify(msg, sig, pubkey);
  } catch {
    return false;
  }
}

export function randomNonce(): string {
  const bytes = nacl.randomBytes(16);
  return bs58.encode(bytes);
}
