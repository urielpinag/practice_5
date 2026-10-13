const FRASES = [
  "¡Cuac! A darle con todo 🦆",
  "Un pato a la vez, un pomodoro a la vez.",
  "El patito cree en ti.",
  "Nada de distracciones: el estanque está en calma.",
  "Respira, concéntrate, ¡cuac!",
  "Veinte y cinco minutos y luego a chapotear.",
  "Tu cerebro merece este ratito de foco.",
  "El patito ya está remando contigo.",
];

/**
 * Worker de Pato Pomodoro.
 * Devuelve una frase motivadora en `/api/` y deja que los assets estáticos
 * (el SPA de React) se sirvan por sí solos.
 */
export default {
  fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      const frase = FRASES[Math.floor(Math.random() * FRASES.length)];
      return Response.json({ frase });
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
