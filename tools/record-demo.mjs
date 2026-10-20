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
const flows = [
  {
    id: "inicio",
    title: "Panel de inicio",
    path: "/inicio",
    steps: [
      { target: (page) => page.getByRole("link", { name: "Cobrar" }), action: "highlight" },
      { target: (page) => page.getByRole("link", { name: "Tomar lista" }), action: "highlight" },
      { target: (page) => page.getByRole("link", { name: "Inscribir" }), action: "highlight" },
    ],
  },
  {
    id: "estudiantes",
    title: "Gestión y búsqueda de estudiantes",
    path: "/alumnos",
    steps: [
      {
        target: (page) => page.locator('input[placeholder*="Buscar por nombre o DNI"]').filter({ visible: true }).first(),
        action: "search",
      },
    ],
  },
  {
    id: "alta-estudiante",
    title: "Alta de estudiante",
    path: "/alumnos/nuevo",
    steps: [
      { target: (page) => page.getByLabel(/nombre/i).first(), action: "focus" },
      { target: (page) => page.getByLabel(/apellido/i).first(), action: "focus" },
      { target: (page) => page.getByLabel(/fecha de nacimiento/i).first(), action: "focus" },
      { target: (page) => page.getByRole("button", { name: /guardar/i }).first(), action: "highlight" },
    ],
  },
  {
    id: "ficha-estudiante",
    title: "Ficha 360 de estudiante",
    path: "/alumnos",
    steps: [
      {
        target: (page) => page.getByRole("button", { name: /acciones para/i }).filter({ visible: true }).first(),
        action: "click",
      },
      {
        target: (page) => page.getByRole("menuitem", { name: /ver ficha 360/i }),
        action: "click",
      },
      { target: (page) => page.getByRole("tab", { name: "Datos" }), action: "click" },
      { target: (page) => page.getByRole("tab", { name: "Salud" }), action: "click" },
      { target: (page) => page.getByRole("tab", { name: "Pagos" }), action: "click" },
    ],
  },
  {
    id: "profesoras",
    title: "Listado de profesoras",
    path: "/profesores",
    steps: [
      {
        target: (page) => page.getByRole("heading", { name: "Profesores" }),
        action: "highlight",
      },
      {
        target: (page) => page.getByRole("button", { name: /acciones para/i }).filter({ visible: true }).first(),
        action: "highlight",
      },
    ],
  },
  {
    id: "ficha-profesora",
    title: "Ficha 360 de profesora",
    path: "/profesores",
    steps: [
      {
        target: (page) => firstProfessorWithClasses(page),
        action: "click",
      },
      {
        target: (page) => page.getByRole("menuitem", { name: /ver ficha 360/i }),
        action: "click",
      },
      { target: (page) => page.getByRole("tab", { name: "Datos" }), action: "click" },
      { target: (page) => page.getByRole("tab", { name: "Perfil" }), action: "click" },
      { target: (page) => page.getByRole("tab", { name: "Licencias" }), action: "click" },
    ],
  },
  {
    id: "licencias",
    title: "Registro de licencias",
    path: "/profesores",
    steps: [
      {
        target: (page) => page.getByRole("button", { name: /acciones para/i }).filter({ visible: true }).first(),
        action: "click",
      },
      {
        target: (page) => page.getByRole("menuitem", { name: /ver ficha 360/i }),
        action: "click",
      },
      { target: (page) => page.getByRole("tab", { name: "Licencias" }), action: "click" },
      { target: (page) => page.getByRole("button", { name: /marcar licencia/i }), action: "click" },
      {
        target: (page) => page.getByLabel(/fecha inicio/i).first(),
        action: "find-license-preview",
      },
      { target: (page) => page.getByRole("button", { name: "Viaje" }), action: "click" },
      { target: (page) => page.getByText(/clases que quedan sin profesora/i), action: "highlight" },
      { target: (page) => page.getByLabel(/buscar suplente/i), action: "click" },
    ],
  },
  {
    id: "clases",
    title: "Detalle de clase y comisión",
    path: "/clases",
    steps: [
      {
        target: (page) => page.getByRole("button", { name: /^Ver .+\(/ }).first(),
        action: "click",
      },
      {
        target: (page) => page.getByRole("dialog").getByText(/inscript|estudiantes/i).first(),
        action: "highlight",
      },
    ],
  },
  {
    id: "inscripciones",
    title: "Nueva inscripción",
    path: "/inscripciones",
    steps: [
      {
        target: (page) => page.getByRole("button", { name: "Nueva inscripción" }),
        action: "click",
      },
      {
        target: (page) => page.getByRole("dialog").getByText(/estudiante|alumna/i).first(),
        action: "highlight",
      },
    ],
  },
  {
    id: "asistencia",
    title: "Toma de asistencia",
    path: "/asistencia",
    steps: [
      {
        target: (page) => page.getByRole("button", { name: /Elegí la clase/ }).filter({ visible: true }).first(),
        action: "choose-first-class",
      },
      {
        target: (page) => page.getByRole("switch").first(),
        action: "highlight",
        optional: true,
      },
    ],
  },
  {
    id: "pagos",
    title: "Consulta de cuotas y pagos",
    path: "/pagos",
    steps: [
      {
        target: (page) => page.getByRole("tab", { name: "Cuotas" }),
        action: "click",
      },
      {
        target: (page) => page.getByRole("button").filter({ hasText: /Debe/ }).first(),
        action: "highlight",
      },
    ],
  },
  { id: "sueldos", title: "Liquidación de sueldos", path: "/sueldos" },
  { id: "evaluaciones", title: "Evaluaciones y notas", path: "/evaluaciones" },
  {
    id: "eventos",
    title: "Eventos",
    path: "/eventos",
    steps: [
      {
        target: (page) => page.getByRole("button", { name: /festival|muestra|examen/i }).first(),
        action: "highlight",
        optional: true,
      },
    ],
  },
  { id: "calendario", title: "Calendario académico", path: "/calendario" },
  { id: "reportes", title: "Reportes", path: "/reportes" },
  {
    id: "configuracion",
    title: "Configuración",
    path: "/configuracion",
  },
  {
    id: "notificaciones",
    title: "Centro de notificaciones",
    path: "/inicio",
    steps: [
      {
        target: (page) => page.getByRole("button", { name: /notificaciones/i }).first(),
        action: "click",
      },
      {
        target: (page) => page.getByRole("dialog", { name: /notificaciones/i }),
        action: "highlight",
      },
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

async function runSteps(page, steps = []) {
  for (const step of steps) {
    const target = await step.target(page);
    if (!(await target.isVisible().catch(() => false))) {
      if (step.optional) continue;
      throw new Error(`No se encontró un control visible del recorrido: ${step.action}.`);
    }
    await moveTo(page, target);

    if (step.action === "click" || step.action === "choose-first-class") {
      await target.click();
    } else if (step.action === "search") {
      await target.fill("Agustina");
      await page.waitForTimeout(900);
      await target.fill("");
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
      }
    }
  }
} finally {
  if (browser) await browser.close();
  await rm(temporaryDir, { recursive: true, force: true });
}
