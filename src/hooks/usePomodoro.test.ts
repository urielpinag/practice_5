import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Ajustes } from "../lib/storage";
import {
  etiquetaModo,
  formatearTiempo,
  minutosDeModo,
  usePomodoro,
} from "./usePomodoro";

const MINUTO = 60_000;

/** 1 minuto por fase y ciclo de 2 enfoques: las pruebas vuelan. */
const AJUSTES: Ajustes = {
  enfoque: 1,
  descansoCorto: 1,
  descansoLargo: 2,
  pomodorosAntesDescansoLargo: 2,
};

const avanzar = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  act(() => {
    vi.runOnlyPendingTimers();
  });
  vi.useRealTimers();
});

describe("helpers", () => {
  it("formatearTiempo redondea hacia arriba y nunca baja de cero", () => {
    expect(formatearTiempo(0)).toBe("00:00");
    expect(formatearTiempo(-10)).toBe("00:00");
    expect(formatearTiempo(1_000)).toBe("00:01");
    expect(formatearTiempo(59_400)).toBe("01:00");
    expect(formatearTiempo(MINUTO)).toBe("01:00");
    expect(formatearTiempo(25 * MINUTO)).toBe("25:00");
    expect(formatearTiempo(90 * MINUTO)).toBe("90:00");
  });

  it("minutosDeModo devuelve la duracion de cada modo", () => {
    expect(minutosDeModo("enfoque", AJUSTES)).toBe(1);
    expect(minutosDeModo("descanso-corto", AJUSTES)).toBe(1);
    expect(minutosDeModo("descanso-largo", AJUSTES)).toBe(2);
  });

  it("etiquetaModo traduce cada modo", () => {
    expect(etiquetaModo("enfoque")).toBe("Enfoque");
    expect(etiquetaModo("descanso-corto")).toBe("Descanso corto");
    expect(etiquetaModo("descanso-largo")).toBe("Descanso largo");
  });
});

describe("usePomodoro", () => {
  it("arranca en enfoque, en pausa y con el tiempo completo", () => {
    const { result } = renderHook(() => usePomodoro(AJUSTES));

    expect(result.current.modo).toBe("enfoque");
    expect(result.current.corriendo).toBe(false);
    expect(result.current.texto).toBe("01:00");
    expect(result.current.progreso).toBe(0);
    expect(result.current.ciclo).toBe(0);
    expect(result.current.tiempoCumplido).toBe(false);
  });

  it("corre y descuenta el tiempo al iniciar", () => {
    const { result } = renderHook(() => usePomodoro(AJUSTES));

    act(() => result.current.iniciar());
    expect(result.current.corriendo).toBe(true);

    avanzar(10_000);
    expect(result.current.texto).toBe("00:50");
    expect(result.current.progreso).toBeCloseTo(10 / 60, 2);
  });

  it("alternar enciende y apaga el reloj", () => {
    const { result } = renderHook(() => usePomodoro(AJUSTES));

    act(() => result.current.alternar());
    expect(result.current.corriendo).toBe(true);

    act(() => result.current.alternar());
    expect(result.current.corriendo).toBe(false);
  });

  it("pausar y reanudar conservan el tiempo restante", () => {
    const { result } = renderHook(() => usePomodoro(AJUSTES));

    act(() => result.current.iniciar());
    avanzar(20_000);
    expect(result.current.texto).toBe("00:40");

    act(() => result.current.pausar());
    expect(result.current.corriendo).toBe(false);

    avanzar(30_000); // en pausa el reloj no se mueve
    expect(result.current.texto).toBe("00:40");

    act(() => result.current.iniciar());
    avanzar(10_000);
    expect(result.current.texto).toBe("00:30");
  });

  it("reiniciar vuelve al principio del modo actual", () => {
    const { result } = renderHook(() => usePomodoro(AJUSTES));

    act(() => result.current.iniciar());
    avanzar(20_000);
    act(() => result.current.reiniciar());

    expect(result.current.corriendo).toBe(false);
    expect(result.current.texto).toBe("01:00");
    expect(result.current.progreso).toBe(0);
  });

  it("al terminar el enfoque avisa, cuenta el pomodoro y pasa a descanso corto", () => {
    const onPomodoroCompletado = vi.fn();
    const { result } = renderHook(() => usePomodoro(AJUSTES, { onPomodoroCompletado }));

    act(() => result.current.iniciar());
    avanzar(MINUTO + 1_000);

    expect(onPomodoroCompletado).toHaveBeenCalledTimes(1);
    expect(result.current.modo).toBe("descanso-corto");
    expect(result.current.corriendo).toBe(false);
    expect(result.current.texto).toBe("01:00");
    expect(result.current.tiempoCumplido).toBe(true);
    expect(result.current.ciclo).toBe(1);
  });

  it("limpia el aviso de tiempo cumplido pasados unos segundos", () => {
    const { result } = renderHook(() => usePomodoro(AJUSTES));

    act(() => result.current.iniciar());
    avanzar(MINUTO + 1_000);
    expect(result.current.tiempoCumplido).toBe(true);

    avanzar(6_000);
    expect(result.current.tiempoCumplido).toBe(false);
  });

  it("al completar el ciclo de enfoques pasa al descanso largo", () => {
    const cortos: Ajustes = { ...AJUSTES, pomodorosAntesDescansoLargo: 1 };
    const { result } = renderHook(() => usePomodoro(cortos));

    act(() => result.current.iniciar());
    avanzar(MINUTO + 1_000);

    expect(result.current.modo).toBe("descanso-largo");
    expect(result.current.texto).toBe("02:00");
  });

  it("al terminar el descanso vuelve al enfoque sin contar pomodoro", () => {
    const onPomodoroCompletado = vi.fn();
    const { result } = renderHook(() => usePomodoro(AJUSTES, { onPomodoroCompletado }));

    act(() => result.current.elegirModo("descanso-corto"));
    act(() => result.current.iniciar());
    avanzar(MINUTO + 1_000);

    expect(result.current.modo).toBe("enfoque");
    expect(result.current.texto).toBe("01:00");
    expect(onPomodoroCompletado).not.toHaveBeenCalled();
  });

  it("saltar cambia de modo sin contar el pomodoro", () => {
    const onPomodoroCompletado = vi.fn();
    const { result } = renderHook(() => usePomodoro(AJUSTES, { onPomodoroCompletado }));

    act(() => result.current.saltar());

    expect(result.current.modo).toBe("descanso-corto");
    expect(result.current.ciclo).toBe(1);
    expect(result.current.tiempoCumplido).toBe(false);
    expect(onPomodoroCompletado).not.toHaveBeenCalled();
  });

  it("saltar desde un descanso devuelve al enfoque", () => {
    const { result } = renderHook(() => usePomodoro(AJUSTES));

    act(() => result.current.elegirModo("descanso-largo"));
    act(() => result.current.saltar());

    expect(result.current.modo).toBe("enfoque");
    expect(result.current.ciclo).toBe(0);
  });

  it("elegirModo cambia de modo y detiene el reloj", () => {
    const { result } = renderHook(() => usePomodoro(AJUSTES));

    act(() => result.current.iniciar());
    act(() => result.current.elegirModo("descanso-largo"));

    expect(result.current.modo).toBe("descanso-largo");
    expect(result.current.corriendo).toBe(false);
    expect(result.current.texto).toBe("02:00");
  });

  it("ajusta el tiempo al cambiar la duracion si esta en pausa", () => {
    const { result, rerender } = renderHook(({ ajustes }) => usePomodoro(ajustes), {
      initialProps: { ajustes: AJUSTES },
    });

    rerender({ ajustes: { ...AJUSTES, enfoque: 3 } });
    expect(result.current.texto).toBe("03:00");
  });

  it("no reinicia el tiempo si cambian los ajustes mientras corre", () => {
    const { result, rerender } = renderHook(({ ajustes }) => usePomodoro(ajustes), {
      initialProps: { ajustes: AJUSTES },
    });

    act(() => result.current.iniciar());
    avanzar(20_000);
    rerender({ ajustes: { ...AJUSTES, enfoque: 50 } });

    expect(result.current.texto).toBe("00:40");
    expect(result.current.corriendo).toBe(true);
  });

  it("escribe el tiempo y el modo en el titulo de la pestana", () => {
    const { result } = renderHook(() => usePomodoro(AJUSTES));
    expect(document.title).toBe("01:00 · Enfoque — Pato Pomodoro");

    act(() => result.current.elegirModo("descanso-largo"));
    expect(document.title).toBe("02:00 · Descanso largo — Pato Pomodoro");
  });
});
