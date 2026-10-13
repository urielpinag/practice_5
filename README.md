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

## Pruebas unitarias

Las pruebas usan [Vitest](https://vitest.dev/) con cobertura de V8 y
[Testing Library](https://testing-library.com/). La configuración está en
`vitest.config.ts` (va aparte de `vite.config.ts` para no arrastrar el plugin de Cloudflare).

```sh
npm test             # corre las pruebas una vez
npm run test:watch   # modo interactivo
npm run test:coverage  # además genera el reporte en coverage/
```

El reporte se escribe en `coverage/`: `coverage/index.html` para verlo en el navegador,
`coverage/lcov.info` y `coverage/coverage-summary.json`.

**Cobertura actual:** 96% de sentencias, 98% de líneas, 95% de funciones y 86% de ramas.
El pipeline falla si la cobertura baja del **70%** en cualquiera de las cuatro métricas.

Qué se prueba:

| Archivo | Qué cubre |
| --- | --- |
| `src/lib/storage.test.ts` | Valores por defecto, saneo de datos inválidos, cambio de día y racha |
| `src/hooks/usePomodoro.test.ts` | Reloj, pausa, reinicio, saltos, cambio de modo y fin de sesión |
| `src/components/*.test.tsx` | Controles, patito, anillo de progreso y panel de ajustes |
| `src/App.test.tsx` | Pantalla completa: frase del Worker, atajos y persistencia |
| `worker/index.test.ts` | La API del Worker y sus 404 |

## CI/CD

El pipeline vive en `.github/workflows/ci.yml` y tiene dos jobs encadenados:

1. **`build-and-test`** — instala dependencias, corre el linter, ejecuta las pruebas con
   cobertura, compila con el entorno `production` y publica dos artefactos:
   - `coverage-report` (el reporte de cobertura)
   - `build-output` (`dist/` + `.wrangler/deploy`, es decir el build listo para publicar)
2. **`deploy-prod`** — solo en `main` o a mano: descarga `build-output` y publica **el mismo
   artefacto que se probó** en el proyecto de producción de Cloudflare.

### Secretos que necesitas

En *Settings → Secrets and variables → Actions* del repositorio:

| Secreto | De dónde sale |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | *My Profile → API Tokens → Create Token*, plantilla **Edit Cloudflare Workers** |
| `CLOUDFLARE_ACCOUNT_ID` | Aparece en el panel de Cloudflare (Workers & Pages), a la derecha |

Sin ellos el job de pruebas sigue funcionando, pero `deploy-prod` falla.

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
├── lib/storage.ts          # Tipos y acceso a localStorage
└── test/setup.ts           # Configuración de Testing Library
worker/index.ts             # Worker: sirve el SPA y responde /api/
wrangler.jsonc              # Configuración del Worker y su entorno de producción
vitest.config.ts            # Configuración de las pruebas y la cobertura
.github/workflows/ci.yml    # Pipeline: build + pruebas + deploy
```

## Desarrollo

```sh
npm install
npm run dev      # Vite + el plugin de Cloudflare (Worker y SPA juntos)
npm run build    # Compila el SPA y el Worker
npm run lint     # oxlint
npm run test:coverage
npm run preview  # Prueba el build en el runtime de Workers
```

## Despliegue

El proyecto se despliega como un Worker con assets estáticos. En `wrangler.jsonc` hay dos
entornos, así que existen **dos proyectos** en Cloudflare:

| Entorno | Worker | Cómo se publica |
| --- | --- | --- |
| Por defecto (desarrollo) | `pato-pomodoro` | `npm run deploy` |
| `production` | `pato-pomodoro-production` | `npm run deploy:prod` |

> Con el plugin de Vite el entorno se elige **en el build**, no con `--env`:
> `npm run deploy:prod` ejecuta `CLOUDFLARE_ENV=production npm run build` y luego
> `wrangler deploy`, que publica el Worker `pato-pomodoro-production`.

También se puede enganchar a un repositorio de GitHub desde el panel de Cloudflare
(*Workers & Pages → Create application → Connect to Git*) usando como
**build command** `npm run build` y como **deploy command** `npx wrangler deploy`.
