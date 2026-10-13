import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AJUSTES_POR_DEFECTO,
  cargarAjustes,
  cargarStats,
  guardarAjustes,
  hoyISO,
  registrarPomodoro,
  reiniciarStats,
} from "./storage";

const CLAVE_AJUSTES = "pato-pomodoro:ajustes";
const CLAVE_STATS = "pato-pomodoro:stats";

/** Fija la fecha del sistema para que `new Date()` sea predecible. */
const conFecha = (anio: number, mes: number, dia: number) => {
  vi.useFakeTimers({ now: new Date(anio, mes - 1, dia, 12, 0, 0) });
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("hoyISO", () => {
  it("devuelve la fecha en formato YYYY-MM-DD con ceros a la izquierda", () => {
    conFecha(2026, 1, 5);
    expect(hoyISO()).toBe("2026-01-05");
  });
});

describe("cargarAjustes", () => {
  it("devuelve los valores por defecto si no hay nada guardado", () => {
    expect(cargarAjustes()).toEqual(AJUSTES_POR_DEFECTO);
  });

  it("guarda y vuelve a leer los ajustes", () => {
    guardarAjustes({
      enfoque: 40,
      descansoCorto: 8,
      descansoLargo: 20,
      pomodorosAntesDescansoLargo: 3,
    });

    expect(cargarAjustes()).toEqual({
      enfoque: 40,
      descansoCorto: 8,
      descansoLargo: 20,
      pomodorosAntesDescansoLargo: 3,
    });
  });

  it("acota los valores que se salen de rango", () => {
    localStorage.setItem(
      CLAVE_AJUSTES,
      JSON.stringify({
        enfoque: 0,
        descansoCorto: 999,
        descansoLargo: -4,
        pomodorosAntesDescansoLargo: 99,
      }),
    );

    const ajustes = cargarAjustes();
    expect(ajustes.enfoque).toBe(1);
    expect(ajustes.descansoCorto).toBe(180);
    expect(ajustes.descansoLargo).toBe(1);
    expect(ajustes.pomodorosAntesDescansoLargo).toBe(12);
  });

  it("usa los valores por defecto ante datos que no son numeros", () => {
    localStorage.setItem(
      CLAVE_AJUSTES,
      JSON.stringify({ enfoque: "muchos", descansoCorto: null }),
    );

    const ajustes = cargarAjustes();
    expect(ajustes.enfoque).toBe(AJUSTES_POR_DEFECTO.enfoque);
    expect(ajustes.descansoCorto).toBe(AJUSTES_POR_DEFECTO.descansoCorto);
  });

  it("redondea los decimales", () => {
    localStorage.setItem(CLAVE_AJUSTES, JSON.stringify({ enfoque: 24.6 }));
    expect(cargarAjustes().enfoque).toBe(25);
  });

  it("vuelve a los valores por defecto si el JSON esta roto", () => {
    localStorage.setItem(CLAVE_AJUSTES, "{ esto no es json ");
    expect(cargarAjustes()).toEqual(AJUSTES_POR_DEFECTO);
  });
});

describe("cargarStats", () => {
  it("empieza en cero el primer dia", () => {
    conFecha(2026, 3, 1);
    expect(cargarStats()).toEqual({
      fecha: "2026-03-01",
      pomodorosHoy: 0,
      racha: 0,
      ultimoDia: null,
    });
  });

  it("reinicia el contador del dia cuando cambia la fecha", () => {
    localStorage.setItem(
      CLAVE_STATS,
      JSON.stringify({
        fecha: "2026-02-28",
        pomodorosHoy: 7,
        racha: 3,
        ultimoDia: "2026-02-28",
      }),
    );
    conFecha(2026, 3, 1);

    const stats = cargarStats();
    expect(stats.fecha).toBe("2026-03-01");
    expect(stats.pomodorosHoy).toBe(0);
    expect(stats.racha).toBe(3);
  });

  it("conserva las estadisticas del mismo dia", () => {
    conFecha(2026, 3, 1);
    localStorage.setItem(
      CLAVE_STATS,
      JSON.stringify({
        fecha: "2026-03-01",
        pomodorosHoy: 2,
        racha: 5,
        ultimoDia: "2026-03-01",
      }),
    );

    expect(cargarStats().pomodorosHoy).toBe(2);
  });

  it("vuelve a cero si el JSON esta roto", () => {
    localStorage.setItem(CLAVE_STATS, "no-json");
    expect(cargarStats().pomodorosHoy).toBe(0);
  });
});

describe("registrarPomodoro", () => {
  it("el primer pomodoro de la vida arranca la racha en 1", () => {
    conFecha(2026, 5, 10);

    const stats = registrarPomodoro(cargarStats());
    expect(stats.pomodorosHoy).toBe(1);
    expect(stats.racha).toBe(1);
    expect(stats.ultimoDia).toBe("2026-05-10");
    expect(JSON.parse(localStorage.getItem(CLAVE_STATS)!)).toEqual(stats);
  });

  it("suma varios pomodoros el mismo dia sin subir la racha", () => {
    conFecha(2026, 5, 10);

    let stats = registrarPomodoro(cargarStats());
    stats = registrarPomodoro(stats);
    stats = registrarPomodoro(stats);

    expect(stats.pomodorosHoy).toBe(3);
    expect(stats.racha).toBe(1);
  });

  it("sube la racha si el ultimo dia fue ayer", () => {
    conFecha(2026, 5, 10);
    let stats = registrarPomodoro(cargarStats());

    vi.setSystemTime(new Date(2026, 4, 11, 9, 0, 0));
    stats = registrarPomodoro(stats);

    expect(stats.pomodorosHoy).toBe(1);
    expect(stats.racha).toBe(2);
  });

  it("reinicia la racha si se salto un dia", () => {
    conFecha(2026, 5, 10);
    let stats = registrarPomodoro(cargarStats());

    vi.setSystemTime(new Date(2026, 4, 13, 9, 0, 0));
    stats = registrarPomodoro(stats);

    expect(stats.racha).toBe(1);
  });

  it("rescata la racha si el ultimo dia registrado es hoy", () => {
    conFecha(2026, 5, 10);
    const stats = registrarPomodoro(cargarStats());

    // Estado incompleto a proposito: racha en 0 pero con pomodoro de hoy.
    const raro = { ...stats, racha: 0 };
    expect(registrarPomodoro(raro).racha).toBe(1);
  });
});

describe("reiniciarStats", () => {
  it("deja todo a cero", () => {
    conFecha(2026, 7, 20);
    registrarPomodoro(cargarStats());

    expect(reiniciarStats()).toEqual({
      fecha: "2026-07-20",
      pomodorosHoy: 0,
      racha: 0,
      ultimoDia: null,
    });
    expect(JSON.parse(localStorage.getItem(CLAVE_STATS)!).pomodorosHoy).toBe(0);
  });
});
