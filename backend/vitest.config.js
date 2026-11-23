import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Tests connect to a real MongoDB via mongodb-memory-server, so no jsdom.
    include: ["tests/**/*.test.js"],
    globalSetup: "./tests/globalSetup.js",
    pool: "forks",
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});