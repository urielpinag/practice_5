import type { Modo } from "../lib/storage";

const RADIO = 148;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

interface Props {
  /** 0 = recién empezado, 1 = terminado. */
  progreso: number;
  modo: Modo;
}

export default function AnilloProgreso({ progreso, modo }: Props) {
  return (
    <svg className="anillo" viewBox="0 0 320 320" aria-hidden="true">
      <circle className="anillo__pista" cx="160" cy="160" r={RADIO} />
      <circle
        className={`anillo__progreso anillo__progreso--${modo}`}
        cx="160"
        cy="160"
        r={RADIO}
        strokeDasharray={CIRCUNFERENCIA}
        strokeDashoffset={CIRCUNFERENCIA * (1 - progreso)}
        transform="rotate(-90 160 160)"
      />
    </svg>
  );
}
