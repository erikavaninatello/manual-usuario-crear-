# Manual de Usuario — CREAR

Manual de usuario del **Sistema de Gestión Académica CREAR** (Escuela de Danzas CREAR).
Es un sitio estático (HTML + CSS + JavaScript): no necesita servidor ni instalación.

## Qué incluye
- **Inicio** con banner de bienvenida (saludo según la hora, fecha y ciclo) y accesos directos a los módulos.
- **19 secciones** del manual con pasos numerados, avisos, tablas, migas de pan y botones Anterior / Siguiente.
- **Videos de recorrido** (escritorio y celular) con captura de respaldo: si falta un video, se muestra la captura de esa pantalla.
- **Tina**, asistente de ayuda por chat (solo texto): responde preguntas de usuarios con el contenido del manual.
- Modo oscuro (por defecto) y claro, buscador (`/`), botón Imprimir / PDF y diseño responsive.

## Estructura
```
index.html
css/styles.css
js/script.js
assets/
  images/   logos, Tina e ilustración del Inicio
  images/capturas/   capturas de respaldo de cada pantalla
  videos/   recorridos .webm: <seccion>-escritorio.webm y <seccion>-celular.webm
```

## Cómo verlo
- En VS Code: abrir la carpeta y usar **Live Server** sobre `index.html`.
- En GitHub Pages: *Settings → Pages → Deploy from a branch → `main` / root*.

## Editar las respuestas de Tina
Las respuestas están al final de `js/script.js`, en la lista `BASE_RESPUESTAS`. Cada entrada tiene:
- `k`: grupos de palabras clave (alcanza con una palabra de cada grupo; se compara el comienzo de la palabra).
- `n`: cuántos grupos tienen que coincidir (1 por defecto).
- `a`: la respuesta que muestra Tina.
- `go`: la sección del manual a la que lleva el botón «Abrir».

Si cambia algo del sistema (por ejemplo el recargo por mora o el plazo para anular un cobro), actualizá el texto de la sección en `index.html` y la respuesta correspondiente.

Si más adelante se conecta un servicio de IA, definir `window.CREAR_CHAT_CONFIG = { endpoint: "https://..." }` antes de cargar `js/script.js`; Tina lo usa en lugar de la base local.

## Regrabar los videos (opcional)
`tools/record-demo.mjs` graba los recorridos con Playwright. Se configura con variables de entorno
(`DEMO_URL`, `DEMO_EMAIL`, `DEMO_PASSWORD`, `ONLY_FLOW`). No guardes claves en el repositorio.

```
npm install
npx playwright install chromium
DEMO_URL=https://... DEMO_EMAIL=... DEMO_PASSWORD=... npm run record:demo
```
