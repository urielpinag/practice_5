/**
 * Tipos y acceso a `localStorage` para Pato Pomodoro.
 * Todo lo que la app necesita recordar vive aquí: ajustes y estadísticas.
 */

export type Modo = "enfoque" | "descanso-corto" | "descanso-largo";

export interface Ajustes {
  /** Minutos de enfoque. */
  enfoque: number;
  /** Minutos de descanso corto. */
  descansoCorto: number;
  /** Minutos de descanso largo. */
  descansoLargo: number;
  /** Cuántos enfoques antes de un descanso largo. */
  pomodorosAntesDescansoLargo: number;
}

export interface Stats {
  /** Día (YYYY-MM-DD) al que corresponden las estadísticas. */
  fecha: string;
  /** Pomodoros completados hoy. */
  pomodorosHoy: number;
  /** Días seguidos con al menos un pomodoro. */
  racha: number;
  /** Último día en que se completó un pomodoro. */
  ultimoDia: string | null;
}

export const AJUSTES_POR_DEFECTO: Ajustes = {
  enfoque: 25,
  descansoCorto: 5,
  descansoLargo: 15,
  pomodorosAntesDescansoLargo: 4,
};

export const MINUTOS_MIN = 1;
export const MINUTOS_MAX = 180;
export const CICLO_MIN = 1;
export const CICLO_MAX = 12;

const CLAVE_AJUSTES = "pato-pomodoro:ajustes";
const CLAVE_STATS = "pato-pomodoro:stats";

function limitar(valor: unknown, min: number, max: number, porDefecto: number): number {
  const n = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isFinite(n)) return porDefecto;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function cargarAjustes(): Ajustes {
  try {
    const crudo = localStorage.getItem(CLAVE_AJUSTES);
    if (!crudo) return AJUSTES_POR_DEFECTO;
    const guardado = JSON.parse(crudo) as Partial<Ajustes>;
    return {
      enfoque: limitar(guardado.enfoque, MINUTOS_MIN, MINUTOS_MAX, AJUSTES_POR_DEFECTO.enfoque),
      descansoCorto: limitar(
        guardado.descansoCorto,
        MINUTOS_MIN,
        MINUTOS_MAX,
        AJUSTES_POR_DEFECTO.descansoCorto,
      ),
      descansoLargo: limitar(
        guardado.descansoLargo,
        MINUTOS_MIN,
        MINUTOS_MAX,
        AJUSTES_POR_DEFECTO.descansoLargo,
      ),
      pomodorosAntesDescansoLargo: limitar(
        guardado.pomodorosAntesDescansoLargo,
        CICLO_MIN,
        CICLO_MAX,
        AJUSTES_POR_DEFECTO.pomodorosAntesDescansoLargo,
      ),
    };
  } catch {
    return AJUSTES_POR_DEFECTO;
  }
}

export function guardarAjustes(ajustes: Ajustes): void {
  try {
    localStorage.setItem(CLAVE_AJUSTES, JSON.stringify(ajustes));
  } catch {
    // Si el navegador bloquea localStorage seguimos funcionando en memoria.
  }
}

export function hoyISO(fecha: Date = new Date()): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function ayerISO(): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - 1);
  return hoyISO(fecha);
}

export function cargarStats(): Stats {
  const vacias: Stats = { fecha: hoyISO(), pomodorosHoy: 0, racha: 0, ultimoDia: null };
  try {
    const crudo = localStorage.getItem(CLAVE_STATS);
    if (!crudo) return vacias;
    const guardado = JSON.parse(crudo) as Partial<Stats>;
    const stats: Stats = {
      fecha: typeof guardado.fecha === "string" ? guardado.fecha : vacias.fecha,
      pomodorosHoy: limitar(guardado.pomodorosHoy, 0, 999, 0),
      racha: limitar(guardado.racha, 0, 9999, 0),
      ultimoDia: typeof guardado.ultimoDia === "string" ? guardado.ultimoDia : null,
    };
    // Si cambió el día, arrancamos el contador diario de cero.
    if (stats.fecha !== vacias.fecha) {
      stats.fecha = vacias.fecha;
      stats.pomodorosHoy = 0;
    }
    return stats;
  } catch {
    return vacias;
  }
}

/** Suma un pomodoro completado y actualiza la racha de días. */
export function registrarPomodoro(previas: Stats): Stats {
  const hoy = hoyISO();
  const base: Stats =
    previas.fecha === hoy ? previas : { ...previas, fecha: hoy, pomodorosHoy: 0 };

  let racha: number;
  if (base.ultimoDia === hoy) {
    racha = Math.max(1, base.racha);
  } else if (base.ultimoDia === ayerISO()) {
    racha = base.racha + 1;
  } else {
    racha = 1;
  }

  const nuevas: Stats = {
    fecha: hoy,
    pomodorosHoy: base.pomodorosHoy + 1,
    racha,
    ultimoDia: hoy,
  };
  try {
    localStorage.setItem(CLAVE_STATS, JSON.stringify(nuevas));
  } catch {
    // ignoramos errores de almacenamiento
  }
  return nuevas;
}

export function reiniciarStats(): Stats {
  const vacias: Stats = { fecha: hoyISO(), pomodorosHoy: 0, racha: 0, ultimoDia: null };
  try {
    localStorage.setItem(CLAVE_STATS, JSON.stringify(vacias));
  } catch {
    // ignoramos errores de almacenamiento
  }
  return vacias;
}
