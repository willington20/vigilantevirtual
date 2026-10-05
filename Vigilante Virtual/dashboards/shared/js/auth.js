/* ==========================================================
   Vigilante Virtual · Sesión y acceso por rol (MOCKUP)
   ----------------------------------------------------------
   Se carga en el <head> de TODAS las páginas, antes que el resto.
   - Si no hay sesión válida → redirige a login.html.
   - Si el rol no tiene acceso a ese dashboard → redirige a su inicio.
   - Agrega "Cambiar de dashboard" y "Salir" a la barra superior.

   IMPORTANTE: esto es una maqueta del flujo de ingreso. Un control
   hecho solo en el navegador NO es seguridad real: cualquiera con
   acceso a los archivos puede saltarlo. En producción la clave, el
   segundo factor (MFA), los roles y la sesión los valida el
   backend (JWT + MFA + roles) y cada API rechaza a quien no tenga
   permiso. Ver los puntos marcados "INTEGRACIÓN".

   No hay claves en el código ni en el repositorio: la primera vez,
   quien hace la demostración define las claves en SU navegador y
   solo se guarda un hash PBKDF2 con sal (localStorage).
   ========================================================== */

(function () {
  "use strict";

  const ROLES = {
    vigilante: { label: "Vigilante",               home: "vigilante/index.html", areas: ["vigilante"] },
    admin:     { label: "Administrador del sitio", home: "admin/index.html",     areas: ["admin"] },
    general:   { label: "Torre de Control",        home: "index.html",           areas: ["vigilante", "admin", "general", "hub"] }
  };
  const SESSION_KEY  = "vv-session";
  const ACCOUNTS_KEY = "vv-demo-accounts";
  const FAILS_KEY    = "vv-login-fails";
  const SESSION_HOURS = 8;          // un turno
  const MAX_FAILS = 5;              // intentos antes de bloquear
  const LOCK_MINUTES = 5;
  const WEAK = ["2002", "1234", "9999", "0000", "12345678", "password", "contraseña", "admin", "vigilante"];

  /* ---------- Dónde estamos ---------- */
  const seg = location.pathname.split("/").filter(Boolean);
  const folder = seg.length >= 2 ? seg[seg.length - 2] : "";
  const AREA = ["vigilante", "admin", "general"].includes(folder) ? folder : "hub";
  const ROOT = AREA === "hub" ? "" : "../";
  const IS_LOGIN = /login\.html$/.test(location.pathname);

  /* ---------- Almacenamiento seguro ante errores ---------- */
  const ls = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* */ } }
  };
  const ss = {
    get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* */ } },
    del(k) { try { sessionStorage.removeItem(k); } catch (e) { /* */ } }
  };

  /* ---------- Sesión ---------- */
  function session() {
    const s = ss.get(SESSION_KEY);
    if (!s || !ROLES[s.role] || Date.now() > s.exp) { ss.del(SESSION_KEY); return null; }
    return s;
  }
  function canAccess(role, area) { return !!ROLES[role] && ROLES[role].areas.includes(area); }

  /* ---------- Guardia: corre ya, antes de pintar la página ---------- */
  if (!IS_LOGIN) {
    const s = session();
    if (!s) {
      document.documentElement.style.visibility = "hidden";
      location.replace(ROOT + "login.html?next=" + encodeURIComponent(location.pathname + location.search));
      return;
    }
    if (!canAccess(s.role, AREA)) {
      document.documentElement.style.visibility = "hidden";
      location.replace(ROOT + ROLES[s.role].home + "?denegado=" + AREA);
      return;
    }
  }

  /* ---------- Criptografía (PBKDF2-SHA-256 con sal) ---------- */
  const b64e = (u8) => btoa(String.fromCharCode(...u8));
  const b64d = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  function cryptoOk() { return !!(window.crypto && crypto.subtle); }
  async function derive(pass, saltB64) {
    const salt = saltB64 ? b64d(saltB64) : crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256" }, key, 256);
    return { salt: b64e(salt), hash: b64e(new Uint8Array(bits)) };
  }
  function sameHash(a, b) {
    if (a.length !== b.length) return false;
    let d = 0;
    for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return d === 0;
  }

  /* ---------- Reglas de clave ---------- */
  function passwordProblem(p) {
    if (!p || p.length < 8) return "Debe tener al menos 8 caracteres.";
    if (WEAK.includes(p.toLowerCase())) return "Esa clave es de prueba o muy común. Usa otra.";
    if (/^\d+$/.test(p)) return "No uses solo números.";
    if (!/[A-Za-zÁÉÍÓÚáéíóúñÑ]/.test(p) || !/\d/.test(p)) return "Combina letras y números.";
    return "";
  }

  /* ---------- Intentos fallidos ---------- */
  function lockInfo() {
    const f = ls.get(FAILS_KEY) || { n: 0, until: 0 };
    if (f.until && Date.now() > f.until) { ls.del(FAILS_KEY); return { n: 0, until: 0 }; }
    return f;
  }
  function registerFail() {
    const f = lockInfo();
    f.n += 1;
    if (f.n >= MAX_FAILS) f.until = Date.now() + LOCK_MINUTES * 60000;
    ls.set(FAILS_KEY, f);
    // INTEGRACIÓN: el backend cuenta los intentos por usuario e IP y los registra en auditoría.
    return f;
  }

  /* ---------- API pública ---------- */
  const Auth = {
    ROLES, AREA, ROOT, MAX_FAILS, LOCK_MINUTES,
    session, canAccess, lockInfo, passwordProblem, cryptoOk,
    failed: registerFail,

    configured() { const a = ls.get(ACCOUNTS_KEY); return !!(a && a.vigilante && a.admin && a.general); },

    async setup(passwords) {
      // passwords: { vigilante, admin, general }
      const out = {};
      for (const role of Object.keys(ROLES)) out[role] = await derive(passwords[role]);
      ls.set(ACCOUNTS_KEY, out);
    },

    // Carga las cuentas del archivo local demo-accounts.local.js (solo hashes).
    // Devuelve true si cambiaron respecto a las guardadas en el navegador.
    useLocalAccounts(acc) {
      if (!acc || !acc.vigilante || !acc.admin || !acc.general) return false;
      const changed = JSON.stringify(ls.get(ACCOUNTS_KEY)) !== JSON.stringify(acc);
      if (changed) { ls.set(ACCOUNTS_KEY, acc); ls.del(FAILS_KEY); }
      return changed;
    },

    resetDemo() { ls.del(ACCOUNTS_KEY); ls.del(FAILS_KEY); ss.del(SESSION_KEY); },

    // Comprueba una clave sin abrir sesión (lo usa también "restablecer").
    async verify(role, pass) {
      const acc = (ls.get(ACCOUNTS_KEY) || {})[role];
      if (!acc || !pass) return false;
      const { hash } = await derive(pass, acc.salt);
      return sameHash(hash, acc.hash);
    },

    async login(role, pass) {
      // INTEGRACIÓN: POST /auth/login → valida clave + MFA en el servidor y entrega un JWT de corta duración.
      const lock = lockInfo();
      if (lock.until) return { ok: false, locked: true, until: lock.until };
      if (!(ls.get(ACCOUNTS_KEY) || {})[role]) return { ok: false, msg: "Perfil no configurado." };
      if (!(await Auth.verify(role, pass))) {
        const f = registerFail();
        return f.until
          ? { ok: false, locked: true, until: f.until }
          : { ok: false, msg: `Clave incorrecta. ${MAX_FAILS - f.n === 1 ? "Te queda 1 intento" : `Te quedan ${MAX_FAILS - f.n} intentos`}.` };
      }
      ls.del(FAILS_KEY);
      ss.set(SESSION_KEY, { role, start: Date.now(), exp: Date.now() + SESSION_HOURS * 3600000 });
      return { ok: true, home: ROLES[role].home };
    },

    logout() {
      // INTEGRACIÓN: invalidar el token en el servidor.
      ss.del(SESSION_KEY);
      location.replace(ROOT + "login.html?salida=1");
    }
  };
  window.Auth = Auth;

  /* ---------- Controles en la barra superior ---------- */
  if (!IS_LOGIN) {
    document.addEventListener("DOMContentLoaded", () => {
      const s = session();
      const bar = document.querySelector(".topbar");
      if (!s || !bar) return;
      const box = document.createElement("div");
      box.className = "row";
      box.style.flexWrap = "nowrap";
      if (s.role === "general" && AREA !== "hub") {
        const a = document.createElement("a");
        a.className = "btn btn-sm btn-ghost";
        a.href = ROOT + "index.html";
        a.title = "Ir al panel de dashboards";
        a.innerHTML = '<svg class="icon icon-sm" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg><span class="hide-sm">Dashboards</span>';
        box.appendChild(a);
      }
      const out = document.createElement("button");
      out.type = "button";
      out.className = "btn btn-sm btn-ghost";
      out.title = "Cerrar sesión";
      out.innerHTML = '<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg><span class="hide-sm">Salir</span>';
      out.addEventListener("click", () => Auth.logout());
      box.appendChild(out);
      const user = bar.querySelector(".topbar-user");
      bar.insertBefore(box, user || null);

      // Aviso si llegó aquí por intentar entrar a un dashboard sin permiso
      const den = new URLSearchParams(location.search).get("denegado");
      if (den) {
        const msg = document.createElement("div");
        msg.className = "notice notice-warn";
        msg.style.marginBottom = "16px";
        msg.textContent = "Tu perfil no tiene acceso a ese dashboard. Te trajimos a tu inicio.";
        const main = document.querySelector(".main");
        if (main) main.prepend(msg);
      }
    });
  }
})();
