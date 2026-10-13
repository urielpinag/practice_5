import { useState } from "react";
import type { Ajustes } from "../lib/storage";
import { CICLO_MAX, CICLO_MIN, MINUTOS_MAX, MINUTOS_MIN } from "../lib/storage";

interface CampoProps {
  id: string;
  etiqueta: string;
  valor: number;
  min: number;
  max: number;
  sufijo: string;
  onCambiar: (valor: number) => void;
}

function Campo({ id, etiqueta, valor, min, max, sufijo, onCambiar }: CampoProps) {
  const [texto, setTexto] = useState(String(valor));
  const [valorAnterior, setValorAnterior] = useState(valor);

  // Si el valor de afuera cambia (por ejemplo al restablecer), sincronizamos
  // el texto editable durante el render, sin pasar por un efecto.
  if (valor !== valorAnterior) {
    setValorAnterior(valor);
    setTexto(String(valor));
  }

  const confirmar = () => {
    const limpio = texto.trim();
    const numero = Number(limpio);
    const ajustado =
      limpio !== "" && Number.isFinite(numero)
        ? Math.min(max, Math.max(min, Math.round(numero)))
        : valor;
    setTexto(String(ajustado));
    if (ajustado !== valor) onCambiar(ajustado);
  };

  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <span className="campo__control">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          onBlur={confirmar}
          onKeyDown={(evento) => {
            if (evento.key === "Enter") confirmar();
          }}
        />
        <span className="campo__sufijo">{sufijo}</span>
      </span>
    </div>
  );
}

interface Props {
  abierto: boolean;
  ajustes: Ajustes;
  onCambiar: (siguientes: Ajustes) => void;
  onRestablecer: () => void;
}

export default function Ajustes({ abierto, ajustes, onCambiar, onRestablecer }: Props) {
  return (
    <section className={`ajustes ${abierto ? "ajustes--abierto" : ""}`} aria-hidden={!abierto}>
      <h2 className="ajustes__titulo">Ajustes</h2>
      <p className="ajustes__ayuda">Se guardan solos en este navegador.</p>

      <div className="ajustes__campos">
        <Campo
          id="enfoque"
          etiqueta="Enfoque"
          valor={ajustes.enfoque}
          min={MINUTOS_MIN}
          max={MINUTOS_MAX}
          sufijo="min"
          onCambiar={(valor) => onCambiar({ ...ajustes, enfoque: valor })}
        />
        <Campo
          id="descanso-corto"
          etiqueta="Descanso corto"
          valor={ajustes.descansoCorto}
          min={MINUTOS_MIN}
          max={MINUTOS_MAX}
          sufijo="min"
          onCambiar={(valor) => onCambiar({ ...ajustes, descansoCorto: valor })}
        />
        <Campo
          id="descanso-largo"
          etiqueta="Descanso largo"
          valor={ajustes.descansoLargo}
          min={MINUTOS_MIN}
          max={MINUTOS_MAX}
          sufijo="min"
          onCambiar={(valor) => onCambiar({ ...ajustes, descansoLargo: valor })}
        />
        <Campo
          id="pomodoros-ciclo"
          etiqueta="Enfoques por ciclo"
          valor={ajustes.pomodorosAntesDescansoLargo}
          min={CICLO_MIN}
          max={CICLO_MAX}
          sufijo="🦆"
          onCambiar={(valor) => onCambiar({ ...ajustes, pomodorosAntesDescansoLargo: valor })}
        />
      </div>

      <button type="button" className="boton boton--suave" onClick={onRestablecer}>
        Volver a los valores de siempre
      </button>
    </section>
  );
}
