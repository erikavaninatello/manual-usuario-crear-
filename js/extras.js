/* Extras del manual: paleta de comandos (Ctrl/⌘ + K), pasos en vivo con el video y simulador «Probalo vos».
   Todo es JavaScript sin librerías y funciona también abriendo index.html con doble clic. */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const norm = s => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMac = /Mac|iPhone|iPad/i.test(navigator.platform || "");
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
  };

  /* ───────────── 1 · SIMULADOR «PROBALO VOS» ───────────── */
  const SIMS = [
    { id: "cobrar", titulo: "Cobrar una cuota", resumen: "Elegí a la familia, el medio de pago y confirmá el cobro.", seccion: "pagos", min: "1 min",
      fin: "Así se cobra una cuota: por familia, con el medio de pago a elección y el recargo ya calculado.",
      pasos: [
        { img: "cobrar-1", texto: "En Cobros, tocá <b>Cobrar</b> en la fila de Camila López.", pista: "Buscá el botón violeta «Cobrar», a la derecha de la primera fila.", hot: [90.2, 43.5, 5.4, 5.5] },
        { img: "cobrar-2", texto: "Elegí el <b>Medio de pago</b>: tocá <b>Transferencia</b>.", pista: "Está debajo de «Cuotas a cobrar», junto a Efectivo y Mercado Pago.", hot: [73.8, 51, 13.2, 5.5] },
        { img: "cobrar-2", texto: "Revisá el importe y confirmá con el botón verde <b>Cobrar $26.250</b>.", pista: "Es el botón verde, abajo del importe.", hot: [63, 69, 35, 5.2] },
      ] },
    { id: "lista", titulo: "Tomar lista", resumen: "Elegí la clase, marcá a quien faltó y guardá la asistencia.", seccion: "asistencia", min: "1 min",
      fin: "Así se toma lista: todas figuran presentes y solo marcás a las que faltaron antes de guardar.",
      pasos: [
        { img: "lista-1", texto: "En la pestaña Asistencia, abrí el selector <b>Comisión</b>.", pista: "Es el campo ancho que dice «Elegí la clase».", hot: [10, 26, 72, 6] },
        { img: "lista-2", texto: "Elegí la primera clase de la lista: <b>Danza Clásica · Avanzado (puntas)</b>.", pista: "Es la primera opción del desplegable.", hot: [10, 35.5, 48, 4.5] },
        { img: "lista-3", texto: "Camila Díaz faltó hoy: tocá su interruptor para marcarla <b>Ausente</b>.", pista: "El interruptor violeta de la primera fila, en «Estado hoy».", hot: [52.3, 50.9, 6.5, 4.8] },
        { img: "lista-4", texto: "Tocá <b>Guardar asistencia</b>.", pista: "Está abajo a la derecha de la planilla.", hot: [85, 90.5, 12, 6.5] },
      ] },
    { id: "alta", titulo: "Agregar estudiante", resumen: "Abrí el formulario, completá los datos y guardá la ficha.", seccion: "alumnos", min: "1 min",
      fin: "Así se da de alta una estudiante: datos obligatorios, grupo familiar si tiene hermanas y Guardar ficha.",
      pasos: [
        { img: "alta-1", texto: "En Estudiantes, tocá <b>Agregar estudiante</b>.", pista: "Es el botón violeta de arriba a la derecha.", hot: [84.5, 11.3, 12.5, 6] },
        { img: "alta-2", texto: "Empezá por el primer dato obligatorio: tocá <b>Nombre</b>.", pista: "Es el primer campo del formulario.", hot: [10.3, 23, 22, 5.7] },
        { img: "alta-2", texto: "Si tiene hermanas ya cargadas, buscá en <b>Grupo familiar</b> para aplicar el descuento.", pista: "Es el campo ancho que dice «Buscar hermanos ya cargados».", hot: [10.3, 59.7, 44, 5.7] },
        { img: "alta-2", texto: "Tocá <b>Guardar ficha</b>.", pista: "Está abajo a la derecha, al lado de Cancelar.", hot: [45, 92.7, 9.5, 5.3] },
      ] },
    { id: "licencia", titulo: "Marcar una licencia", resumen: "Abrí la ficha de una profesora y registrá su ausencia.", seccion: "licencias", min: "2 min",
      fin: "Así se registra una licencia: el sistema te muestra qué clases quedan sin profesora y si hay que buscar suplente.",
      pasos: [
        { img: "lic-1", texto: "En Profesoras, tocá los <b>tres puntos</b> de la tarjeta de Agustina Ríos.", pista: "Están arriba a la derecha de su tarjeta.", hot: [47.8, 20, 4.4, 6] },
        { img: "lic-2", texto: "Elegí <b>Ver ficha</b>.", pista: "Es la primera opción del menú.", hot: [36.5, 25.5, 8.5, 4.8] },
        { img: "lic-3", texto: "En la ficha, entrá a la pestaña <b>Licencias</b>.", pista: "Es la tercera pestaña, junto a Datos y Perfil.", hot: [64.8, 19.5, 8, 5] },
        { img: "lic-4", texto: "Tocá <b>Marcar licencia</b>.", pista: "Es el botón violeta ancho, abajo.", hot: [55.5, 91.2, 42, 5.4] },
        { img: "lic-5", texto: "Elegí el motivo: <b>Viaje</b>.", pista: "Los motivos están en una fila: Examen, Viaje, Enfermedad y Otro.", hot: [40, 47, 10, 5] },
        { img: "lic-5", texto: "Confirmá con <b>Confirmar licencia</b>.", pista: "Es el botón violeta, abajo del cuadro.", hot: [33.5, 68.8, 33, 5.2] },
      ] },
  ];
  const simById = id => SIMS.find(s => s.id === id);
  const stars = n => "★".repeat(n) + "☆".repeat(3 - n);

  const simApp = $("#simApp");
  let cur = null;

  function simHome() {
    cur = null;
    const done = store.get("crear-sim") || {};
    simApp.innerHTML = '<div class="sim-grid">' + SIMS.map(s => {
      const r = done[s.id];
      return `<button class="sim-card" type="button" data-sim="${s.id}">
        <span class="sim-card-tag">${s.min} · ${s.pasos.length} pasos</span>
        <strong>${s.titulo}</strong><span>${s.resumen}</span>
        <em>${r ? "Completada " + stars(r.stars) : "Empezar práctica →"}</em></button>`;
    }).join("") + "</div>";
  }

  function simStart(id) {
    const s = simById(id); if (!s) return;
    cur = { s, i: 0, errores: 0, pistas: 0, busy: false };
    simApp.innerHTML = `<div class="sim-stage">
      <div class="sim-top"><button type="button" class="sim-link" data-act="back">← Todas las prácticas</button><div class="sim-dots" aria-hidden="true"></div></div>
      <div class="sim-task" aria-live="polite"><span class="sim-step-n"></span><p></p></div>
      <div class="sim-screen"><div class="sim-chrome" aria-hidden="true"><i></i><i></i><i></i><span>CREAR · Academia de danza</span></div>
        <div class="sim-view"><img alt="Pantalla del sistema CREAR para practicar" draggable="false"><div class="sim-hot" hidden></div><div class="sim-msg" role="status"></div></div></div>
      <div class="sim-actions"><button type="button" class="sim-btn" data-act="hint">Ver pista</button><button type="button" class="sim-btn ghost" data-act="skip">Hacerlo por mí</button></div></div>`;
    simStep();
    simApp.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  function simStep() {
    const { s, i } = cur, p = s.pasos[i];
    $(".sim-step-n", simApp).textContent = `Paso ${i + 1} de ${s.pasos.length}`;
    $(".sim-task p", simApp).innerHTML = p.texto;
    $(".sim-dots", simApp).innerHTML = s.pasos.map((_, k) => `<i class="${k < i ? "ok" : k === i ? "on" : ""}"></i>`).join("");
    const img = $(".sim-view img", simApp);
    img.src = `assets/sim/${p.img}.jpg`;
    const hot = $(".sim-hot", simApp); hot.hidden = true; hot.classList.remove("show");
    $(".sim-msg", simApp).textContent = "";
    cur.busy = false;
  }

  function simAdvance(auto) {
    if (cur.busy) return; cur.busy = true;
    const view = $(".sim-view", simApp), hot = $(".sim-hot", simApp), p = cur.s.pasos[cur.i];
    hot.style.cssText = `left:${p.hot[0]}%;top:${p.hot[1]}%;width:${p.hot[2]}%;height:${p.hot[3]}%`;
    hot.hidden = false; hot.className = "sim-hot ok";
    $(".sim-msg", simApp).textContent = "¡Bien!";
    setTimeout(() => {
      if (cur.i < cur.s.pasos.length - 1) { cur.i++; view.classList.add("swap"); simStep(); setTimeout(() => view.classList.remove("swap"), 20); }
      else simFinish();
    }, reduce ? 150 : 650);
  }

  function simFinish() {
    const { s, errores, pistas } = cur;
    const n = errores === 0 && pistas === 0 ? 3 : errores + pistas <= 2 ? 2 : 1;
    const done = store.get("crear-sim") || {}; if (!done[s.id] || done[s.id].stars < n) done[s.id] = { stars: n }; store.set("crear-sim", done);
    const sig = SIMS[(SIMS.indexOf(s) + 1) % SIMS.length];
    simApp.innerHTML = `<div class="sim-end"><img src="assets/images/tina.png" alt="" class="sim-tina">
      <h3>¡Listo, lo lograste!</h3><div class="sim-stars" aria-label="${n} de 3 estrellas">${stars(n)}</div>
      <p>${s.fin}</p><p class="sim-stats">${errores} ${errores === 1 ? "error" : "errores"} · ${pistas} ${pistas === 1 ? "pista" : "pistas"}</p>
      <div class="sim-actions"><button class="sim-btn" data-sim="${s.id}">Repetir</button><button class="sim-btn" data-sim="${sig.id}">Siguiente: ${sig.titulo}</button>
      <button class="sim-btn ghost" data-go="${s.seccion}">Ver el paso a paso</button></div></div>`;
    if (!reduce) confetti();
  }

  function confetti() {
    const box = document.createElement("div"); box.className = "sim-confetti"; box.setAttribute("aria-hidden", "true");
    const cols = ["#60427f", "#a98bd2", "#c8745a", "#e9c47a", "#267047"];
    for (let k = 0; k < 28; k++) {
      const e = document.createElement("i");
      e.style.cssText = `left:${Math.random() * 100}%;background:${cols[k % cols.length]};animation-delay:${Math.random() * .4}s;animation-duration:${1.6 + Math.random() * 1.2}s;transform:rotate(${Math.random() * 360}deg)`;
      box.appendChild(e);
    }
    document.body.appendChild(box); setTimeout(() => box.remove(), 3200);
  }

  if (simApp) {
    simHome();
    simApp.addEventListener("click", ev => {
      const t = ev.target.closest("[data-sim],[data-act],[data-go],.sim-view"); if (!t) return;
      if (t.dataset.sim) return simStart(t.dataset.sim);
      if (t.dataset.go) return showSection(t.dataset.go);
      if (t.dataset.act === "back") return simHome();
      if (!cur) return;
      if (t.dataset.act === "hint") {
        const p = cur.s.pasos[cur.i], hot = $(".sim-hot", simApp); cur.pistas++;
        hot.style.cssText = `left:${p.hot[0]}%;top:${p.hot[1]}%;width:${p.hot[2]}%;height:${p.hot[3]}%`;
        hot.hidden = false; hot.className = "sim-hot show"; $(".sim-msg", simApp).textContent = p.pista;
        return setTimeout(() => { if (cur && !cur.busy) { hot.classList.remove("show"); hot.hidden = true; } }, 2600);
      }
      if (t.dataset.act === "skip") { cur.pistas++; return simAdvance(true); }
      if (t.classList.contains("sim-view") && !cur.busy) {
        const r = t.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * 100, y = (ev.clientY - r.top) / r.height * 100;
        const [l, tp, w, h] = cur.s.pasos[cur.i].hot, m = 0.8;
        if (x >= l - m && x <= l + w + m && y >= tp - m && y <= tp + h + m) {
          const dot = document.createElement("span"); dot.className = "sim-ripple"; dot.style.cssText = `left:${x}%;top:${y}%`; t.appendChild(dot); setTimeout(() => dot.remove(), 700);
          simAdvance(false);
        } else {
          cur.errores++; t.classList.remove("miss"); void t.offsetWidth; t.classList.add("miss");
          $(".sim-msg", simApp).textContent = "Ahí no. Probá de nuevo o tocá «Ver pista».";
        }
      }
    });
  }
  // Atajos «Probalo vos» desde otras secciones y desde la paleta.
  document.addEventListener("click", ev => {
    const b = ev.target.closest(".sim-cta"); if (!b) return;
    showSection("practica"); simStart(b.dataset.sim); window.scrollTo(0, 0);
  });

  /* ───────────── 2 · PALETA DE COMANDOS (Ctrl/⌘ + K) ───────────── */
  const SYN = {
    "inicio-nav": "login contrasena clave correo entrar ingresar atajos teclado inicio rapido invitacion",
    dashboard: "resumen hoy cumpleanos pendiente festival cobrado avisar whatsapp",
    alumnos: "alumnas alumnos estudiantes alta agregar buscar dni baja hermanas familia",
    "ficha-medica": "salud apto fisico medico documentos familia ficha 360",
    profesores: "docentes profesoras plantel ficha perfil",
    licencias: "ausencia suplente suplencia licencia viaje enfermedad",
    clases: "comisiones horarios cupos lugares libres disciplinas niveles precios",
    inscripciones: "inscribir anotar espera lista de espera cupo nueva inscripcion",
    asistencia: "lista presente ausente faltas pasar lista asistencia baja 75",
    pagos: "cuotas cobrar plata deuda mora recargo matricula efectivo transferencia mercado pago vencidas familias",
    sueldos: "liquidacion pago personal profesoras recibo aprobar",
    evaluaciones: "notas examen tecnica ritmo expresion certificado libreta promedio",
    eventos: "festival muestra funciones entradas salas",
    calendario: "agenda dia semana mes feriados cumpleanos",
    reportes: "morosidad ocupacion excel pdf descargar informes",
    notificaciones: "campana avisos alertas leidas",
    configuracion: "usuarios personal accesos aranceles criterios institucion roles contrasena",
    faq: "preguntas dudas ayuda soporte manual",
    practica: "simulador practicar probar ensayar entrenar jugar capacitacion",
  };
  let index = null;
  function buildIndex() {
    index = [];
    $$(".section").forEach(sec => {
      const id = sec.id.replace("sec-", ""), nav = $(`.nav-item[data-section="${id}"]`);
      const title = (nav && nav.textContent.trim()) || ($(".page-title", sec) || {}).textContent || id;
      index.push({ kind: "Sección", title, sec: id, text: norm(title + " " + (SYN[id] || "")), w: 3 });
      $$(".steps li", sec).forEach(li => index.push({ kind: "Paso", title: li.textContent.trim(), ctx: title, sec: id, el: li, text: norm(li.textContent + " " + title), w: 1 }));
      $$(".subhead", sec).forEach(h => index.push({ kind: "Tema", title: h.textContent.trim(), ctx: title, sec: id, el: h, text: norm(h.textContent + " " + title), w: 2 }));
      $$(".faq-q", sec).forEach(q => index.push({ kind: "Pregunta", title: q.textContent.trim(), ctx: title, sec: id, el: q, text: norm(q.textContent), w: 2 }));
    });
    SIMS.forEach(s => index.push({ kind: "Práctica", title: "Practicar: " + s.titulo, ctx: "Probalo vos", sim: s.id, text: norm("practicar simulador " + s.titulo + " " + s.resumen), w: 4 }));
  }

  const pal = document.createElement("div");
  pal.className = "pal"; pal.hidden = true; pal.setAttribute("role", "dialog"); pal.setAttribute("aria-modal", "true"); pal.setAttribute("aria-label", "Buscar en el manual");
  pal.innerHTML = `<div class="pal-box"><div class="pal-input"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
    <input type="text" placeholder="Buscá una tarea: cobrar, licencia, tomar lista…" aria-label="Buscar en el manual" autocomplete="off" spellcheck="false"><kbd>Esc</kbd></div>
    <ul class="pal-list" role="listbox"></ul><div class="pal-foot"><span><kbd>↑</kbd><kbd>↓</kbd> moverte</span><span><kbd>Enter</kbd> abrir</span><span><kbd>${isMac ? "⌘" : "Ctrl"}</kbd><kbd>K</kbd> abrir en cualquier momento</span></div></div>`;
  document.body.appendChild(pal);
  const pin = $("input", pal), plist = $(".pal-list", pal);
  let results = [], sel = 0;

  function search(q) {
    if (!index) buildIndex();
    const t = norm(q).split(" ").filter(Boolean);
    if (!t.length) {
      const sug = [...SIMS.map(s => index.find(x => x.sim === s.id)), ...["pagos", "asistencia", "alumnos", "licencias", "configuracion"].map(id => index.find(x => x.kind === "Sección" && x.sec === id))];
      return sug.filter(Boolean);
    }
    return index.map(it => {
      if (!t.every(w => it.text.includes(w))) return null;
      const starts = t.every(w => it.text.split(" ").some(p => p.startsWith(w)));
      return { it, score: it.w * 10 + (starts ? 6 : 0) - Math.min(it.title.length, 90) / 30 };
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 9).map(r => r.it);
  }
  function mark(text, q) {
    const esc = s => s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const t = norm(q).split(" ").filter(Boolean); if (!t.length) return esc(text);
    const n = norm(text); if (n.length !== text.length) return esc(text);
    const ranges = [];
    t.forEach(w => { let i = n.indexOf(w); while (i > -1) { ranges.push([i, i + w.length]); i = n.indexOf(w, i + w.length); } });
    ranges.sort((a, b) => a[0] - b[0]);
    let out = "", pos = 0; ranges.forEach(([a, b]) => { if (a < pos) return; out += esc(text.slice(pos, a)) + "<mark>" + esc(text.slice(a, b)) + "</mark>"; pos = b; });
    return out + esc(text.slice(pos));
  }
  function render() {
    results = search(pin.value);
    if (sel >= results.length) sel = 0;
    plist.innerHTML = results.length ? results.map((r, i) => `<li role="option" data-i="${i}" class="${i === sel ? "on" : ""}" aria-selected="${i === sel}">
      <span class="pal-kind">${r.kind}</span><span class="pal-title">${mark(r.title.length > 110 ? r.title.slice(0, 107) + "…" : r.title, pin.value)}</span>${r.ctx ? `<span class="pal-ctx">${r.ctx}</span>` : ""}</li>`).join("")
      : `<li class="pal-empty">No encontré nada para «${pin.value.replace(/[<>&]/g, "")}». Probá con otra palabra o preguntale a Tina.</li>`;
    const on = $(".on", plist); if (on) on.scrollIntoView({ block: "nearest" });
  }
  function openPal() { if (!index) buildIndex(); pal.hidden = false; pin.value = ""; sel = 0; render(); document.body.classList.add("pal-open"); setTimeout(() => pin.focus(), 0); }
  function closePal() { pal.hidden = true; document.body.classList.remove("pal-open"); }
  function go(r) {
    if (!r) return; closePal();
    if (r.sim) { showSection("practica"); simStart(r.sim); return; }
    showSection(r.sec);
    if (r.el) setTimeout(() => {
      if (r.el.tagName === "SUMMARY" && r.el.parentElement) r.el.parentElement.open = true;
      r.el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      r.el.classList.remove("pal-flash"); void r.el.offsetWidth; r.el.classList.add("pal-flash");
    }, 60);
  }
  pin.addEventListener("input", () => { sel = 0; render(); });
  pin.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % Math.max(results.length, 1); render(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + results.length) % Math.max(results.length, 1); render(); }
    else if (e.key === "Enter") { e.preventDefault(); go(results[sel]); }
  });
  plist.addEventListener("click", e => { const li = e.target.closest("li[data-i]"); if (li) go(results[+li.dataset.i]); });
  pal.addEventListener("mousedown", e => { if (e.target === pal) closePal(); });
  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); pal.hidden ? openPal() : closePal(); }
    else if (e.key === "Escape" && !pal.hidden) { e.preventDefault(); e.stopPropagation(); closePal(); }
  }, true);
  // El buscador de la barra superior (y la tecla «/») abren la paleta.
  const si = $("#searchInput");
  if (si) {
    si.addEventListener("focus", () => { si.blur(); openPal(); });
    const hint = $(".search-hint"); if (hint) hint.textContent = isMac ? "⌘K" : "Ctrl K";
  }

  /* ───────────── 3 · PASOS EN VIVO JUNTO AL VIDEO ───────────── */
  function linkSteps() {
    $$(".section").forEach(sec => {
      const kids = $$("figure.shot[data-demo-clip], ol.steps", sec);
      kids.forEach((el, idx) => {
        if (!el.matches("ol.steps")) return;
        const next = kids[idx + 1], prev = kids[idx - 1];
        let fig = next && next.matches("figure.shot") ? next : prev && prev.matches("figure.shot") ? prev : null;
        if (fig && fig.dataset.liveSteps) fig = prev && prev.matches("figure.shot") && !prev.dataset.liveSteps ? prev : null;
        if (fig) attachLive(fig, el);
      });
    });
  }
  function attachLive(fig, ol) {
    const video = $("video.demo-video", fig), items = $$(":scope > li", ol); if (!video || items.length < 2) return;
    fig.dataset.liveSteps = "1";
    const bar = document.createElement("div"); bar.className = "live-bar";
    bar.innerHTML = items.map((_, i) => `<button type="button" class="live-seg" data-i="${i}" aria-label="Ir al paso ${i + 1}"><span>${i + 1}</span><u></u></button>`).join("");
    fig.insertBefore(bar, $("figcaption", fig));
    const segs = $$(".live-seg", bar); let active = -1;
    const paint = () => {
      const d = video.duration; if (!d || !isFinite(d)) return;
      const p = Math.min(video.currentTime / d, 0.9999), n = items.length, k = Math.floor(p * n);
      segs.forEach((s, i) => { s.firstElementChild.nextElementSibling.style.width = (i < k ? 100 : i === k ? (p * n - k) * 100 : 0) + "%"; s.classList.toggle("done", i < k); });
      if (k !== active) { active = k; items.forEach((li, i) => li.classList.toggle("live-on", i === k && !video.paused)); }
    };
    video.addEventListener("timeupdate", paint);
    video.addEventListener("play", () => { fig.classList.add("is-live"); paint(); });
    video.addEventListener("pause", () => { items.forEach(li => li.classList.remove("live-on")); active = -1; });
    video.addEventListener("ended", () => { items.forEach(li => li.classList.remove("live-on")); });
    bar.addEventListener("click", e => {
      const s = e.target.closest(".live-seg"); if (!s || !video.duration) return;
      video.currentTime = video.duration * (+s.dataset.i / items.length) + 0.05; video.play().catch(() => {}); paint();
    });
    items.forEach((li, i) => { li.classList.add("live-li"); li.addEventListener("click", () => { if (video.duration) { video.currentTime = video.duration * (i / items.length) + 0.05; video.play().catch(() => {}); } }); });
  }
  linkSteps();

  /* ───────────── 4 · ENTRADA SUAVE AL HACER SCROLL ───────────── */
  if (!reduce && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
    $$(".section .steps li, .section .callout, .section figure.shot, .section .field-table, .task, .role-row, .sim-card").forEach((el, i) => { el.classList.add("rv"); el.style.setProperty("--d", (i % 4) * 60 + "ms"); io.observe(el); });
  }
})();
