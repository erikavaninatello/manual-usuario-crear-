# Manual de Usuario — CREAR

Manual interactivo del Sistema de Gestión Académica CREAR, para uso del personal interno (Directora, Secretaria, Profesoras).

## Tina, guía permanente del manual

En Inicio, Tina conserva una presencia grande dentro del bloque de bienvenida.
En las demás secciones aparece en una tarjeta más compacta, alineada a la
derecha y antes de la demostración para no tapar el video. El diseño se adapta
a escritorio y celular. Al cambiar de sección, Tina actualiza el texto, pero
no inicia el audio automáticamente. **Escuchar**
reproduce la explicación solo cuando la persona lo presiona; si empieza otro
audio o video, la voz de Tina se pausa. **Preguntame** abre el chat y la
animación usa el archivo Lottie local.

La generación usa la voz ID configurada para Tina y aplica un estilo algo más
expresivo y ágil. Estos ajustes no convierten una voz adulta en una voz infantil
ni imitan la voz de un personaje o actor específico.

Para habilitar la generación de voz:

1. Pegá tu API key en `ELEVENLABS_API_KEY` dentro de `.env.local`. El archivo
   ya está creado con la variable vacía y está excluido de Git; no compartas ni
   subas la clave. También podés usar `.env.local.example` como referencia.
2. Ejecutá `npm run narrate:tina`. Los MP3 se guardan en
   `assets/audio/tina/` y se sirven como archivos estáticos con el manual.
   Para volver a generar todos los audios, ejecutá
   `npm run narrate:tina -- --force`.

La clave no se puede configurar desde este entorno: debe agregarse localmente
en `.env.local` y nunca compartirse por el chat ni guardarse en Git.

El texto breve y la ruta de audio de cada explicación están en
`assets/data/tina-guides.json`. La clave queda solo en `.env.local`, nunca se
expone al navegador. Si todavía no se generaron los MP3, el botón **Escuchar**
indica que falta el audio; Tina no sustituye esa voz por una voz de navegador.

Lottie se sirve localmente desde `assets/vendor/`, junto con su licencia:

```powershell
npm install
```

Al actualizar Lottie, copiá de nuevo su distribución y licencia desde
`node_modules/lottie-web/build/player` a `assets/vendor/`, y verificá el manual
en escritorio y celular. Tina permanece dentro de la sección activa, sin tour
paso a paso ni capa oscura. Los videos se reproducen automáticamente cuando son
visibles y se pausa el anterior para evitar recorridos simultáneos; con
movimiento reducido o sin `IntersectionObserver`, quedan disponibles los
controles manuales.

## Recorridos en video

Las secciones del manual muestran recorridos en video en dos tamaños: escritorio y celular. Los videos son mudos, repiten el recorrido y usan un cursor resaltado para que se entienda cada acción. El botón «Ampliar video» permite verlo a pantalla completa. La explicación hablada queda a cargo únicamente de Tina, para evitar dos narraciones simultáneas.

Si falta una variante celular, el alta de estudiante reutiliza su video de
escritorio. La grabación de la Ficha 360° de estudiante todavía no está en
`assets/videos/`; para generarla, configurá las credenciales de la demo como se
indica abajo, establecé `$env:ONLY_FLOW = "ficha-estudiante"` y ejecutá
`npm run record:demo`.

Para generar los recorridos:

1. Instalá las dependencias y Chromium:

   ```powershell
   npm install
   npx playwright install chromium
   ```

2. Configurá la URL y la cuenta de prueba en la sesión de PowerShell, sin guardarlas en archivos del proyecto:

   ```powershell
   $env:DEMO_URL = "https://tu-demo.example.com"
   $env:DEMO_EMAIL = Read-Host "Correo de la cuenta de prueba"
   $securePassword = Read-Host "Contraseña de la cuenta de prueba" -AsSecureString
   $env:DEMO_PASSWORD = [System.Net.NetworkCredential]::new("", $securePassword).Password
   ```

3. Ejecutá la grabación:

   ```powershell
   npm run record:demo
   ```

   Se recorren los módulos en escritorio y celular, con acciones reales de consulta y sin confirmar altas, pagos, licencias ni otros cambios. Los videos se generan en `assets/videos/`, en formato WebM, sin audio. Para probar o volver a grabar un módulo solamente, configurá `ONLY_FLOW` con el ID de un recorrido, por ejemplo:

   ```powershell
   $env:ONLY_FLOW = "ficha-profesora"
   npm run record:demo
   Remove-Item Env:ONLY_FLOW
   ```

   Los IDs disponibles están en `tools/record-demo.mjs`; incluyen `ficha-profesora` y `licencias`.

4. Quitá las credenciales de la sesión cuando termines:

   ```powershell
   Remove-Item Env:DEMO_URL, Env:DEMO_EMAIL, Env:DEMO_PASSWORD
   Remove-Variable securePassword
   ```

Usá exclusivamente una cuenta y datos ficticios de prueba. Los videos se escriben en la carpeta del manual para que puedas revisarlos antes de publicarlo.

Para probar el manual localmente con los videos habilitados, serví la carpeta por HTTP en vez de abrir `index.html` directamente:

```powershell
python -m http.server 8000
```

Después abrí `http://localhost:8000` en el navegador.

## Asistente virtual flotante

El botón **Preguntame** de Tina abre un chat adaptable al tema claro/oscuro.
El mismo personaje Lottie se mantiene como guía a la derecha mientras
consultás.

Para recibir respuestas reales, conectá el widget a un endpoint propio que
actúe como proxy seguro de Gemini. En `index.html`, antes de
`<script src="js/script.js">`, agregá:

```html
<script>
  window.CREAR_CHAT_CONFIG = {
    endpoint: "https://tu-api.example.com/api/asistencia-virtual/chat"
  };
</script>
```

El widget envía un `POST` JSON con `system_instruction.parts[0].text` y
`contents`, en el formato `generateContent` de Gemini. Acepta respuestas
Gemini (`candidates[0].content.parts`) o `{ "reply": "..." }`. El prompt del
asistente está en `js/script.js` y se basa en las secciones y atajos de este
manual. El endpoint debe aplicar sus propias reglas del sistema, limitar
consultas y proteger la clave de Gemini en el servidor; no pongas la clave en
este sitio estático. Hasta configurar el endpoint, el widget se muestra y
explica cómo conectarlo, pero no inventa respuestas.

## Publicarlo con un link (para el botón "Ayuda" del sistema)

Opción más simple y gratuita: [Netlify Drop](https://app.netlify.com/drop) — arrastrás esta carpeta completa al navegador y te da una URL pública al instante, sin necesidad de crear cuenta.
