interface Props {
  corriendo: boolean;
  onAlternar: () => void;
  onReiniciar: () => void;
  onSaltar: () => void;
}

export default function Controles({ corriendo, onAlternar, onReiniciar, onSaltar }: Props) {
  return (
    <div className="controles">
      <button
        type="button"
        className="boton boton--redondo"
        onClick={onReiniciar}
        title="Reiniciar (R)"
        aria-label="Reiniciar el tiempo"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-8 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
        </svg>
      </button>

      <button
        type="button"
        className="boton boton--principal"
        onClick={onAlternar}
        aria-label={corriendo ? "Pausar el tiempo" : "Iniciar el tiempo"}
      >
        {corriendo ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
        <span>{corriendo ? "Pausar" : "Iniciar"}</span>
      </button>

      <button
        type="button"
        className="boton boton--redondo"
        onClick={onSaltar}
        title="Saltar al siguiente modo (S)"
        aria-label="Saltar al siguiente modo"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
        </svg>
      </button>
    </div>
  );
}
