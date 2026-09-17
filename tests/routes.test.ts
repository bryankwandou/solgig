// Route-level tests. The handlers, session signing and current-user lookup are
// the real code; only Postgres and the cookie jar are replaced, so these check
// what each route does with auth, ids and repeated requests.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

process.env.DATABASE_URL ??= "postgres://u:p@localhost/solgig_test";
process.env.SESSION_SECRET ??= "test-secret-test-secret-test-secret";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const POST_ID = "22222222-2222-4222-8222-222222222222";
const ORDER_ID = "33333333-3333-4333-8333-333333333333";

type Call = { text: string; values: unknown[] };
const calls: Call[] = [];
let respond: (c: Call) => unknown[] = () => [];
let dbVersion = 0;

vi.mock("@/lib/db", () => {
  const sql = (strings: TemplateStringsArray, ...values: unknown[]) => {
    const call = { text: strings.join("?"), values };
    calls.push(call);
    return Promise.resolve(respond(call));
  };
  sql.transaction = (queries: Promise<unknown>[]) => Promise.all(queries);
  return { sql };
});

const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (k: string) => (jar.has(k) ? { value: jar.get(k) } : undefined),
    set: (k: string, v: string) => void jar.set(k, v),
    delete: (k: string) => void jar.delete(k),
  }),
}));

const { createSession } = await import("@/lib/auth/session");
const like = await import("@/app/api/posts/[id]/like/route");
const download = await import("@/app/api/orders/[id]/download/route");
const complete = await import("@/app/api/orders/[id]/complete/route");
const logout = await import("@/app/api/auth/logout/route");

/** Answers the current-user lookup the way Postgres would. */
function users(c: Call): unknown[] | null {
  if (c.text.includes("FROM users") && c.text.includes("session_version =")) {
    return c.values[1] === dbVersion
      ? [{ id: USER_ID, wallet_address: "W", username: "u", display_name: null, avatar_url: null }]
      : [];
  }
  if (c.text.includes("SET session_version = session_version + 1")) {
    if (c.values[1] === dbVersion) dbVersion++;
    return [];
  }
  return null;
}

const req = (body?: unknown, ip = `10.0.0.${Math.floor(Math.random() * 250)}`) =>
  new NextRequest("http://localhost/api/x", {
    method: "POST",
    headers: { "x-forwarded-for": ip, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const ctx = <K extends string>(key: K, value: string) => ({
  params: Promise.resolve({ [key]: value } as Record<K, string>),
});
const signIn = () => createSession({ userId: USER_ID, wallet: "W", sv: dbVersion });

beforeEach(() => {
  calls.length = 0;
  jar.clear();
  dbVersion = 0;
  respond = (c) => users(c) ?? [];
});

describe("auth", () => {
  it("rejects a like without a session", async () => {
    const res = await like.POST(req({ liked: true }), ctx("id", POST_ID));
    expect(res.status).toBe(401);
  });

  it("rejects a download without a session", async () => {
    const res = await download.GET(req(), ctx("id", ORDER_ID));
    expect(res.status).toBe(401);
  });

  it("stops honouring a token after logout, even a copied one", async () => {
    await signIn();
    const stolen = jar.get("solgig_session")!;

    const out = await logout.POST();
    expect(out.status).toBe(200);
    expect(dbVersion).toBe(1);
    expect(jar.has("solgig_session")).toBe(false);

    jar.set("solgig_session", stolen);
    const res = await download.GET(req(), ctx("id", ORDER_ID));
    expect(res.status).toBe(401);
  });
});

describe("id validation", () => {
  it("answers 404 for a malformed id without touching the database", async () => {
    await signIn();
    for (const bad of ["1", "not-a-uuid", "' OR 1=1 --", `${POST_ID}x`]) {
      calls.length = 0;
      const res = await like.POST(req({ liked: true }), ctx("id", bad));
      expect(res.status).toBe(404);
      expect(calls.some((c) => c.text.includes("post_likes"))).toBe(false);
    }
  });

  it("answers 404 on complete for a malformed order id", async () => {
    await signIn();
    const res = await complete.POST(req(), ctx("id", "123"));
    expect(res.status).toBe(404);
  });
});

describe("download", () => {
  it("refuses an order the caller did not buy", async () => {
    await signIn();
    // The ownership filter lives in SQL; someone else's order returns no row.
    respond = (c) => users(c) ?? [];
    const res = await download.GET(req(), ctx("id", ORDER_ID));
    expect(res.status).toBe(404);
    const q = calls.find((c) => c.text.includes("file_url"))!;
    expect(q.text).toContain("o.buyer_id =");
    expect(q.text).toContain("o.status = 'completed'");
    expect(q.values).toEqual([ORDER_ID, USER_ID]);
  });

  it("hands the file to the buyer", async () => {
    await signIn();
    respond = (c) =>
      users(c) ?? (c.text.includes("file_url") ? [{ file_url: "https://x/f.zip" }] : []);
    const res = await download.GET(req(), ctx("id", ORDER_ID));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ fileUrl: "https://x/f.zip" });
  });
});

describe("like", () => {
  it("is idempotent when the same like arrives twice", async () => {
    await signIn();
    respond = (c) =>
      users(c) ?? (c.text.includes("RETURNING likes_count") ? [{ likes_count: 1 }] : []);

    const a = await like.POST(req({ liked: true }), ctx("id", POST_ID));
    const b = await like.POST(req({ liked: true }), ctx("id", POST_ID));
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(await b.json()).toEqual({ liked: true, likes: 1 });

    const inserts = calls.filter((c) => c.text.includes("INSERT INTO post_likes"));
    expect(inserts).toHaveLength(2);
    for (const i of inserts) expect(i.text).toContain("ON CONFLICT (post_id, user_id) DO NOTHING");
    // The count is recomputed from rows, never incremented.
    const counts = calls.filter((c) => c.text.includes("SET likes_count"));
    for (const c of counts) expect(c.text).toContain("COUNT(*)");
  });

  it("answers 404 for a post that does not exist", async () => {
    await signIn();
    const res = await like.POST(req({ liked: true }), ctx("id", POST_ID));
    expect(res.status).toBe(404);
  });
});
