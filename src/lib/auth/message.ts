/** Pure SIWS message builder, safe to import on the client (no crypto deps). */
export const SIWS_DOMAIN = "solgig.xyz";

export function buildSiwsMessage(params: {
  domain: string;
  address: string;
  nonce: string;
  issuedAt: string;
}) {
  return [
    `${params.domain} wants you to sign in with your Solana account:`,
    params.address,
    "",
    "Signing proves the wallet is yours. It costs nothing and moves no funds.",
    "",
    `Nonce: ${params.nonce}`,
    `Issued At: ${params.issuedAt}`,
  ].join("\n");
}
