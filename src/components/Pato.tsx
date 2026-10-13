import type { Modo } from "../lib/storage";

type Pose = "trabaja" | "duerme" | "quieto";

interface Props {
  modo: Modo;
  corriendo: boolean;
}

/**
 * El patito. Tres poses según el estado:
 * - `trabaja`: enfoque en marcha (se balancea, aletea y brillan chispitas).
 * - `duerme`: descanso en marcha (ojos cerrados y Zzz flotando).
 * - `quieto`: en pausa (respira despacio y parpadea).
 */
export default function Pato({ modo, corriendo }: Props) {
  const pose: Pose = !corriendo ? "quieto" : modo === "enfoque" ? "trabaja" : "duerme";

  return (
    <svg
      className={`pato pato--${pose}`}
      viewBox="0 0 260 220"
      role="img"
      aria-label={
        pose === "trabaja"
          ? "Patito trabajando en su enfoque"
          : pose === "duerme"
            ? "Patito descansando"
            : "Patito esperando"
      }
    >
      <ellipse className="pato__sombra" cx="126" cy="205" rx="74" ry="12" />

      <g className="pato__arriba">
        <path className="pato__cola" d="M62 130 Q28 118 26 94 Q56 100 72 116 Z" />
        <ellipse className="pato__cuerpo" cx="118" cy="140" rx="76" ry="50" />
        <ellipse className="pato__panza" cx="132" cy="160" rx="48" ry="26" />

        <g transform="rotate(-8 100 128)">
          <g className="pato__ala">
            <ellipse cx="100" cy="128" rx="34" ry="25" />
            <path className="pato__pluma" d="M72 134 q28 -16 58 -2" />
          </g>
        </g>

        <g className="pato__cabeza">
          <circle className="pato__craneo" cx="176" cy="74" r="46" />
          <circle className="pato__cachete" cx="188" cy="94" r="12" />
          <g className="pato__ojo-abierto">
            <circle cx="188" cy="62" r="8" />
            <circle className="pato__brillo" cx="191" cy="59" r="2.8" />
          </g>
          <path className="pato__ojo-cerrado" d="M180 62 q8 9 16 0" />
          <path className="pato__pico" d="M214 72 q30 0 32 12 q-6 12 -32 8 z" />
          <path className="pato__pico-linea" d="M214 84 q18 1 30 2" />
        </g>
      </g>

      <g className="pato__patas">
        <path d="M104 184 v16" />
        <path d="M144 184 v16" />
        <ellipse cx="100" cy="203" rx="16" ry="8" />
        <ellipse cx="148" cy="203" rx="16" ry="8" />
      </g>

      <g className="pato__zzz">
        <text className="pato__z pato__z--1" x="200" y="42">
          z
        </text>
        <text className="pato__z pato__z--2" x="220" y="26">
          z
        </text>
        <text className="pato__z pato__z--3" x="244" y="12">
          z
        </text>
      </g>

      <g className="pato__chispas">
        <g transform="translate(246,28)">
          <path
            className="pato__chispa pato__chispa--1"
            d="M0 -12 L3 -3 L12 0 L3 3 L0 12 L-3 3 L-12 0 L-3 -3 Z"
          />
        </g>
        <g transform="translate(216,4)">
          <path
            className="pato__chispa pato__chispa--2"
            d="M0 -9 L2.3 -2.3 L9 0 L2.3 2.3 L0 9 L-2.3 2.3 L-9 0 L-2.3 -2.3 Z"
          />
        </g>
      </g>
    </svg>
  );
}
