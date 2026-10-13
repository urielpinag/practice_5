import { useCallback, useEffect, useState } from "react";
import "./App.css";
import PanelAjustes from "./components/Ajustes";
import AnilloProgreso from "./components/AnilloProgreso";
import Controles from "./components/Controles";
import Pato from "./components/Pato";
import { etiquetaModo, usePomodoro } from "./hooks/usePomodoro";
import {
  AJUSTES_POR_DEFECTO,
  cargarAjustes,
  cargarStats,
  guardarAjustes,
  registrarPomodoro,
  reiniciarStats,
} from "./lib/storage";
import type { Ajustes, Modo } from "./lib/storage";

const MODOS: Modo[] = ["enfoque", "descanso-corto", "descanso-largo"];
const ETIQUETAS_CORTAS: Record<Modo, string> = {
  enfoque: "Enfoque",
  "descanso-corto": "Descanso corto",
  "descanso-largo": "Descanso largo",
};

export default function App() {
  const [ajustes, setAjustes] = useState<Ajustes>(() => cargarAjustes());
  const [stats, setStats] = useState(() => cargarStats());
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [frase, setFrase] = useState<string | null>(null);

  useEffect(() => {
    guardarAjustes(ajustes);
  }, [ajustes]);

  const alCompletarPomodoro = useCallback(() => {
    setStats((previas) => registrarPomodoro(previas));
  }, []);

  const {
    modo,
    corriendo,
    texto,
    progreso,
    ciclo,
    tiempoCumplido,
    alternar,
    reiniciar,
    saltar,
    elegirModo,
  } = usePomodoro(ajustes, { onPomodoroCompletado: alCompletarPomodoro });

  // Frase que sirve el Worker en /api/.
  useEffect(() => {
    let vivo = true;
    fetch("/api/")
      .then((respuesta) =>
        respuesta.ok ? respuesta.json() : Promise.reject(new Error("sin respuesta")),
      )
      .then((datos: { frase?: string }) => {
        if (vivo && typeof datos.frase === "string") setFrase(datos.frase);
      })
      .catch(() => {
        if (vivo) setFrase("¡Cuac! A darle con todo 🦆");
      });
    return () => {
      vivo = false;
    };
  }, []);

  // Atajos: espacio = iniciar/pausar, R = reiniciar, S = saltar.
  useEffect(() => {
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.metaKey || evento.ctrlKey || evento.altKey) return;
      const objetivo = evento.target as HTMLElement | null;
      if (
        objetivo &&
        (objetivo.tagName === "INPUT" ||
          objetivo.tagName === "TEXTAREA" ||
          objetivo.tagName === "BUTTON" ||
          objetivo.tagName === "SELECT" ||
          objetivo.isContentEditable)
      ) {
        return;
      }
      if (evento.code === "Space") {
        evento.preventDefault();
        alternar();
      } else if (evento.key.toLowerCase() === "r") {
        reiniciar();
      } else if (evento.key.toLowerCase() === "s") {
        saltar();
      }
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [alternar, reiniciar, saltar]);

  const cada = Math.max(1, ajustes.pomodorosAntesDescansoLargo);
  const hechosCiclo = modo === "descanso-largo" && ciclo > 0 ? cada : ciclo % cada;

  return (
    <main className={`app app--${modo}`}>
      <div className="nubes" aria-hidden="true">
        <span className="nube nube--1" />
        <span className="nube nube--2" />
        <span className="nube nube--3" />
      </div>

      <header className="encabezado">
        <h1 className="encabezado__titulo">
          <span className="encabezado__emoji" aria-hidden="true">
            🦆
          </span>
          Pato Pomodoro
        </h1>
        <button
          type="button"
          className="engranaje"
          onClick={() => setPanelAbierto((abierto) => !abierto)}
          aria-expanded={panelAbierto}
          aria-controls="panel-ajustes"
          aria-label="Abrir ajustes"
          title="Ajustes"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.04.24.25.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
        </button>
      </header>

      <section className="tarjeta">
        <div className="modos" role="tablist" aria-label="Modo del temporizador">
          {MODOS.map((opcion) => (
            <button
              key={opcion}
              type="button"
              role="tab"
              aria-selected={opcion === modo}
              className={`modo ${opcion === modo ? "modo--activo" : ""}`}
              onClick={() => elegirModo(opcion)}
            >
              {ETIQUETAS_CORTAS[opcion]}
            </button>
          ))}
        </div>

        <div className="reloj">
          <AnilloProgreso progreso={progreso} modo={modo} />
          <div className="reloj__centro">
            <span className="reloj__tiempo">{texto}</span>
            <Pato modo={modo} corriendo={corriendo} />
            <span className="reloj__estado">
              {corriendo ? etiquetaModo(modo) : "En pausa"}
            </span>
          </div>
        </div>

        <Controles
          corriendo={corriendo}
          onAlternar={alternar}
          onReiniciar={reiniciar}
          onSaltar={saltar}
        />

        <p className={`aviso ${tiempoCumplido ? "aviso--visible" : ""}`} role="status">
          ¡Cuac! Tiempo cumplido 🎉
        </p>

        <div className="ciclo">
          <div
            className="ciclo__puntos"
            role="img"
            aria-label={`${hechosCiclo} de ${cada} enfoques completados en el ciclo`}
          >
            {Array.from({ length: cada }, (_, indice) => (
              <span
                key={indice}
                className={`punto ${indice < hechosCiclo ? "punto--lleno" : ""}`}
              />
            ))}
          </div>
          <span className="ciclo__texto">
            {modo === "descanso-largo"
              ? "¡Merecido descanso largo!"
              : `${hechosCiclo} de ${cada} enfoques`}
          </span>
        </div>
      </section>

      <section className="stats" aria-label="Estadísticas">
        <div className="stat">
          <span className="stat__valor">{stats.pomodorosHoy}</span>
          <span className="stat__etiqueta">
            {stats.pomodorosHoy === 1 ? "pomodoro hoy" : "pomodoros hoy"}
          </span>
        </div>
        <div className="stat">
          <span className="stat__valor">{stats.racha}</span>
          <span className="stat__etiqueta">
            {stats.racha === 1 ? "día de racha" : "días de racha"}
          </span>
        </div>
        <button
          type="button"
          className="stats__reiniciar"
          onClick={() => setStats(reiniciarStats())}
          title="Reiniciar el contador de pomodoros y la racha"
        >
          Reiniciar contador
        </button>
      </section>

      <div id="panel-ajustes">
        <PanelAjustes
          abierto={panelAbierto}
          ajustes={ajustes}
          onCambiar={setAjustes}
          onRestablecer={() => setAjustes(AJUSTES_POR_DEFECTO)}
        />
      </div>

      <footer className="pie">
        <span className="pie__frase">{frase ?? "…"}</span>
        <span className="pie__atajos">
          Espacio: iniciar/pausar · R: reiniciar · S: saltar
        </span>
      </footer>
    </main>
  );
}
