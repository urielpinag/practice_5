import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Sin `globals: true` Testing Library no limpia sola, así que lo hacemos aquí.
// Algunas pruebas (el Worker) corren en entorno `node`, sin DOM ni localStorage.
afterEach(() => {
  if (typeof document !== "undefined") cleanup();
  if (typeof localStorage !== "undefined") localStorage.clear();
});
