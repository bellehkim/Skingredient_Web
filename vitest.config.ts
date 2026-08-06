import { defineConfig } from "vitest/config";
import tsConfigPaths from "vite-tsconfig-paths";

// Deliberately separate from vite.config.ts: that one pulls in TanStack Start's
// SSR/Nitro plugins, which aren't relevant (and add friction) for plain unit tests.
export default defineConfig({
  plugins: [tsConfigPaths()],
  test: {
    environment: "node",
  },
});
