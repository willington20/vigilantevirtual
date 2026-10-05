/* ==========================================================
   Vigilante Virtual · Interacciones del dashboard del vigilante
   ----------------------------------------------------------
   MOCKUP: todo lo que aquí "pasa" (abrir puerta, alertas,
   cámaras) es simulado. En producción estos datos llegan del
   backend, del servicio de ingesta de video (Anderson) y del
   bus de eventos de Argos. Las funciones marcadas con
   "INTEGRACIÓN" son los puntos donde se conecta lo real.
   ========================================================== */

(function () {
  "use strict";

  /* ---------- Datos de demostración ---------- */
  // INTEGRACIÓN: lista de cámaras del sitio (servicio de ingesta).
  const CAMS = [
    { id: "cam-01", name: "Entrada principal",   zone: "Portería",  online: true },
    { id: "cam-02", name: "Videoportero externo", zone: "Portería",  online: true, tag: "VIDEOPORTERO" },
    { id: "cam-03", name: "Kiosco Paramericana-01", zone: "Portería", online: true, tag: "KIOSCO" },
    { id: "cam-04", name: "Parqueadero norte",   zone: "Exterior",  online: true },
    { id: "cam-05", name: "Muelle de carga 1",   zone: "Bodega",    online: true },
    { id: "cam-06", name: "Pasillo A",           zone: "Bodega",    online: true },
    { id: "cam-07", name: "Pasillo B",           zone: "Bodega",    online: false },
    { id: "cam-08", name: "Perímetro oriental",  zone: "Exterior",  online: true },
    { id: "cam-09", name: "Salida peatonal",     zone: "Portería",  online: true }
  ];
  const camById = (id) => CAMS.find((c) => c.id === id) || CAMS[0];

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const ICON = {
    expand: '<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
    camOff: '<svg class="icon icon-lg" viewBox="0 0 24 24"><path d="M2 2l20 20M10.7 6H13a2 2 0 0 1 2 2v2.3l1 1L21 8v10M15 15.7V16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h1"/></svg>',
    check:  '<svg class="icon" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
    x:      '<svg class="icon" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>'
  };

  /* ---------- Utilidades ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } }
  };

  function hhmm(d = new Date()) {
    return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  function toast(msg, type = "") {
    let box = $(".toasts");
    if (!box) {
      box = document.createElement("div");
      box.className = "toasts";
      box.setAttribute("role", "status");
      box.setAttribute("aria-live", "polite");
      document.body.appendChild(box);
    }
    const t = document.createElement("div");
    t.className = "toast " + type;
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => t.remove(), 4500);
  }

  // Pitido de alerta (Web Audio, sin archivos externos).
  let audioCtx;
  function beep() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.22].forEach((offset) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = "square";
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.08, audioCtx.currentTime + offset);
        g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + offset + 0.18);
        o.connect(g).connect(audioCtx.destination);
        o.start(audioCtx.currentTime + offset);
        o.stop(audioCtx.currentTime + offset + 0.2);
      });
    } catch (e) { /* audio no disponible */ }
  }

  /* ---------- Reloj ---------- */
  function startClock() {
    const c = $("#clock"), d = $("#clock-date");
    if (!c) return;
    const tick = () => {
      const now = new Date();
      c.textContent = now.toLocaleTimeString("es-CO", { hour12: false });
      if (d) d.textContent = now.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Tema claro / oscuro ---------- */
  function initTheme() {
    const saved = store.get("vv-theme");
    if (saved) document.documentElement.dataset.theme = saved;
    const btn = $("#theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      store.set("vv-theme", next);
    });
  }

  /* ---------- Modales ---------- */
  function openModal(id) {
    const m = document.getElementById(id);
    if (m && !m.open) m.showModal();
    return m;
  }
  document.addEventListener("click", (e) => {
    const closer = e.target.closest("[data-close]");
    if (closer) closer.closest("dialog").close();
  });

  /* ---------- Contadores ---------- */
  function refreshCounts() {
    const open = $$(".alert:not(.is-resolved)").length;
    const pending = $$(".request:not(.is-done)").length;
    $$('[data-count="alerts"]').forEach((el) => {
      if ($(".alerts")) el.textContent = open;
      if (el.classList.contains("count")) el.hidden = Number(el.textContent) === 0;
    });
    $$('[data-count="requests"]').forEach((el) => { if ($(".requests")) el.textContent = pending; });
    const kpi = $('[data-kpi="alerts"]');
    if (kpi) kpi.classList.toggle("is-alert", open > 0);
  }

  /* ==========================================================
     APERTURA DE PUERTA
     Regla: ninguna apertura a distancia sin confirmación del
     vigilante. Se muestra el resultado real de la orden:
     "Abierta" o "NO se abrió" (si el relé no responde).
     ========================================================== */
  let pendingOpen = null;

  function askOpenDoor({ door, reason, fail = false, onDone }) {
    const m = openModal("modal-open");
    if (!m) return;
    pendingOpen = { door, reason, fail, onDone };
    $("#open-door-name", m).textContent = door;
    $("#open-reason", m).textContent = reason || "Apertura manual desde Accesos";
    $("#open-status", m).hidden = true;
    $("#open-confirm", m).hidden = false;
    $("#open-confirm", m).disabled = false;
    $("#open-cancel", m).textContent = "Cancelar";
  }

  function confirmOpenDoor() {
    const m = $("#modal-open");
    const st = $("#open-status", m);
    const btn = $("#open-confirm", m);
    btn.disabled = true;
    st.hidden = false;
    st.className = "open-status sending";
    st.innerHTML = '<span class="spinner"></span> Enviando orden al controlador…';

    // INTEGRACIÓN: POST de la orden de apertura; esperar la confirmación
    // del agente (máx. 15 s). La orden lleva un id único para no repetirse.
    const p = pendingOpen;
    setTimeout(() => {
      if (p.fail) {
        st.className = "open-status fail";
        st.innerHTML = ICON.x + " NO se abrió · el relé no respondió";
        btn.hidden = true;
        $("#open-cancel", m).textContent = "Cerrar";
        toast("NO se abrió " + p.door + ". Se creó la novedad.", "danger");
        beep();
      } else {
        st.className = "open-status ok";
        st.innerHTML = ICON.check + " Puerta abierta · confirmada por el controlador " + hhmm();
        btn.hidden = true;
        $("#open-cancel", m).textContent = "Cerrar";
        toast(p.door + " abierta.", "ok");
      }
      if (p.onDone) p.onDone(!p.fail);
      pendingOpen = null;
    }, 1600);
  }

  function initDoors() {
    const confirm = $("#open-confirm");
    if (confirm) confirm.addEventListener("click", confirmOpenDoor);

    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-open-door]");
      if (!b) return;
      askOpenDoor({
        door: b.dataset.openDoor,
        reason: b.dataset.reason,
        fail: b.dataset.fail === "true"
      });
    });

    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-lock-door]");
      if (!b) return;
      const card = b.closest(".door");
      const locked = b.getAttribute("aria-pressed") === "true";
      b.setAttribute("aria-pressed", String(!locked));
      b.innerHTML = locked ? "Bloquear" : "Desbloquear";
      if (card) {
        const badge = $(".door-state", card);
        if (badge) {
          badge.className = "badge door-state " + (locked ? "badge-ok" : "badge-danger");
          badge.innerHTML = '<span class="dot"></span> ' + (locked ? "Cerrada" : "Bloqueada");
        }
        $$("[data-open-door]", card).forEach((x) => (x.disabled = !locked));
      }
      toast((locked ? "Desbloqueada: " : "Bloqueada: ") + b.dataset.lockDoor, locked ? "ok" : "warn");
    });
  }

  /* ---------- Solicitudes de ingreso ---------- */
  function initRequests() {
    document.addEventListener("click", (e) => {
      const ap = e.target.closest("[data-approve]");
      const rj = e.target.closest("[data-reject]");
      const call = e.target.closest("[data-call]");

      if (ap) {
        const item = ap.closest(".request");
        const name = ap.dataset.approve;
        askOpenDoor({
          door: ap.dataset.door || "Puerta principal",
          reason: "Solicitud aprobada · " + name,
          fail: ap.dataset.fail === "true",
          onDone: (ok) => {
            if (!ok || !item) return;
            item.classList.add("is-done");
            const b = $(".request-status", item);
            if (b) { b.className = "badge badge-ok request-status"; b.textContent = "Aprobado " + hhmm(); }
            refreshCounts();
          }
        });
      }

      if (rj) {
        const item = rj.closest(".request");
        item.classList.add("is-done");
        const b = $(".request-status", item);
        if (b) { b.className = "badge badge-danger request-status"; b.textContent = "Rechazado " + hhmm(); }
        toast("Ingreso rechazado: " + rj.dataset.reject, "warn");
        refreshCounts();
      }

      if (call) {
        const m = openModal("modal-call");
        if (!m) return;
        $("#call-name", m).textContent = call.dataset.call;
        $("#call-origin", m).textContent = call.dataset.origin || "Kiosco Paramericana-01";
        $("#call-dest", m).textContent = call.dataset.dest || "—";
        $("#call-doc", m).textContent = call.dataset.doc || "—";
        const openBtn = $("#call-open", m);
        openBtn.dataset.openDoor = call.dataset.door || "Puerta principal";
        openBtn.dataset.reason = "Apertura por videollamada · " + call.dataset.call;
        // INTEGRACIÓN: aquí se conecta la sesión WebRTC (kiosco) o el puente SIP↔WebRTC (videoportero).
      }
    });

    const hang = $("#call-hangup");
    if (hang) hang.addEventListener("click", () => { $("#modal-call").close(); toast("Llamada finalizada."); });
  }

  /* ---------- Alertas de Argos ---------- */
  let resolving = null;

  function initAlerts() {
    document.addEventListener("click", (e) => {
      const r = e.target.closest("[data-resolve]");
      if (r) {
        resolving = { alert: r.closest(".alert"), kind: r.dataset.resolve };
        const m = openModal("modal-resolve");
        $("#resolve-title", m).textContent = r.dataset.resolve === "falsa" ? "Marcar como falsa alarma" : "Marcar como atendida";
        $("#resolve-alert", m).textContent = $(".alert-title", resolving.alert).textContent;
        $("#resolve-comment", m).value = "";
        $("#resolve-error", m).hidden = true;
        $("#resolve-comment", m).focus();
      }

      const v = e.target.closest("[data-view-cam]");
      if (v) {
        const cam = camById(v.dataset.viewCam);
        const m = openModal("modal-cam");
        if (!m) return;
        $("#evcam-title", m).textContent = v.dataset.title || cam.name;
        $("#evcam-live", m).innerHTML = videoTile(cam, { focus: true, tools: false });
        $("#evcam-snap-label", m).textContent = "Captura del evento · " + (v.dataset.time || hhmm());
        const link = $("#evcam-link", m);
        if (link) link.href = "camaras.html?cam=" + cam.id;
      }
    });

    const save = $("#resolve-save");
    if (save) save.addEventListener("click", () => {
      const m = $("#modal-resolve");
      const txt = $("#resolve-comment", m).value.trim();
      if (txt.length < 3) { $("#resolve-error", m).hidden = false; return; }
      // INTEGRACIÓN: guardar la resolución (queda en Historial y alimenta el entrenamiento controlado de Argos).
      const a = resolving.alert;
      a.classList.add("is-resolved");
      a.classList.remove("is-new");
      const res = document.createElement("p");
      res.className = "alert-resolution";
      res.textContent = (resolving.kind === "falsa" ? "Falsa alarma" : "Atendida") + " · " + hhmm() + " · " + txt;
      a.appendChild(res);
      const badge = $(".alert-state", a);
      if (badge) {
        badge.className = "badge alert-state " + (resolving.kind === "falsa" ? "badge-offline" : "badge-ok");
        badge.textContent = resolving.kind === "falsa" ? "Falsa alarma" : "Atendida";
      }
      a.dataset.status = resolving.kind === "falsa" ? "falsa" : "atendida";
      m.close();
      toast("Alerta registrada en Novedades e Historial.", "ok");
      refreshCounts();
    });

    // Escalamiento a la Torre si nadie atiende en 2 minutos.
    setInterval(() => {
      $$(".alert-escalate[data-seconds]").forEach((el) => {
        if (el.closest(".is-resolved")) return;
        let s = Number(el.dataset.seconds);
        if (s <= 0) return;
        s -= 1;
        el.dataset.seconds = s;
        const txt = $(".esc-text", el);
        if (s === 0) {
          el.classList.add("is-escalated");
          txt.textContent = "Escalada a la Torre de Control: nadie atendió en 2 min";
        } else {
          const mm = Math.floor(s / 60), ss = String(s % 60).padStart(2, "0");
          txt.textContent = "Se escala a la Torre en " + mm + ":" + ss;
        }
      });
    }, 1000);

    // Simulador de evento de Argos (solo mockup).
    // INTEGRACIÓN: reemplazar por la suscripción al bus de eventos (WebSocket/MQTT).
    const sim = $("#simulate-alert");
    if (sim) sim.addEventListener("click", () => {
      const list = $(".alerts");
      if (!list) return;
      const li = document.createElement("li");
      li.className = "alert is-new";
      li.dataset.sev = "alta";
      li.dataset.status = "abierta";
      li.innerHTML = `
        <div class="alert-top">
          <div>
            <p class="alert-title">Persona en zona restringida fuera de horario</p>
            <div class="alert-meta">
              <span>Argos</span><span>Pasillo A</span><span class="mono">${hhmm()}</span>
              <span class="argos-score">Riesgo 0.91</span>
            </div>
          </div>
          <span class="badge badge-danger alert-state">Nueva</span>
        </div>
        <p class="alert-escalate" data-seconds="120"><span class="dot dot-live"></span><span class="esc-text">Se escala a la Torre en 2:00</span></p>
        <div class="alert-actions">
          <button class="btn btn-sm" data-view-cam="cam-06" data-title="Pasillo A · persona fuera de horario" data-time="${hhmm()}">Ver cámara</button>
          <button class="btn btn-sm btn-ok" data-resolve="atendida">Atendida</button>
          <button class="btn btn-sm btn-ghost" data-resolve="falsa">Falsa alarma</button>
        </div>`;
      list.prepend(li);
      beep();
      toast("Nueva alerta de Argos: persona en zona restringida.", "danger");
      refreshCounts();
    });
  }

  /* ==========================================================
     CÁMARAS
     ========================================================== */
  function videoTile(cam, { focus = false, tools = true } = {}) {
    const tag = cam.online
      ? `<span class="video-tag live"><span class="dot dot-live"></span> ${cam.tag || "EN VIVO"}</span>`
      : `<span class="video-tag">SIN SEÑAL</span>`;
    const toolsHtml = tools && cam.online
      ? `<div class="video-tools"><button type="button" data-solo="${cam.id}" title="Ver sola" aria-label="Ver ${cam.name} sola">${ICON.expand}</button></div>`
      : "";
    return `
      <div class="video ${cam.online ? "" : "is-offline"} ${focus ? "is-focus" : ""}" data-cam="${cam.id}">
        <div class="video-feed"></div>
        <div class="video-offline"><div>${ICON.camOff}<br>Sin señal desde ${cam.lastSeen || "09:42"}</div></div>
        ${tag}
        ${toolsHtml}
        <div class="video-label"><span>${cam.name}</span><span class="mono">${cam.id.toUpperCase()}</span></div>
      </div>`;
  }

  function initCameras() {
    const grid = $("#cam-grid");
    if (!grid) return;
    const list = $("#cam-list");
    const params = new URLSearchParams(location.search);
    let layout = Number(store.get("vv-cam-layout")) || 4;
    let selected = params.get("cam") || CAMS[0].id;
    if (params.get("cam")) layout = 1;

    // Lista lateral con estado de cada cámara
    list.innerHTML = CAMS.map((c) => `
      <li><button type="button" data-select-cam="${c.id}" aria-pressed="false">
        <span><span class="cam-name">${c.name}</span><br><span class="cam-zone">${c.zone}</span></span>
        <span class="dot" style="color:${c.online ? "var(--ok)" : "var(--danger)"}" title="${c.online ? "En línea" : "Sin señal"}"></span>
      </button></li>`).join("");

    const online = CAMS.filter((c) => c.online).length;
    const sum = $("#cam-summary");
    if (sum) sum.textContent = `${online} de ${CAMS.length} en línea`;

    function render() {
      grid.dataset.layout = layout;
      const startIdx = Math.max(0, CAMS.findIndex((c) => c.id === selected));
      let cams;
      if (layout === 1) cams = [camById(selected)];
      else {
        // la seleccionada primero, luego el resto en orden
        cams = [CAMS[startIdx], ...CAMS.filter((_, i) => i !== startIdx)].slice(0, layout);
      }
      grid.innerHTML = cams.map((c) => videoTile(c)).join("");
      $$("[data-layout-btn]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.layoutBtn) === layout)));
      $$("[data-select-cam]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.selectCam === selected)));
      const rc = $("#rec-cam");
      if (rc && rc.value !== selected) rc.value = selected;
    }

    document.addEventListener("click", (e) => {
      const lb = e.target.closest("[data-layout-btn]");
      if (lb) { layout = Number(lb.dataset.layoutBtn); store.set("vv-cam-layout", layout); render(); }
      const sc = e.target.closest("[data-select-cam]");
      if (sc) { selected = sc.dataset.selectCam; render(); }
      const solo = e.target.closest("[data-solo]");
      if (solo) { selected = solo.dataset.solo; layout = 1; render(); }
    });

    const fs = $("#cams-fullscreen");
    if (fs) fs.addEventListener("click", () => {
      const wrap = $(".cam-grid-wrap");
      if (document.fullscreenElement) document.exitFullscreen();
      else if (wrap.requestFullscreen) wrap.requestFullscreen();
    });

    // Grabaciones por rango de hora
    const recCam = $("#rec-cam");
    if (recCam) recCam.innerHTML = CAMS.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
    const recForm = $("#rec-form");
    if (recForm) recForm.addEventListener("submit", (e) => {
      e.preventDefault();
      // INTEGRACIÓN: pedir al servicio de ingesta los segmentos grabados del rango.
      const from = $("#rec-from").value || "08:00";
      const to = $("#rec-to").value || "10:00";
      const cam = camById(recCam.value);
      const out = $("#rec-result");
      out.hidden = false;
      $("#rec-title").textContent = `${cam.name} · ${$("#rec-date").value || "hoy"} · ${from} a ${to}`;
      $("#rec-player").innerHTML = videoTile({ ...cam, online: true, tag: "GRABACIÓN" }, { tools: false });
      $("#rec-scale").innerHTML = `<span>${from}</span><span>${to}</span>`;
      $("#rec-timeline").innerHTML = `
        <div class="timeline-seg" style="left:0%;width:38%"></div>
        <div class="timeline-seg" style="left:41%;width:35%"></div>
        <div class="timeline-seg" style="left:79%;width:21%"></div>
        <div class="timeline-ev" style="left:22%" title="Evento Argos"></div>
        <div class="timeline-ev" style="left:63%" title="Evento Argos"></div>
        <div class="timeline-head" style="left:22%"></div>`;
    });

    render();
  }

  /* ---------- Filtros (Novedades / Historial) ---------- */
  function initFilters() {
    const target = $("[data-filterable]");
    if (!target) return;
    let status = "todas";
    const search = $("#filter-search");
    const type = $("#filter-type");

    function apply() {
      const q = (search && search.value || "").toLowerCase().trim();
      const t = type ? type.value : "";
      let shown = 0;
      $$("[data-status]", target).forEach((el) => {
        const okStatus = status === "todas" || el.dataset.status === status;
        const okType = !t || el.dataset.type === t;
        const okText = !q || el.textContent.toLowerCase().includes(q);
        const visible = okStatus && okType && okText;
        el.hidden = !visible;
        if (visible) shown++;
      });
      const empty = $("#filter-empty");
      if (empty) empty.hidden = shown > 0;
    }

    $$("[data-filter]").forEach((b) => b.addEventListener("click", () => {
      status = b.dataset.filter;
      $$("[data-filter]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      apply();
    }));
    if (search) search.addEventListener("input", apply);
    if (type) type.addEventListener("change", apply);
    apply();
  }

  /* ---------- Arranque ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    startClock();
    initDoors();
    initRequests();
    initAlerts();
    initCameras();
    initFilters();
    refreshCounts();
  });

  window.VV = { toast, beep, CAMS, videoTile };
})();
