import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Configuración de las pruebas unitarias.
 *
 * Va aparte de `vite.config.ts` a propósito: allí está el plugin de Cloudflare,
 * que quiere construir el Worker, y aquí solo necesitamos el DOM y la cobertura.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "worker/**/*.test.ts"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}", "worker/**/*.ts"],
      exclude: ["src/main.tsx", "src/test/**", "src/**/*.test.{ts,tsx}"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
