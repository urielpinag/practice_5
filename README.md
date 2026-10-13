# 🦆 Pato Pomodoro

Un temporizador [Pomodoro](https://es.wikipedia.org/wiki/T%C3%A9cnica_Pomodoro) pequeñito y
cute: un patito te acompaña mientras trabajas y descansa contigo.

Hecho con la plantilla **React + Vite** del CLI de Cloudflare
(`npm create cloudflare@latest --framework=react`), así que el proyecto incluye un
**Worker** que sirve el SPA y responde la API en `/api/`.

## Qué hace

- **Tres modos**: Enfoque, Descanso corto y Descanso largo (tras completar el ciclo de enfoques).
- **Patito animado** con tres poses:
  - `trabaja`: se menea, aletea y le brillan chispitas durante el enfoque.
  - `duerme`: cierra los ojos y flotan Zzz durante el descanso.
  - `quieto`: respira y parpadea cuando el reloj está en pausa.
- **Anillo de progreso** que se llena conforme pasa el tiempo, con el color de cada modo.
- **Controles**: iniciar/pausar, reiniciar y saltar al siguiente modo.
- **Atajos de teclado**: `Espacio` iniciar/pausar · `R` reiniciar · `S` saltar.
- **Estadísticas**: pomodoros completados hoy y racha de días seguidos.
- **Panel de ajustes** para cambiar las duraciones y cuántos enfoques hay por ciclo.
- El título de la pestaña muestra el tiempo restante.
- Todo se ve bien en el celular y respeta `prefers-reduced-motion`.

## Todo se guarda en el navegador

No hay base de datos: lo poco que hay que recordar vive en `localStorage`
(ver `src/lib/storage.ts`).

| Clave | Contenido |
| --- | --- |
| `pato-pomodoro:ajustes` | Duraciones y enfoques por ciclo |
| `pato-pomodoro:stats` | Pomodoros de hoy, racha y último día completado |

## Estructura

```
src/
├── App.tsx                 # Pantalla principal y atajos de teclado
├── App.css                 # Estilos, animaciones del patito y fondos por modo
├── components/
│   ├── Pato.tsx            # El patito en SVG con sus tres poses
│   ├── AnilloProgreso.tsx  # Anillo circular de progreso
│   ├── Controles.tsx       # Botones de iniciar/pausar, reiniciar y saltar
│   └── Ajustes.tsx         # Panel de configuración
├── hooks/usePomodoro.ts    # Reloj basado en marcas de tiempo
└── lib/storage.ts          # Tipos y acceso a localStorage
worker/index.ts             # Worker: sirve el SPA y responde /api/
wrangler.jsonc              # Configuración del Worker
```

## Desarrollo

```sh
npm install
npm run dev      # Vite + el plugin de Cloudflare (Worker y SPA juntos)
npm run build    # Compila el SPA y el Worker
npm run lint     # oxlint
npm run preview  # Prueba el build en el runtime de Workers
```

## Despliegue

El proyecto se despliega como un Worker con assets estáticos:

```sh
npm run deploy   # npm run build && wrangler deploy
```

También se puede enganchar a un repositorio de GitHub desde el panel de Cloudflare
(*Workers & Pages → Create application → Connect to Git*) usando como
**build command** `npm run build` y como **deploy command** `npx wrangler deploy`.
