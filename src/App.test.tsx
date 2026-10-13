import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { hoyISO } from "./lib/storage";

const FRASE = "¡Cuac! Prueba";

const respuestaJson = (datos: unknown) => ({
  ok: true,
  json: async () => datos,
});

/** Renderiza la app y espera a que llegue la frase del Worker. */
const montar = async () => {
  const vista = render(<App />);
  await screen.findByText(FRASE);
  return vista;
};

const valoresStats = () =>
  Array.from(document.querySelectorAll(".stat__valor")).map((nodo) => nodo.textContent);

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => respuestaJson({ frase: FRASE })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("muestra el reloj, el patito y el ciclo por defecto", async () => {
    await montar();

    expect(screen.getByRole("heading", { name: /pato pomodoro/i })).toBeInTheDocument();
    expect(screen.getByText("25:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^iniciar el tiempo$/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /esperando/i })).toBeInTheDocument();
    expect(document.querySelectorAll(".punto")).toHaveLength(4);
    expect(screen.getByText("0 de 4 enfoques")).toBeInTheDocument();
  });

  it("pide la frase a la API del Worker", async () => {
    await montar();

    expect(fetch).toHaveBeenCalledWith("/api/");
    expect(screen.getByText(FRASE)).toBeInTheDocument();
  });

  it("usa una frase de reserva si la API falla", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("sin red");
      }),
    );

    render(<App />);

    expect(await screen.findByText(/a darle con todo/i)).toBeInTheDocument();
  });

  it("arranca y pausa con el botón principal", async () => {
    await montar();

    fireEvent.click(screen.getByRole("button", { name: /^iniciar el tiempo$/i }));
    expect(screen.getByRole("button", { name: /^pausar el tiempo$/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /trabajando/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^pausar el tiempo$/i }));
    expect(screen.getByRole("button", { name: /^iniciar el tiempo$/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /esperando/i })).toBeInTheDocument();
  });

  it("arranca con la barra espaciadora y reinicia con la R", async () => {
    await montar();

    fireEvent.keyDown(window, { code: "Space" });
    expect(screen.getByRole("button", { name: /^pausar el tiempo$/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "r" });
    expect(screen.getByRole("button", { name: /^iniciar el tiempo$/i })).toBeInTheDocument();
    expect(screen.getByText("25:00")).toBeInTheDocument();
  });

  it("ignora los atajos mientras se escribe en un campo", async () => {
    await montar();

    fireEvent.keyDown(screen.getByLabelText("Enfoque"), { code: "Space" });
    expect(screen.getByRole("button", { name: /^iniciar el tiempo$/i })).toBeInTheDocument();
  });

  it("cambia de modo con las pestañas", async () => {
    await montar();

    fireEvent.click(screen.getByRole("tab", { name: "Descanso corto" }));
    expect(screen.getByText("05:00")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Descanso largo" }));
    expect(screen.getByText("15:00")).toBeInTheDocument();
    expect(screen.getByText("¡Merecido descanso largo!")).toBeInTheDocument();
  });

  it("salta al siguiente modo con el botón", async () => {
    await montar();

    fireEvent.click(screen.getByRole("button", { name: /^saltar al siguiente modo$/i }));

    expect(screen.getByRole("tab", { name: "Descanso corto" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("1 de 4 enfoques")).toBeInTheDocument();
  });

  it("guarda los ajustes en localStorage al arrancar", async () => {
    await montar();

    expect(JSON.parse(localStorage.getItem("pato-pomodoro:ajustes")!)).toEqual({
      enfoque: 25,
      descansoCorto: 5,
      descansoLargo: 15,
      pomodorosAntesDescansoLargo: 4,
    });
  });

  it("sanea los ajustes guardados que están fuera de rango", async () => {
    // El saneo de storage debe devolvernos al mínimo de 1 minuto.
    localStorage.setItem("pato-pomodoro:ajustes", JSON.stringify({ enfoque: 0 }));
    await montar();

    expect(screen.getByText("01:00")).toBeInTheDocument();
  });

  it("actualiza el reloj al cambiar la duración desde el panel", async () => {
    await montar();

    fireEvent.click(screen.getByRole("button", { name: /^abrir ajustes$/i }));
    const input = screen.getByLabelText("Enfoque");
    fireEvent.change(input, { target: { value: "40" } });
    fireEvent.blur(input);

    expect(screen.getByText("40:00")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("pato-pomodoro:ajustes")!).enfoque).toBe(40);
  });

  it("muestra las estadísticas guardadas", async () => {
    localStorage.setItem(
      "pato-pomodoro:stats",
      JSON.stringify({
        fecha: hoyISO(),
        pomodorosHoy: 3,
        racha: 2,
        ultimoDia: hoyISO(),
      }),
    );

    await montar();

    expect(valoresStats()).toEqual(["3", "2"]);
    expect(screen.getByText("pomodoros hoy")).toBeInTheDocument();
    expect(screen.getByText("días de racha")).toBeInTheDocument();
  });

  it("reinicia el contador de estadísticas", async () => {
    await montar();

    fireEvent.click(screen.getByRole("button", { name: /^reiniciar contador$/i }));

    expect(valoresStats()).toEqual(["0", "0"]);
    expect(JSON.parse(localStorage.getItem("pato-pomodoro:stats")!).pomodorosHoy).toBe(0);
  });
});
