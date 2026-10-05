/* ==========================================================
   Vigilante Virtual · Interacciones del dashboard del admin
   ----------------------------------------------------------
   MOCKUP: los cambios solo viven en la página. Los puntos
   marcados "INTEGRACIÓN" son donde se llama al backend.
   Todo cambio de configuración debe quedar en auditoría.
   Depende de ../shared/js/ui.js (window.UI).
   ========================================================== */

(function () {
  "use strict";
  const { $, $$, toast, hhmm } = window.UI;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  const dayChips = (sel) => ["L", "M", "X", "J", "V", "S", "D"]
    .map((d, i) => `<span class="${sel.includes(String(i)) ? "on" : ""}">${d}</span>`).join("");

  /* ---------- Plantillas de filas nuevas ---------- */
  const TEMPLATES = {
    persona(f) {
      const medios = f.getAll("medio");
      return {
        status: "activo", type: f.get("tipo"),
        html: `
        <td><div class="person"><span class="avatar">${esc(initials(f.get("nombre")))}</span>
          <div><div class="person-name">${esc(f.get("nombre"))}</div><div class="person-sub">${esc(f.get("cargo") || "—")}</div></div></div></td>
        <td>${esc(f.get("tipo"))}</td>
        <td>${esc(f.get("destino"))}</td>
        <td><div class="methods">${medios.map((m) => `<span class="badge">${esc(m)}</span>`).join("") || '<span class="muted">—</span>'}
          ${medios.includes("Rostro") ? '<span class="badge badge-warn">Rostro por enrolar</span>' : ""}</div></td>
        <td>${esc(f.get("horario"))}</td>
        <td><span class="badge badge-ok row-state">Activo</span></td>
        <td><button class="btn btn-sm btn-ghost" type="button" data-toggle-active>Desactivar</button></td>`
      };
    },
    destino(f) {
      return {
        status: "activo", type: f.get("tipo"),
        html: `
        <td><strong>${esc(f.get("nombre"))}</strong></td>
        <td>${esc(f.get("tipo"))}</td>
        <td>${esc(f.get("ubicacion") || "—")}</td>
        <td>${esc(f.get("anfitrion") || "—")}</td>
        <td>${f.get("aprobacion") ? "Anfitrión aprueba" : "Solo portería"}</td>
        <td><span class="badge badge-ok row-state">Activo</span></td>
        <td><button class="btn btn-sm btn-ghost" type="button" data-toggle-active>Desactivar</button></td>`
      };
    },
    vigilante(f) {
      return {
        status: "activo", type: "",
        html: `
        <td><div class="person"><span class="avatar">${esc(initials(f.get("nombre")))}</span>
          <div><div class="person-name">${esc(f.get("nombre"))}</div><div class="person-sub">${esc(f.get("usuario"))}</div></div></div></td>
        <td>${esc(f.get("turno"))}</td>
        <td>${esc(f.get("puesto"))}</td>
        <td class="muted">Nunca</td>
        <td><span class="badge badge-warn row-state">Pendiente de activar</span></td>
        <td><div class="row"><button class="btn btn-sm" type="button" data-reset-code>Restablecer código</button>
          <button class="btn btn-sm btn-ghost" type="button" data-toggle-active>Desactivar</button></div></td>`
      };
    },
    turno(f) {
      const dias = f.getAll("dia");
      return {
        status: "activo", type: "",
        html: `
        <td><strong>${esc(f.get("nombre"))}</strong></td>
        <td>${esc(f.get("aplica"))}</td>
        <td><div class="days">${dayChips(dias)}</div></td>
        <td class="mono">${esc(f.get("desde"))} – ${esc(f.get("hasta"))}</td>
        <td>${esc(f.get("tolerancia"))} min</td>
        <td class="mono">0</td>
        <td><button class="btn btn-sm btn-ghost" type="button" data-toggle-active>Desactivar</button></td>`
      };
    }
  };

  /* ---------- Formularios de "agregar" ---------- */
  function initAddForms() {
    $$("form[data-add-to]").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!form.reportValidity()) return;
        const data = new FormData(form);
        const tpl = TEMPLATES[form.dataset.template];
        const body = document.getElementById(form.dataset.addTo);
        if (!tpl || !body) return;
        // INTEGRACIÓN: POST al backend; la respuesta trae el registro creado.
        const row = tpl(data);
        const tr = document.createElement("tr");
        tr.dataset.status = row.status;
        if (row.type) tr.dataset.type = row.type;
        tr.innerHTML = row.html;
        body.prepend(tr);
        body.dispatchEvent(new Event("vv:changed"));
        form.closest("dialog").close();
        toast(form.dataset.success || "Registro creado.", "ok");
      });
    });
  }

  /* ---------- Activar / desactivar filas ---------- */
  function initRowActions() {
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-toggle-active]");
      if (t) {
        const tr = t.closest("tr");
        const off = !tr.classList.contains("is-off");
        tr.classList.toggle("is-off", off);
        tr.dataset.status = off ? "inactivo" : "activo";
        t.textContent = off ? "Activar" : "Desactivar";
        const st = $(".row-state", tr);
        if (st) {
          st.className = "badge row-state " + (off ? "badge-offline" : "badge-ok");
          st.textContent = off ? "Inactivo" : "Activo";
        }
        const body = tr.closest("[data-filterable]");
        if (body) body.dispatchEvent(new Event("vv:changed"));
        toast(off ? "Desactivado. Ya no podrá ingresar ni operar." : "Activado de nuevo.", off ? "warn" : "ok");
      }

      const r = e.target.closest("[data-reset-code]");
      if (r) {
        // INTEGRACIÓN: el backend genera un código temporal y lo entrega al vigilante
        // por un canal seguro. El código nunca se muestra en este panel.
        const name = $(".person-name", r.closest("tr")).textContent;
        toast(`Se envió un código temporal a ${name}. Deberá cambiarlo al entrar.`, "ok");
      }
    });
  }

  /* ---------- Puertas: editar configuración ---------- */
  let editingDoor = null;
  function initDoors() {
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-edit-door]");
      if (!b) return;
      editingDoor = b.closest(".door-cfg");
      const m = window.UI.openModal("modal-door");
      const d = editingDoor.dataset;
      $("#door-title", m).textContent = d.name;
      $("#door-mode", m).value = d.mode;
      $("#door-evac", m).checked = d.evac === "true";
      $("#door-max", m).value = d.max;
      $("#door-auto", m).checked = d.auto === "true";
      updateDoorWarning();
    });

    const mode = $("#door-mode"), evac = $("#door-evac");
    function updateDoorWarning() {
      const warn = $("#door-warning");
      if (!warn) return;
      // Regla del plan: en rutas de evacuación la cantonera debe ser fail-safe.
      const bad = evac.checked && mode.value === "fail-secure";
      warn.hidden = !bad;
      $("#door-save").disabled = bad;
    }
    if (mode) mode.addEventListener("change", updateDoorWarning);
    if (evac) evac.addEventListener("change", updateDoorWarning);

    const form = $("#door-form");
    if (form) form.addEventListener("submit", (e) => {
      e.preventDefault();
      const card = editingDoor;
      card.dataset.mode = mode.value;
      card.dataset.evac = String(evac.checked);
      card.dataset.max = $("#door-max").value;
      card.dataset.auto = String($("#door-auto").checked);
      $(".v-mode", card).textContent = mode.value === "fail-safe" ? "Fail-safe (abre sin energía)" : "Fail-secure (queda cerrada)";
      $(".v-evac", card).textContent = evac.checked ? "Sí" : "No";
      $(".v-max", card).textContent = $("#door-max").value + " min";
      $(".v-auto", card).textContent = $("#door-auto").checked ? "Permitida (autorizado + en horario)" : "Desactivada";
      // INTEGRACIÓN: guardar y registrar en auditoría (quién, cuándo, valor anterior y nuevo).
      $("#modal-door").close();
      toast("Puerta actualizada. El cambio quedó en auditoría.", "ok");
    });
  }

  /* ---------- Formularios de ajustes (Configuración) ---------- */
  function initSettings() {
    $$("form[data-settings]").forEach((form) => {
      const save = $("[data-save]", form);
      const note = $("[data-dirty-note]", form);
      const markDirty = () => {
        if (save) save.disabled = false;
        if (note) note.textContent = "Tienes cambios sin guardar";
      };
      form.addEventListener("input", markDirty);
      form.addEventListener("change", markDirty);
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        // INTEGRACIÓN: guardar ajustes del sitio y registrar en auditoría.
        if (save) save.disabled = true;
        if (note) note.textContent = "Guardado a las " + hhmm();
        toast("Configuración guardada. El cambio quedó en auditoría.", "ok");
      });
    });

    // Tipo de sitio → cambia el nombre de los destinos sugeridos
    const tipo = $("#site-type");
    const hint = $("#site-type-hint");
    const HINTS = {
      bodega: "Destinos sugeridos: bodegas, oficinas, muelles de carga.",
      universidad: "Destinos sugeridos: facultades, edificios, laboratorios.",
      residencia: "Destinos sugeridos: torres y apartamentos."
    };
    if (tipo && hint) {
      const upd = () => { hint.textContent = HINTS[tipo.value] || ""; };
      tipo.addEventListener("change", upd);
      upd();
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initAddForms();
    initRowActions();
    initDoors();
    initSettings();
  });
})();
