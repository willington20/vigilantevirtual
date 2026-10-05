/* ==========================================================
   Vigilante Virtual · Dashboard general (jefe mayor / Torre)
   ----------------------------------------------------------
   MOCKUP: datos de demostración. En producción todo llega del
   backend multi-cliente (cada sitio con sus datos separados).
   Los puntos marcados "INTEGRACIÓN" son donde se conecta.
   Depende de ../shared/js/ui.js (window.UI).
   ========================================================== */

(function () {
  "use strict";
  const { $, $$, toast, hhmm } = window.UI;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ME = "M. Herrera";

  /* ---------- Sitios (INTEGRACIÓN: GET /sitios) ---------- */
  const STATE = {
    ok:           { label: "En línea",       badge: "badge-ok" },
    degradado:    { label: "Degradado",      badge: "badge-warn" },
    contingencia: { label: "Sin internet · contingencia", badge: "badge-danger" },
    piloto:       { label: "Piloto · modo sombra", badge: "badge-info" }
  };

  const SITES = [
    {
      id: "paramericana", name: "Bodega Paramericana", client: "Paramericana S.A.S.", type: "Oficinas o bodegas",
      mode: "Vigilante humano", state: "ok", guard: "Carlos Ríos (mañana)", ingresos: 47, alerts: 3, equipos: "7/8",
      note: "1 cámara sin señal (Pasillo B)",
      requests: [["Laura Gómez", "Oficina de compras", "Kiosco", "10:12"], ["Jorge Pérez", "Muelle de carga 1", "Videoportero", "10:15"], ["Ana María Torres", "Recursos humanos", "Kiosco", "10:18"]],
      alertList: [["alta", "Persona merodeando el perímetro", "Argos · Perímetro oriental", "10:16", true], ["media", "Puerta del muelle abierta más de 3 min", "Sensor · Muelle 1", "10:09", false], ["baja", "Cámara Pasillo B sin señal", "Validación de equipos", "09:42", false]],
      cams: [["Entrada principal", true], ["Videoportero externo", true], ["Kiosco Paramericana-01", true], ["Pasillo B", false]],
      access: [["10:11", "Diana Castro", "Rostro", "ok", "Permitido"], ["10:07", "Desconocido", "QR", "danger", "QR vencido"], ["09:58", "Camila Ruiz", "Videollamada", "ok", "Aprobado por portería"]],
      config: { destinos: 7, personal: 8, vigilantes: 4, retencion: "Fotos 15 días · video 30 días", argos: "Automáticas activas · escala a los 2 min", tipoDest: "Oficinas, bodegas y muelles" },
      doors: [["Puerta principal", "Fail-safe", "Ruta de evacuación"], ["Portón vehicular", "Fail-safe", ""], ["Cuarto de alto valor", "Fail-secure", ""], ["Puerta del muelle 1", "Fail-secure", ""]]
    },
    {
      id: "andina-norte", name: "Universidad Andina · Sede Norte", client: "Universidad Andina", type: "Universidad",
      mode: "IA + soporte PGD", state: "contingencia", guard: "Argos (IA) · soporte PGD", ingresos: 812, alerts: 1, equipos: "14/16",
      note: "Sin internet desde 09:55 · el hub abre con la lista local y guarda los ingresos en cola",
      requests: [["Visitante sin nombre", "Facultad de Ingeniería", "Kiosco", "10:20"]],
      alertList: [["alta", "Sitio sin conexión a internet", "Validación de equipos", "09:55", true]],
      cams: [["Acceso peatonal 1", true], ["Acceso peatonal 2", true], ["Biblioteca", false], ["Parqueadero", true]],
      access: [["10:19", "Estudiante ••••221", "Rostro (local)", "ok", "Permitido · en cola"], ["10:18", "Docente ••••870", "Tarjeta (local)", "ok", "Permitido · en cola"]],
      config: { destinos: 42, personal: 9120, vigilantes: 2, retencion: "Fotos 7 días · video 30 días", argos: "Automáticas activas · escala a los 2 min", tipoDest: "Facultades y edificios" },
      doors: [["Torniquete norte", "Fail-safe", "Ruta de evacuación"], ["Torniquete sur", "Fail-safe", "Ruta de evacuación"], ["Laboratorios", "Fail-secure", ""]]
    },
    {
      id: "andina-centro", name: "Universidad Andina · Sede Centro", client: "Universidad Andina", type: "Universidad",
      mode: "IA + soporte PGD", state: "ok", guard: "Argos (IA) · soporte PGD", ingresos: 640, alerts: 0, equipos: "12/12",
      note: "Todo en orden",
      requests: [], alertList: [],
      cams: [["Acceso principal", true], ["Plazoleta", true], ["Auditorio", true], ["Parqueadero", true]],
      access: [["10:20", "Estudiante ••••502", "QR", "ok", "Permitido"], ["10:19", "Visitante", "Videollamada", "ok", "Aprobado por PGD"]],
      config: { destinos: 28, personal: 6480, vigilantes: 1, retencion: "Fotos 7 días · video 30 días", argos: "Automáticas activas · escala a los 2 min", tipoDest: "Facultades y edificios" },
      doors: [["Acceso principal", "Fail-safe", "Ruta de evacuación"], ["Archivo", "Fail-secure", ""]]
    },
    {
      id: "robles", name: "Conjunto Los Robles", client: "Copropiedad Los Robles", type: "Residencia",
      mode: "Vigilante humano", state: "ok", guard: "Fabio Suárez (mañana)", ingresos: 133, alerts: 2, equipos: "9/9",
      note: "Alerta escalada: puerta forzada en Torre 3",
      requests: [["Domicilio", "Torre 2 · Apto 504", "Videoportero", "10:17"]],
      alertList: [["alta", "Puerta forzada · Torre 3", "Sensor de puerta", "10:04", true], ["media", "Persona en zona común fuera de horario", "Argos · Piscina", "09:30", false]],
      cams: [["Portería", true], ["Torre 3 · hall", true], ["Parqueadero", true], ["Piscina", true]],
      access: [["10:15", "Residente T1-302", "Rostro", "ok", "Permitido"], ["10:04", "—", "—", "danger", "Puerta forzada"]],
      config: { destinos: 120, personal: 410, vigilantes: 3, retencion: "Fotos 15 días · video 30 días", argos: "Automáticas activas · escala a los 2 min", tipoDest: "Torres y apartamentos" },
      doors: [["Portería peatonal", "Fail-safe", "Ruta de evacuación"], ["Torre 3", "Fail-safe", "Ruta de evacuación"]]
    },
    {
      id: "logistica-sur", name: "Logística del Sur · Bodega 2", client: "Logística del Sur", type: "Oficinas o bodegas",
      mode: "IA + soporte PGD", state: "degradado", guard: "Argos (IA) · soporte PGD", ingresos: 58, alerts: 1, equipos: "6/7",
      note: "Videoportero sin respuesta desde 09:31 · entran por kiosco y tarjeta",
      requests: [], alertList: [["media", "Videoportero no responde", "Validación de equipos", "09:31", true]],
      cams: [["Entrada", true], ["Videoportero", false], ["Muelle", true], ["Patio", true]],
      access: [["10:10", "Operario ••••118", "Tarjeta", "ok", "Permitido"]],
      config: { destinos: 6, personal: 64, vigilantes: 0, retencion: "Fotos 15 días · video 30 días", argos: "Automáticas activas · escala a los 2 min", tipoDest: "Bodegas y muelles" },
      doors: [["Entrada", "Fail-safe", "Ruta de evacuación"], ["Bodega de químicos", "Fail-secure", ""]]
    },
    {
      id: "torres-parque", name: "Torres del Parque", client: "Torres del Parque P.H.", type: "Residencia",
      mode: "Vigilante humano", state: "piloto", guard: "Equipo PGD (piloto)", ingresos: 74, alerts: 0, equipos: "5/5",
      note: "Modo sombra: el sistema registra pero la puerta sigue con el método actual",
      requests: [], alertList: [],
      cams: [["Portería", true], ["Lobby", true], ["Parqueadero", true], ["Shut de basuras", true]],
      access: [["10:12", "Residente ••••44", "Rostro", "ok", "Coincide con el método actual"]],
      config: { destinos: 96, personal: 300, vigilantes: 2, retencion: "Por definir", argos: "Solo registra (modo sombra)", tipoDest: "Torres y apartamentos" },
      doors: [["Portería", "Fail-safe", "Ruta de evacuación"]]
    }
  ];

  /* ---------- Vista de un sitio (sitio.html) ---------- */
  function initSiteView() {
    const root = $("#site-view");
    if (!root) return;
    const sel = $("#site-select");
    sel.innerHTML = SITES.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("");
    const params = new URLSearchParams(location.search);

    function render(id) {
      const s = SITES.find((x) => x.id === id) || SITES[0];
      sel.value = s.id;
      const st = STATE[s.state];
      $("#site-name").textContent = s.name;
      $("#site-sub").textContent = `${s.client} · ${s.type} · ${s.mode}`;
      $("#site-state").className = "badge " + st.badge;
      $("#site-state").textContent = st.label;
      $("#site-note").textContent = s.note;

      $("#site-kpis").innerHTML = `
        <div class="card kpi"><div class="kpi-label">Ingresos hoy</div><div class="kpi-value">${s.ingresos}</div></div>
        <div class="card kpi ${s.alerts ? "is-alert" : ""}"><div class="kpi-label">Alertas abiertas</div><div class="kpi-value">${s.alerts}</div></div>
        <div class="card kpi"><div class="kpi-label">Equipos en línea</div><div class="kpi-value">${s.equipos}</div></div>
        <div class="card kpi"><div class="kpi-label">En la portería</div><div class="kpi-value" style="font-size:var(--fs-md);margin-top:10px">${esc(s.guard)}</div></div>`;

      $("#site-requests").innerHTML = s.requests.length
        ? s.requests.map(([n, d, o, h]) => `<li class="setting"><div class="setting-text"><strong>${esc(n)}</strong><span>→ ${esc(d)} · ${esc(o)} · ${h}</span></div><span class="badge badge-warn">Esperando</span></li>`).join("")
        : '<li class="empty">Sin solicitudes pendientes</li>';

      $("#site-alerts").innerHTML = s.alertList.length
        ? s.alertList.map(([sev, t, o, h, esc_]) => `
          <li class="incident" data-sev="${sev}">
            <div class="incident-top"><div><p class="incident-title">${esc(t)}</p><div class="incident-meta"><span>${esc(o)}</span><span class="mono">${h}</span></div></div>
            ${esc_ ? '<span class="badge badge-danger">Escalada a la Torre</span>' : '<span class="badge badge-warn">En el puesto</span>'}</div>
          </li>`).join("")
        : '<li class="empty">Sin alertas abiertas</li>';

      $("#site-cams").innerHTML = s.cams.map(([n, on]) => `
        <div class="video ${on ? "" : "is-offline"}"><div class="video-feed"></div>
          <div class="video-offline">Sin señal</div>
          <span class="video-tag ${on ? "live" : ""}">${on ? "● EN VIVO" : "SIN SEÑAL"}</span>
          <div class="video-label"><span>${esc(n)}</span></div></div>`).join("");

      $("#site-access").innerHTML = s.access.map(([h, p, m, k, r]) =>
        `<tr><td class="mono">${h}</td><td>${esc(p)}</td><td>${esc(m)}</td><td><span class="badge badge-${k}">${esc(r)}</span></td></tr>`).join("");

      const c = s.config;
      $("#site-config").innerHTML = [
        ["Tipo de sitio", s.type], ["Modalidad", s.mode], ["Destinos", `${c.destinos} · ${c.tipoDest}`],
        ["Personal autorizado", c.personal.toLocaleString("es-CO")], ["Cuentas de vigilante", c.vigilantes],
        ["Acciones de Argos", c.argos], ["Retención (Ley 1581)", c.retencion]
      ].map(([k, v]) => `<li class="setting"><div class="setting-text"><strong>${k}</strong></div><span class="small">${esc(v)}</span></li>`).join("");

      $("#site-doors").innerHTML = s.doors.map(([n, m, e]) =>
        `<tr><td><strong>${esc(n)}</strong></td><td>${m}</td><td>${e ? `<span class="badge badge-info">${e}</span>` : '<span class="muted">—</span>'}</td></tr>`).join("");

      history.replaceState(null, "", "?id=" + s.id + location.hash);
    }

    sel.addEventListener("change", () => render(sel.value));
    render(params.get("id"));
  }

  /* ---------- Incidentes: tomar y cerrar ---------- */
  let closing = null;
  function refreshIncidentCount() {
    // Solo en páginas con la lista de incidentes; en las demás el contador queda como viene del servidor.
    if (!$(".incidents[data-filterable]")) return;
    const open = $$(".incident[data-status]:not(.is-closed)").length;
    $$('[data-count="escaladas"]').forEach((el) => { el.textContent = open; });
  }
  function initIncidents() {
    document.addEventListener("click", (e) => {
      const take = e.target.closest("[data-take]");
      if (take) {
        const it = take.closest(".incident");
        const b = $(".incident-state", it);
        b.className = "badge badge-info incident-state";
        b.textContent = "En atención · " + ME;
        it.dataset.status = "atencion";
        take.remove();
        // INTEGRACIÓN: asignar el incidente al supervisor (queda en auditoría).
        toast("Tomaste el incidente. El sitio ve que la Torre lo está atendiendo.", "ok");
      }
      const cl = e.target.closest("[data-close-incident]");
      if (cl) {
        closing = cl.closest(".incident");
        const m = window.UI.openModal("modal-close");
        $("#close-what", m).textContent = $(".incident-title", closing).textContent;
        $("#close-error", m).hidden = true;
      }
    });

    const form = $("#close-form");
    if (form) form.addEventListener("submit", (e) => {
      e.preventDefault();
      const txt = $("#close-comment").value.trim();
      if (txt.length < 3) { $("#close-error").hidden = false; return; }
      const res = $("#close-result").value;
      closing.classList.add("is-closed");
      closing.dataset.status = "cerrado";
      const b = $(".incident-state", closing);
      b.className = "badge incident-state " + (res === "Falsa alarma" ? "badge-offline" : "badge-ok");
      b.textContent = res;
      const p = document.createElement("p");
      p.className = "incident-note";
      p.textContent = `${res} · ${hhmm()} · ${ME} · ${txt}`;
      closing.appendChild(p);
      // INTEGRACIÓN: cerrar el incidente; si es falsa alarma, alimenta el entrenamiento controlado de Argos.
      $("#modal-close").close();
      const list = closing.closest("[data-filterable]");
      if (list) list.dispatchEvent(new Event("vv:changed"));
      refreshIncidentCount();
      toast("Incidente cerrado. Quedó en la auditoría global.", "ok");
    });
    refreshIncidentCount();
  }

  /* ---------- Muro de cámaras (camaras.html) ---------- */
  function initWall() {
    const wall = $("#wall");
    if (!wall) return;
    // INTEGRACIÓN: cámaras de todos los sitios desde el servicio de ingesta.
    const CAMS = SITES.flatMap((s) => s.cams.map(([n, on]) => ({ site: s.id, siteName: s.name, name: n, on })));
    const siteSel = $("#wall-site");
    siteSel.innerHTML = '<option value="">Todos los sitios</option>' + SITES.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("");
    let layout = Number(window.UI.store.get("vv-wall-layout")) || 9;
    let onlyOffline = false;

    function render() {
      let cams = CAMS.filter((c) => !siteSel.value || c.site === siteSel.value);
      if (onlyOffline) cams = cams.filter((c) => !c.on);
      wall.dataset.layout = layout;
      wall.innerHTML = cams.slice(0, layout).map((c) => `
        <div class="video ${c.on ? "" : "is-offline"}"><div class="video-feed"></div>
          <div class="video-offline">Sin señal</div>
          <span class="video-tag ${c.on ? "live" : ""}">${c.on ? "● EN VIVO" : "SIN SEÑAL"}</span>
          <div class="video-label"><span>${esc(c.name)}</span><span>${esc(c.siteName.split(" · ")[0])}</span></div></div>`).join("")
        || '<p class="empty">No hay cámaras con ese filtro.</p>';
      $$("[data-wall-layout]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.wallLayout) === layout)));
      const off = CAMS.filter((c) => !c.on).length;
      $("#wall-summary").textContent = `${CAMS.length - off} de ${CAMS.length} en línea`;
    }
    $$("[data-wall-layout]").forEach((b) => b.addEventListener("click", () => {
      layout = Number(b.dataset.wallLayout); window.UI.store.set("vv-wall-layout", layout); render();
    }));
    siteSel.addEventListener("change", render);
    $("#wall-offline").addEventListener("change", (e) => { onlyOffline = e.target.checked; render(); });
    $("#wall-fullscreen").addEventListener("click", () => {
      const w = $(".wall-wrap");
      if (document.fullscreenElement) document.exitFullscreen(); else if (w.requestFullscreen) w.requestFullscreen();
    });
    render();
  }

  /* ---------- Formularios de "agregar" ---------- */
  const TEMPLATES = {
    sitio(f) {
      const clone = f.get("clon");
      return `
        <td><strong>${esc(f.get("nombre"))}</strong><div class="xsmall muted">${esc(f.get("cliente"))}</div></td>
        <td>${esc(f.get("tipo"))}</td>
        <td>${esc(f.get("modalidad"))}</td>
        <td><span class="badge badge-info">Instalación</span></td>
        <td class="small muted">${clone ? "Clon de " + esc(clone) : "Configuración vacía"}</td>
        <td class="mono">—</td>
        <td><a class="btn btn-sm" href="sitio.html">Abrir</a></td>`;
    },
    usuario(f) {
      return `
        <td><strong>${esc(f.get("nombre"))}</strong><div class="xsmall muted">${esc(f.get("correo"))}</div></td>
        <td>${esc(f.get("rol"))}</td>
        <td>${esc(f.get("alcance"))}</td>
        <td><span class="badge badge-warn">Pendiente MFA</span></td>
        <td class="muted">Nunca</td>
        <td><button class="btn btn-sm btn-ghost" type="button" data-toggle-user>Desactivar</button></td>`;
    }
  };
  function initAddForms() {
    $$("form[data-add-to]").forEach((form) => form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const tr = document.createElement("tr");
      tr.dataset.status = "activo";
      tr.innerHTML = TEMPLATES[form.dataset.template](new FormData(form));
      const body = document.getElementById(form.dataset.addTo);
      body.prepend(tr);
      body.dispatchEvent(new Event("vv:changed"));
      form.closest("dialog").close();
      toast(form.dataset.success || "Creado.", "ok");
    }));

    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-toggle-user]");
      if (!t) return;
      const tr = t.closest("tr");
      const off = tr.dataset.status !== "inactivo";
      tr.dataset.status = off ? "inactivo" : "activo";
      tr.style.opacity = off ? ".55" : "";
      t.textContent = off ? "Activar" : "Desactivar";
      toast(off ? "Usuario desactivado. Sus sesiones se cierran." : "Usuario activado.", off ? "warn" : "ok");
    });
  }

  /* ---------- Despliegues por anillos ---------- */
  function initRollouts() {
    document.addEventListener("click", (e) => {
      const p = e.target.closest("[data-promote]");
      if (p) {
        const rings = $$(".ring", p.closest("tr"));
        const i = rings.findIndex((r) => r.classList.contains("active"));
        if (i === -1) return;
        rings[i].classList.replace("active", "done");
        if (rings[i + 1]) {
          rings[i + 1].classList.add("active");
          toast(`Promovido a «${rings[i + 1].textContent.trim()}».`, "ok");
        } else {
          p.disabled = true;
          p.textContent = "Completado";
          toast("Desplegado en todas las sedes.", "ok");
        }
        // INTEGRACIÓN: el despliegue real pasa por CI/CD con pruebas y reversa en minutos.
      }
      const r = e.target.closest("[data-rollback]");
      if (r) toast("Reversa iniciada: las sedes vuelven a la versión anterior.", "warn");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initSiteView();
    initIncidents();
    initWall();
    initAddForms();
    initRollouts();
  });

  window.SITES = SITES;
})();
