import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    // Route handlers import through the tsconfig "@/*" path; mirror it here so
    // tests can load them unchanged.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // Every test here is synchronous crypto or pure logic, so a slow run means
    // a busy machine, not a hung test. The stock 5s ceiling was reporting red
    // on a laptop that needed 90s just to import the suite.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
