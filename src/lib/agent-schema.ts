// JSON Schema (draft 2020-12) for what the agent endpoints return, served at
// /api/agent/schema so an agent can validate responses before trusting them.

export const CATALOG_SCHEMA_VERSION = "1.0.0";

const amount = {
  type: "object",
  required: ["amount", "decimals"],
  properties: {
    amount: { type: "string", pattern: "^\\d+$", description: "Integer in the asset's smallest unit." },
    decimals: { type: "integer" },
  },
};

const receipt = {
  type: "object",
  required: ["type", "orderId", "asset", "amount", "buyer", "seller", "signature", "network"],
  properties: {
    type: { const: "solgig.receipt/v1" },
    orderId: { type: "string", format: "uuid" },
    orderNumber: { type: "string" },
    product: {
      type: "object",
      properties: { id: { type: ["string", "null"] }, slug: { type: ["string", "null"] }, title: { type: ["string", "null"] } },
    },
    asset: { enum: ["SOL", "USDC"] },
    mint: { type: ["string", "null"] },
    decimals: { type: "integer" },
    amount: { type: "string", pattern: "^\\d+$" },
    fee: { type: "string", pattern: "^\\d+$" },
    buyer: { type: "string", description: "Base58 wallet that signed the payment." },
    seller: { type: "string" },
    network: { type: "string" },
    signature: { type: "string", description: "Solana transaction signature; the proof of purchase." },
    explorer: { type: "string", format: "uri" },
    paidAt: { type: ["string", "null"], format: "date-time" },
    url: { type: "string" },
  },
};

export const AGENT_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "solgig/agent",
  version: CATALOG_SCHEMA_VERSION,
  $defs: {
    amount,
    receipt,
    product: {
      type: "object",
      required: ["id", "slug", "title", "price_lamports", "prices", "seller_wallet", "purchase"],
      properties: {
        id: { type: "string", format: "uuid" },
        slug: { type: "string" },
        title: { type: "string" },
        short_description: { type: ["string", "null"] },
        product_type: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        price_lamports: { type: "integer", minimum: 0 },
        prices: {
          type: "object",
          properties: {
            SOL: { $ref: "#/$defs/amount" },
            USDC: { oneOf: [{ $ref: "#/$defs/amount" }, { type: "null" }] },
          },
        },
        rating_average: { type: ["number", "null"] },
        rating_count: { type: "integer" },
        deliverable_file: { type: "boolean" },
        seller: { type: ["string", "null"] },
        seller_wallet: { type: "string" },
        purchase: {
          oneOf: [
            { type: "null" },
            {
              type: "object",
              required: ["protocol", "method", "url"],
              properties: { protocol: { const: "x402" }, method: { const: "GET" }, url: { type: "string" } },
            },
          ],
        },
      },
    },
    paymentRequirement: {
      type: "object",
      required: ["scheme", "network", "maxAmountRequired", "asset", "payTo", "resource", "extra"],
      properties: {
        scheme: { const: "exact" },
        network: { type: "string" },
        maxAmountRequired: { type: "string", pattern: "^\\d+$" },
        asset: { type: "string", description: "'SOL' or an SPL mint address." },
        payTo: { type: "string" },
        resource: { type: "string" },
        maxTimeoutSeconds: { type: "integer" },
        extra: {
          type: "object",
          required: ["symbol", "decimals", "challenge", "transfers"],
          properties: {
            symbol: { enum: ["SOL", "USDC"] },
            decimals: { type: "integer" },
            challenge: { type: "string" },
            feeBps: { type: "integer" },
            transfers: {
              type: "array",
              items: {
                type: "object",
                required: ["to", "amount"],
                properties: { to: { type: "string" }, amount: { type: "string" } },
              },
            },
            instructions: { type: "array" },
          },
        },
      },
    },
    paymentRequired: {
      type: "object",
      required: ["x402Version", "error", "accepts"],
      properties: {
        x402Version: { const: 1 },
        error: { type: "string" },
        accepts: { type: "array", items: { $ref: "#/$defs/paymentRequirement" } },
      },
    },
    paymentHeader: {
      description: "Decoded X-PAYMENT header (base64 JSON).",
      type: "object",
      required: ["x402Version", "scheme", "network", "payload"],
      properties: {
        x402Version: { const: 1 },
        scheme: { const: "exact" },
        network: { type: "string" },
        payload: {
          type: "object",
          required: ["asset", "signature", "challenge", "payer", "proof"],
          properties: {
            asset: { enum: ["SOL", "USDC"] },
            signature: { type: "string" },
            challenge: { type: "string" },
            payer: { type: "string" },
            proof: { type: "string", description: "base58 ed25519 signature by payer over the proof text." },
          },
        },
      },
    },
    purchaseResult: {
      type: "object",
      required: ["ok", "receipt", "delivery"],
      properties: {
        ok: { const: true },
        receipt: { $ref: "#/$defs/receipt" },
        delivery: { type: "object", properties: { fileUrl: { type: "string" } } },
      },
    },
  },
  type: "object",
  required: ["marketplace", "network", "products"],
  properties: {
    marketplace: { const: "SolGig" },
    schema_version: { type: "string" },
    network: { type: "string" },
    x402_network: { type: "string" },
    platform_fee_bps: { type: "integer" },
    accepted_assets: { type: "array" },
    products: { type: "array", items: { $ref: "#/$defs/product" } },
    services: { type: "array" },
  },
} as const;
