import { mkdir, mkdtemp, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.DEMO_URL;
const email = process.env.DEMO_EMAIL;
const password = process.env.DEMO_PASSWORD;
const outputDir = path.resolve(process.env.OUTPUT_DIR || "assets/videos");
const desktop = { name: "escritorio", width: 1440, height: 1000 };
const mobile = { name: "celular", width: 390, height: 844 };
// Recorridos con los textos reales del sistema. Ningún recorrido guarda ni confirma datos:
// se rellenan campos de prueba, se muestran paneles y se cierran con Escape.
const byName = (re, role = "button") => (page) => page.getByRole(role, { name: re }).filter({ visible: true }).first();
const byText = (re) => (page) => page.getByText(re).filter({ visible: true }).first();
const rowMenu = (page) => page.getByRole("button", { name: /^(opciones|acciones)/i }).filter({ visible: true }).first();
const dialogField = (page, re) => page.locator('[data-capa-dialogo="true"], [role="dialog"]').last().getByLabel(re).first();
const closeWithEsc = { target: (page) => page.locator("body"), action: "press-escape", optional: true };
const flows = [
  {
    id: "inicio",
    title: "El Inicio del sistema",
    path: "/inicio",
    steps: [
      { target: byName(/^cobrar/i, "link"), action: "highlight", optional: true },
      { target: byName(/tomar lista/i, "link"), action: "highlight", optional: true },
      { target: byName(/inscribir/i, "link"), action: "highlight", optional: true },
      { target: byText(/cobrado en el mes/i), action: "highlight", optional: true },
      { target: byText(/clases de hoy/i), action: "highlight", optional: true },
      { target: byName(/cuotas vencidas/i, "tab"), action: "click", optional: true },
      { target: byName(/apto f[ií]sico/i, "tab"), action: "click", optional: true },
      { target: byName(/asistencia baja/i, "tab"), action: "click", optional: true },
    ],
  },
  {
    id: "estudiantes",
    title: "Estudiantes: búsqueda y filtros",
    path: "/alumnos",
    steps: [
      { target: (page) => page.locator('input[placeholder*="Buscar"]').filter({ visible: true }).first(), action: "search", text: "Agus" },
      { target: byName(/ver \d+ de baja/i), action: "click", optional: true },
      { target: byName(/ocultar las de baja/i), action: "click", optional: true },
      { target: rowMenu, action: "click", optional: true },
      closeWithEsc,
    ],
  },
  {
    id: "alta-estudiante",
    title: "Agregar estudiante",
    path: "/alumnos",
    steps: [
      { target: byName(/agregar estudiante/i), action: "click" },
      { target: (page) => dialogField(page, /^nombre/i), action: "type", text: "María" },
      { target: (page) => dialogField(page, /^apellido/i), action: "type", text: "Pérez" },
      { target: (page) => dialogField(page, /^dni/i), action: "type", text: "40123456", optional: true },
      { target: (page) => dialogField(page, /fecha de nacimiento/i), action: "highlight", optional: true },
      { target: (page) => dialogField(page, /adulto responsable/i), action: "type", text: "Laura Pérez", optional: true },
      { target: byText(/grupo familiar/i), action: "highlight", optional: true },
      { target: byName(/guardar ficha/i), action: "highlight", optional: true },
      closeWithEsc,
    ],
  },
  {
    id: "ficha-estudiante",
    title: "Ficha del estudiante",
    path: "/alumnos",
    steps: [
      { target: rowMenu, action: "click" },
      { target: byName(/ver ficha 360/i, "menuitem"), action: "click" },
      { target: byName(/^datos$/i, "tab"), action: "click", optional: true },
      { target: byName(/^familia$/i, "tab"), action: "click", optional: true },
      { target: byName(/^salud$/i, "tab"), action: "click", optional: true },
      { target: byName(/^documentos$/i, "tab"), action: "click", optional: true },
    ],
  },
  {
    id: "profesoras",
    title: "Profesoras",
    path: "/profesores",
    steps: [
      { target: byName(/nueva profesora/i), action: "highlight", optional: true },
      { target: rowMenu, action: "click", optional: true },
      closeWithEsc,
    ],
  },
  {
    id: "ficha-profesora",
    title: "Ficha de la profesora",
    path: "/profesores",
    steps: [
      { target: rowMenu, action: "click" },
      { target: byName(/ver ficha/i, "menuitem"), action: "click" },
      { target: byName(/^datos$/i, "tab"), action: "click", optional: true },
      { target: byName(/^perfil$/i, "tab"), action: "click", optional: true },
      { target: byName(/^licencias$/i, "tab"), action: "click", optional: true },
    ],
  },
  {
    id: "licencias",
    title: "Marcar licencia",
    path: "/profesores",
    steps: [
      { target: rowMenu, action: "click" },
      { target: byName(/ver ficha/i, "menuitem"), action: "click" },
      { target: byName(/^licencias$/i, "tab"), action: "click" },
      { target: byName(/marcar licencia/i), action: "click" },
      { target: (page) => page.getByLabel(/fecha (de )?inicio/i).filter({ visible: true }).first(), action: "highlight", optional: true },
      { target: byText(/clases que quedan sin profesora/i), action: "highlight", optional: true },
      closeWithEsc,
    ],
  },
  {
    id: "clases",
    title: "Clases",
    path: "/clases",
    steps: [
      { target: byName(/nueva clase/i), action: "highlight", optional: true },
      { target: byText(/lugares? libres?/i), action: "highlight", optional: true },
      { target: byText(/para revisar/i), action: "highlight", optional: true },
      { target: byName(/precios/i), action: "highlight", optional: true },
    ],
  },
  {
    id: "inscripciones",
    title: "Nueva inscripción",
    path: "/alumnos",
    steps: [
      { target: byName(/^inscripciones$/i, "tab"), action: "click", optional: true },
      { target: byName(/nueva inscripci[oó]n/i), action: "click" },
      { target: (page) => page.getByRole("dialog").getByText(/estudiante/i).first(), action: "highlight", optional: true },
      closeWithEsc,
    ],
  },
  {
    id: "asistencia",
    title: "Tomar lista",
    path: "/asistencia",
    steps: [
      { target: (page) => page.getByRole("button", { name: /eleg[ií] la clase/i }).filter({ visible: true }).first(), action: "choose-first-class" },
      { target: (page) => page.getByRole("switch").filter({ visible: true }).first(), action: "click", optional: true },
      { target: byText(/presentes/i), action: "highlight", optional: true },
      { target: byName(/guardar asistencia/i), action: "highlight", optional: true },
    ],
  },
  {
    id: "pagos",
    title: "Cobros",
    path: "/pagos",
    steps: [
      { target: byName(/^cuotas$/i, "tab"), action: "click", optional: true },
      { target: byName(/^cobrar/i), action: "click" },
      { target: byText(/cuotas a cobrar/i), action: "highlight", optional: true },
      { target: byText(/medio de pago/i), action: "highlight", optional: true },
      { target: byName(/transferencia/i), action: "click", optional: true },
      { target: byName(/mercado pago/i), action: "click", optional: true },
      closeWithEsc,
    ],
  },
  {
    id: "sueldos",
    title: "Sueldos",
    path: "/sueldos",
    steps: [
      { target: byName(/actualizar/i), action: "highlight", optional: true },
      { target: byName(/ver su clase/i), action: "click", optional: true },
      { target: byText(/a liquidar/i), action: "highlight", optional: true },
    ],
  },
  {
    id: "evaluaciones",
    title: "Evaluaciones",
    path: "/evaluaciones",
    steps: [
      { target: byName(/cambiar clases/i), action: "highlight", optional: true },
      { target: byText(/t[eé]cnica/i), action: "highlight", optional: true },
      { target: byName(/sin nota/i), action: "click", optional: true },
      { target: byName(/^todas$/i), action: "click", optional: true },
    ],
  },
  {
    id: "eventos",
    title: "Eventos",
    path: "/eventos",
    steps: [
      { target: byName(/nuevo evento/i), action: "highlight", optional: true },
      { target: byName(/abrir el festival/i), action: "highlight", optional: true },
      { target: byName(/ver los anteriores/i), action: "click", optional: true },
    ],
  },
  {
    id: "calendario",
    title: "Calendario",
    path: "/calendario",
    steps: [
      { target: byName(/^semana$/i), action: "click", optional: true },
      { target: byName(/^d[ií]a$/i), action: "click", optional: true },
      { target: byName(/^mes$/i), action: "click", optional: true },
      { target: byName(/agregar evento/i), action: "highlight", optional: true },
    ],
  },
  {
    id: "reportes",
    title: "Reportes",
    path: "/reportes",
    steps: [
      { target: byName(/morosidad/i, "tab"), action: "click", optional: true },
      { target: byName(/ocupaci[oó]n/i, "tab"), action: "click", optional: true },
      { target: byName(/^asistencia$/i, "tab"), action: "click", optional: true },
      { target: byName(/descargar/i), action: "highlight", optional: true },
    ],
  },
  {
    id: "configuracion",
    title: "Configuración",
    path: "/configuracion",
    steps: [
      { target: byName(/nuevo usuario/i), action: "highlight", optional: true },
      { target: byName(/criterios/i, "tab"), action: "click", optional: true },
      { target: byName(/aranceles/i, "tab"), action: "click", optional: true },
      { target: byName(/instituci[oó]n/i, "tab"), action: "click", optional: true },
    ],
  },
  {
    id: "notificaciones",
    title: "Notificaciones",
    path: "/inicio",
    steps: [
      { target: byName(/notificaciones/i), action: "click" },
      { target: byName(/sin leer/i), action: "click", optional: true },
      { target: byName(/^todas$/i), action: "click", optional: true },
      { target: byName(/marcar todas como le[ií]das/i), action: "highlight", optional: true },
      closeWithEsc,
    ],
  },
];
const selectedFlows = process.env.ONLY_FLOW
  ? flows.filter((flow) => flow.id === process.env.ONLY_FLOW)
  : flows;
if (process.env.ONLY_FLOW && process.env.ONLY_FLOW !== "login" && selectedFlows.length === 0) {
  throw new Error(`No existe un recorrido con el identificador "${process.env.ONLY_FLOW}".`);
}

if (!baseUrl || (process.env.ONLY_FLOW !== "login" && (!email || !password))) {
  throw new Error(
    "Definí DEMO_URL y, salvo para ONLY_FLOW=login, DEMO_EMAIL y DEMO_PASSWORD en el entorno.",
  );
}

const temporaryDir = await mkdtemp(path.join(os.tmpdir(), "crear-manual-"));
let browser;

async function createRecordingContext(viewport, storageState, sessionStorageState) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    reducedMotion: "no-preference",
    recordVideo: {
      dir: temporaryDir,
      size: { width: viewport.width, height: viewport.height },
    },
    ...(storageState ? { storageState } : {}),
  });
  if (sessionStorageState) {
    await context.addInitScript(
      ({ origin, entries }) => {
        if (window.location.origin !== origin) return;
        for (const [key, value] of Object.entries(entries)) {
          window.sessionStorage.setItem(key, value);
        }
      },
      { origin: new URL(baseUrl).origin, entries: sessionStorageState },
    );
  }
  return context;
}

async function addCursor(page) {
  await page.evaluate(() => {
    const style = document.createElement("style");
    style.textContent = `
      #crear-demo-pointer {
        position: fixed; z-index: 2147483647; top: 0; left: 0;
        width: 42px; height: 42px; border: 3px solid #fff;
        border-radius: 50%; background: rgba(124, 95, 168, .42);
        box-shadow: 0 0 0 3px #704b9d, 0 2px 12px rgba(31, 18, 45, .5);
        opacity: 0; pointer-events: none; transform: translate(-50%, -50%);
        transition: opacity .12s ease, width .12s ease, height .12s ease;
      }
      #crear-demo-pointer.visible { opacity: 1; }
      #crear-demo-pointer.clicked { width: 58px; height: 58px; }
      #crear-demo-pointer::after {
        position: absolute; inset: 13px; content: ""; border-radius: 50%;
        background: #fff; box-shadow: 0 1px 5px rgba(31, 18, 45, .55);
      }
    `;
    document.head.append(style);
    const pointer = document.createElement("div");
    pointer.id = "crear-demo-pointer";
    document.body.append(pointer);
    document.addEventListener("mousemove", (event) => {
      pointer.style.left = `${event.clientX}px`;
      pointer.style.top = `${event.clientY}px`;
      pointer.classList.add("visible");
    });
    document.addEventListener("mousedown", () => {
      pointer.classList.add("clicked");
      setTimeout(() => pointer.classList.remove("clicked"), 260);
    });
  });
}

async function moveTo(page, target) {
  await target.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(250);
  const box = await target.boundingBox();
  if (!box) throw new Error("No se pudo ubicar el elemento del recorrido en pantalla.");
  const destination = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const current = await page.evaluate(() => ({
    x: Number.parseFloat(document.getElementById("crear-demo-pointer")?.style.left || "0"),
    y: Number.parseFloat(document.getElementById("crear-demo-pointer")?.style.top || "0"),
  }));
  const start = current.x > 0 || current.y > 0
    ? current
    : { x: 60, y: Math.min(80, page.viewportSize().height - 40) };
  const steps = 16;
  for (let step = 1; step <= steps; step += 1) {
    const progress = step / steps;
    const eased = progress * progress * (3 - 2 * progress);
    await page.mouse.move(
      start.x + (destination.x - start.x) * eased,
      start.y + (destination.y - start.y) * eased,
    );
    await page.waitForTimeout(22);
  }
  await page.waitForTimeout(350);
}

async function runStepsInner(page, steps = []) {
  for (const step of steps) {
    const target = await step.target(page);
    if (!(await target.isVisible().catch(() => false))) {
      if (step.optional) continue;
      throw new Error(`No se encontró un control visible del recorrido: ${step.action}.`);
    }
    if (step.action !== "press-escape") await moveTo(page, target);

    if (step.action === "click" || step.action === "choose-first-class") {
      await target.click();
    } else if (step.action === "search") {
      await target.click();
      await target.pressSequentially(step.text || "Agus", { delay: 90 });
      await page.waitForTimeout(1100);
      await target.fill("");
    } else if (step.action === "type") {
      await target.click();
      await target.pressSequentially(step.text || "", { delay: 80 });
    } else if (step.action === "press-escape") {
      await page.keyboard.press("Escape");
    } else if (step.action === "focus") {
      await target.click();
    } else if (step.action === "find-license-preview") {
      const date = new Date();
      for (let offset = 1; offset <= 7; offset += 1) {
        date.setDate(date.getDate() + 1);
        const value = [
          String(date.getDate()).padStart(2, "0"),
          String(date.getMonth() + 1).padStart(2, "0"),
          date.getFullYear(),
        ].join("/");
        await target.fill(value);
        await page
          .getByText(/elegí una fecha para ver qué clases se pierden/i)
          .waitFor({ state: "hidden", timeout: 5_000 });
        const showsNoClasses = await page
          .getByText(/no tiene clases en esas fechas/i)
          .isVisible()
          .catch(() => false);
        if (!showsNoClasses) break;
      }
    }

    if (step.action === "choose-first-class") {
      const option = page
        .getByRole("option")
        .filter({ hasText: /danza|jazz|iniciación/i })
        .first();
      if (await option.isVisible().catch(() => false)) {
        await moveTo(page, option);
        await option.click();
      } else if (!step.optional) {
        throw new Error("No se encontró una comisión para mostrar la planilla.");
      }
      await page.waitForTimeout(1100);
    }

    await page.waitForTimeout(step.pause ?? 850);
  }
}

// Cada paso es tolerante: si un botón no aparece o algo lo tapa, avisa y sigue con el siguiente.
async function runSteps(page, steps = []) {
  for (const step of steps) {
    try {
      await runStepsInner(page, [{ ...step, optional: true }]);
    } catch (error) {
      console.warn(`  (paso salteado: ${step.action} — ${String(error.message).split("\n")[0]})`);
      await page.keyboard.press("Escape").catch(() => {});
    }
  }
}

async function recordPage(page, context, filename, viewport, flow) {
  const video = page.video();
  if (!video) throw new Error(`No se pudo iniciar la grabación de "${filename}".`);
  try {
    await page.waitForTimeout(900);
    await runSteps(page, flow.steps);
    await page.waitForTimeout(900);
  } finally {
    await page.close();
    await context.close();
  }

  const optimizedVideo = path.join(outputDir, filename);
  await video.saveAs(optimizedVideo);
  const { size } = await stat(optimizedVideo);
  console.log(`Grabado ${flow.title} (${viewport.name}): ${Math.round(size / 1024)} KB`);
}

try {
  await mkdir(temporaryDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });

  browser = await chromium.launch({ headless: true });

  if (!process.env.ONLY_FLOW || process.env.ONLY_FLOW === "login") {
    const loginFlow = { id: "login", title: "Inicio de sesión", path: "/login" };
    for (const viewport of [desktop, mobile]) {
      const context = await createRecordingContext(viewport);
      const page = await context.newPage();
      await page.goto(new URL(loginFlow.path, baseUrl).href, { waitUntil: "networkidle" });
      await page.getByRole("heading", { name: /bienvenida/i }).waitFor();
      await addCursor(page);
      await recordPage(
        page,
        context,
        `login-${viewport.name}.webm`,
        viewport,
        loginFlow,
      );
    }
  }

  if (process.env.ONLY_FLOW !== "login") {
    const authContext = await browser.newContext({
      viewport: { width: desktop.width, height: desktop.height },
    });
    const login = await authContext.newPage();
    await login.goto(new URL("/login", baseUrl).href, { waitUntil: "networkidle" });
    await login.getByRole("textbox", { name: /correo/i }).fill(email);
    await login.getByRole("textbox", { name: /contraseña/i }).fill(password);
    await login.getByRole("button", { name: /iniciar sesión/i }).click();
    await login.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 30_000 });
    const storageState = await authContext.storageState();
    const sessionStorageState = await login.evaluate(() =>
      Object.fromEntries(
        Array.from({ length: window.sessionStorage.length }, (_, index) => {
          const key = window.sessionStorage.key(index);
          return [key, window.sessionStorage.getItem(key)];
        }),
      ),
    );
    await authContext.close();

    for (const viewport of [desktop, mobile]) {
      for (const flow of selectedFlows) {
        const context = await createRecordingContext(viewport, storageState, sessionStorageState);
        const page = await context.newPage();
        try {
        await page.goto(new URL(flow.path, baseUrl).href, { waitUntil: "domcontentloaded" });
        if (new URL(page.url()).pathname.endsWith("/login")) {
          throw new Error(`La demo rechazó la sesión al abrir "${flow.title}".`);
        }
        await page.locator("main h1, main h2").first().waitFor({ timeout: 20_000 });
        await page.waitForLoadState("networkidle", { timeout: 10_000 });
        await page.waitForTimeout(900);
        await addCursor(page);
        await recordPage(
          page,
          context,
          `${flow.id}-${viewport.name}.webm`,
          viewport,
          flow,
        );
        } catch (error) {
          console.warn(`NO SE PUDO grabar "${flow.title}" (${viewport.name}): ${String(error.message).split("\n")[0]}`);
          await context.close().catch(() => {});
        }
      }
    }
  }
} finally {
  if (browser) await browser.close();
  await rm(temporaryDir, { recursive: true, force: true });
}
