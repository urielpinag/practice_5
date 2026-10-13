import { useCallback, useEffect, useRef, useState } from "react";
import type { Ajustes, Modo } from "../lib/storage";

/** Minutos configurados para un modo. */
export function minutosDeModo(modo: Modo, ajustes: Ajustes): number {
  if (modo === "enfoque") return ajustes.enfoque;
  if (modo === "descanso-corto") return ajustes.descansoCorto;
  return ajustes.descansoLargo;
}

export function etiquetaModo(modo: Modo): string {
  if (modo === "enfoque") return "Enfoque";
  if (modo === "descanso-corto") return "Descanso corto";
  return "Descanso largo";
}

/** Convierte milisegundos a "MM:SS". */
export function formatearTiempo(ms: number): string {
  const totalSegundos = Math.max(0, Math.ceil(ms / 1000));
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

interface Opciones {
  /** Se llama cada vez que termina (o se salta) un enfoque. */
  onPomodoroCompletado?: () => void;
}

/**
 * Reloj Pomodoro basado en marcas de tiempo reales, no en contar ticks.
 * Así el tiempo sigue siendo correcto aunque la pestaña quede en segundo plano.
 */
export function usePomodoro(ajustes: Ajustes, opciones: Opciones = {}) {
  const [modo, setModo] = useState<Modo>("enfoque");
  const [corriendo, setCorriendo] = useState(false);
  const [restanteMs, setRestanteMs] = useState(
    () => minutosDeModo("enfoque", ajustes) * 60_000,
  );
  const [ciclo, setCiclo] = useState(0);
  const [tiempoCumplido, setTiempoCumplido] = useState(false);

  const finRef = useRef<number | null>(null);
  const restanteRef = useRef(restanteMs);
  const corriendoRef = useRef(corriendo);
  const terminandoRef = useRef(false);
  const onCompletadoRef = useRef(opciones.onPomodoroCompletado);

  useEffect(() => {
    onCompletadoRef.current = opciones.onPomodoroCompletado;
  });

  useEffect(() => {
    restanteRef.current = restanteMs;
  }, [restanteMs]);

  useEffect(() => {
    corriendoRef.current = corriendo;
  }, [corriendo]);

  const duracionTotalMs = minutosDeModo(modo, ajustes) * 60_000;

  // Si cambian los ajustes o el modo y el reloj está detenido, reajustamos el tiempo.
  useEffect(() => {
    if (corriendoRef.current) return;
    setRestanteMs(minutosDeModo(modo, ajustes) * 60_000);
  }, [ajustes, modo]);

  // Cuando termina una sesión limpiamos el aviso tras unos segundos.
  useEffect(() => {
    if (!tiempoCumplido) return;
    const id = window.setTimeout(() => setTiempoCumplido(false), 6000);
    return () => window.clearTimeout(id);
  }, [tiempoCumplido]);

  const irA = useCallback(
    (siguiente: Modo, nuevoCiclo: number, avisar: boolean) => {
      terminandoRef.current = false;
      finRef.current = null;
      corriendoRef.current = false;
      setCiclo(nuevoCiclo);
      setCorriendo(false);
      setModo(siguiente);
      setRestanteMs(minutosDeModo(siguiente, ajustes) * 60_000);
      if (avisar) setTiempoCumplido(true);
    },
    [ajustes],
  );

  const siguienteModo = useCallback(
    (modoActual: Modo, nuevoCiclo: number): Modo => {
      if (modoActual !== "enfoque") return "enfoque";
      const cada = Math.max(1, ajustes.pomodorosAntesDescansoLargo);
      return nuevoCiclo % cada === 0 ? "descanso-largo" : "descanso-corto";
    },
    [ajustes.pomodorosAntesDescansoLargo],
  );

  const finalizar = useCallback(() => {
    if (modo === "enfoque") {
      const nuevoCiclo = ciclo + 1;
      irA(siguienteModo("enfoque", nuevoCiclo), nuevoCiclo, true);
      onCompletadoRef.current?.();
    } else {
      irA("enfoque", ciclo, true);
    }
  }, [ciclo, irA, modo, siguienteModo]);

  // Bucle del reloj.
  useEffect(() => {
    if (!corriendo) return;

    const tick = () => {
      const fin = finRef.current;
      if (fin == null) return;
      const restante = fin - Date.now();
      if (restante <= 0) {
        if (terminandoRef.current) return;
        terminandoRef.current = true;
        setRestanteMs(0);
        finalizar();
      } else {
        setRestanteMs(restante);
      }
    };

    tick();
    const id = window.setInterval(tick, 200);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [corriendo, finalizar]);

  const iniciar = useCallback(() => {
    if (corriendoRef.current || terminandoRef.current) return;
    const restante = restanteRef.current > 0 ? restanteRef.current : duracionTotalMs;
    terminandoRef.current = false;
    setTiempoCumplido(false);
    finRef.current = Date.now() + restante;
    setCorriendo(true);
  }, [duracionTotalMs]);

  const pausar = useCallback(() => {
    if (!corriendoRef.current) return;
    const fin = finRef.current;
    if (fin != null) setRestanteMs(Math.max(0, fin - Date.now()));
    finRef.current = null;
    setCorriendo(false);
  }, []);

  const alternar = useCallback(() => {
    if (corriendoRef.current) pausar();
    else iniciar();
  }, [iniciar, pausar]);

  const reiniciar = useCallback(() => {
    terminandoRef.current = false;
    finRef.current = null;
    setCorriendo(false);
    setTiempoCumplido(false);
    setRestanteMs(duracionTotalMs);
  }, [duracionTotalMs]);

  const saltar = useCallback(() => {
    if (modo === "enfoque") {
      const nuevoCiclo = ciclo + 1;
      irA(siguienteModo("enfoque", nuevoCiclo), nuevoCiclo, false);
    } else {
      irA("enfoque", ciclo, false);
    }
  }, [ciclo, irA, modo, siguienteModo]);

  const elegirModo = useCallback(
    (elegido: Modo) => {
      irA(elegido, ciclo, false);
    },
    [ciclo, irA],
  );

  const texto = formatearTiempo(restanteMs);
  const progreso =
    duracionTotalMs > 0
      ? Math.min(1, Math.max(0, 1 - restanteMs / duracionTotalMs))
      : 0;

  useEffect(() => {
    document.title = `${texto} · ${etiquetaModo(modo)} — Pato Pomodoro`;
  }, [texto, modo]);

  return {
    modo,
    corriendo,
    texto,
    progreso,
    ciclo,
    tiempoCumplido,
    iniciar,
    pausar,
    alternar,
    reiniciar,
    saltar,
    elegirModo,
  };
}
