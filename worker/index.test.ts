// @vitest-environment node
import { describe, expect, it } from "vitest";
import worker from "./index";

/**
 * El Worker solo mira la petición, así que lo llamamos con el argumento que
 * declara su handler (`env` y `ctx` no se usan aquí).
 */
const llamar = (ruta: string) =>
  worker.fetch(new Request(`https://pato-pomodoro.test${ruta}`));

describe("worker", () => {
  it("responde en /api/ con una frase en JSON", async () => {
    const respuesta = await llamar("/api/");

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get("content-type")).toContain("application/json");

    const datos = (await respuesta.json()) as { frase: string };
    expect(typeof datos.frase).toBe("string");
    expect(datos.frase.length).toBeGreaterThan(0);
  });

  it("responde tambien en subrutas de /api/", async () => {
    expect((await llamar("/api/saludo")).status).toBe(200);
  });

  it("varia la frase entre llamadas", async () => {
    const frases = new Set<string>();
    for (let i = 0; i < 60; i += 1) {
      const datos = (await (await llamar("/api/")).json()) as { frase: string };
      frases.add(datos.frase);
    }
    expect(frases.size).toBeGreaterThan(1);
  });

  it("devuelve 404 en las rutas que no son de la API", async () => {
    // Los assets estáticos (el SPA) no pasan por aquí, por eso el 404.
    expect((await llamar("/cualquier-cosa")).status).toBe(404);
    expect((await llamar("/api")).status).toBe(404);
  });
});
