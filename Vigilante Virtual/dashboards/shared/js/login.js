/* ==========================================================
   Vigilante Virtual · Pantalla de ingreso (MOCKUP)
   Usa window.Auth (shared/js/auth.js).
   ========================================================== */

(function () {
  "use strict";
  const Auth = window.Auth;
  const $ = (s) => document.querySelector(s);
  const params = new URLSearchParams(location.search);

  // Tema guardado (mismo que en los dashboards)
  try { const t = localStorage.getItem("vv-theme"); if (t) document.documentElement.dataset.theme = t; } catch (e) { /* */ }

  const msgBox = $("#msg");
  function msg(text, type = "err") {
    msgBox.hidden = !text;
    msgBox.className = "msg " + type;
    msgBox.textContent = text || "";
  }

  // Solo se aceptan destinos dentro del mismo sitio (evita redirecciones abiertas).
  function safeNext() {
    const n = params.get("next");
    if (!n || !n.startsWith("/") || n.startsWith("//") || /login\.html/.test(n)) return null;
    return n;
  }
  function go(home) { location.replace(safeNext() || home); }

  // Ya hay sesión → directo a su inicio
  const s = Auth.session();
  if (s) { go(Auth.ROLES[s.role].home); return; }

  if (!Auth.cryptoOk()) {
    msg("Este navegador no permite el cifrado necesario abriendo el archivo directo. Abre los dashboards con iniciar.bat (http://localhost:5173).", "warn");
    return;
  }

  // Si existe el archivo local de cuentas de demostración, manda sobre lo guardado en el navegador.
  const LOCAL = !!window.VV_DEMO_ACCOUNTS;
  if (LOCAL) {
    Auth.useLocalAccounts(window.VV_DEMO_ACCOUNTS);
    $("#reset-demo").hidden = true;
  }

  const setupForm = $("#setup-form");
  const loginForm = $("#login-form");

  function show() {
    const configured = Auth.configured();
    setupForm.hidden = configured;
    loginForm.hidden = !configured;
    if (configured) { $("#pass").focus(); updateLock(); }
    else setupForm.querySelector("input").focus();
  }

  /* ---------- Configurar claves ---------- */
  setupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(setupForm);
    const pw = {};
    const names = { vigilante: "Vigilante", admin: "Administrador", general: "Torre de Control" };
    for (const r of ["vigilante", "admin", "general"]) {
      const a = f.get(r), b = f.get(r + "2");
      const p = Auth.passwordProblem(a);
      if (p) { msg(`${names[r]}: ${p}`); return; }
      if (a !== b) { msg(`${names[r]}: las dos claves no coinciden.`); return; }
      pw[r] = a;
    }
    if (new Set(Object.values(pw)).size < 3) { msg("Usa una clave distinta para cada perfil."); return; }
    const btn = setupForm.querySelector("[type=submit]");
    btn.disabled = true;
    await Auth.setup(pw);
    setupForm.reset();
    btn.disabled = false;
    msg("Claves guardadas en este navegador. Ya puedes ingresar.", "ok");
    show();
  });

  /* ---------- Ingresar ---------- */
  let lockTimer = null;
  function updateLock() {
    clearInterval(lockTimer);
    const btn = $("#login-btn");
    const tick = () => {
      const l = Auth.lockInfo();
      if (!l.until) { btn.disabled = false; if (msgBox.dataset.lock) { msg(""); delete msgBox.dataset.lock; } clearInterval(lockTimer); return; }
      const s = Math.max(0, Math.ceil((l.until - Date.now()) / 1000));
      btn.disabled = true;
      msgBox.dataset.lock = "1";
      msg(`Demasiados intentos fallidos. Espera ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} para intentar de nuevo.`);
    };
    tick();
    if (Auth.lockInfo().until) lockTimer = setInterval(tick, 1000);
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const role = new FormData(loginForm).get("role");
    const pass = $("#pass").value;
    if (!pass) { msg("Escribe la clave."); return; }
    const btn = $("#login-btn");
    btn.disabled = true;
    btn.textContent = "Verificando…";
    const r = await Auth.login(role, pass);
    btn.textContent = "Ingresar";
    btn.disabled = false;
    $("#pass").value = "";
    if (r.ok) { go(r.home); return; }
    if (r.locked) { updateLock(); return; }
    msg(r.msg);
    $("#pass").focus();
  });

  $("#toggle-pass").addEventListener("click", (e) => {
    const b = e.currentTarget, i = $("#pass");
    const showing = i.type === "text";
    i.type = showing ? "password" : "text";
    b.setAttribute("aria-pressed", String(!showing));
    b.setAttribute("aria-label", showing ? "Mostrar clave" : "Ocultar clave");
  });

  const resetForm = $("#reset-form");
  $("#reset-demo").addEventListener("click", () => {
    msg("");
    loginForm.hidden = true;
    resetForm.hidden = false;
    $("#reset-pass").focus();
  });
  $("#reset-cancel").addEventListener("click", () => { resetForm.hidden = true; resetForm.reset(); msg(""); show(); });
  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (Auth.lockInfo().until) { resetForm.hidden = true; show(); return; }
    const ok = await Auth.verify("general", $("#reset-pass").value);
    $("#reset-pass").value = "";
    if (!ok) {
      // Los fallos aquí también cuentan para el bloqueo por intentos.
      const f = Auth.failed();
      if (f.until) { resetForm.hidden = true; show(); return; }
      const left = Auth.MAX_FAILS - f.n;
      msg(`Clave de la Torre de Control incorrecta. ${left === 1 ? "Te queda 1 intento" : `Te quedan ${left} intentos`}.`);
      return;
    }
    Auth.resetDemo();
    resetForm.hidden = true;
    msg("Claves borradas. Define unas nuevas.", "warn");
    show();
  });

  if (params.get("salida")) msg("Sesión cerrada.", "ok");
  show();
})();
