/* ==========================================================
   Vigilante Virtual · Utilidades de interfaz compartidas
   (tema, avisos, modales, pestañas, filtros de tablas).
   Lo usan /admin y /general. Expone window.UI.
   ========================================================== */

(function () {
  "use strict";

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

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

  /* Tema claro / oscuro */
  function initTheme() {
    const saved = store.get("vv-theme");
    if (saved) document.documentElement.dataset.theme = saved;
    const btn = $("#theme-toggle");
    if (btn) btn.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      store.set("vv-theme", next);
    });
  }

  /* Reloj de la barra superior (si existe) */
  function initClock() {
    const c = $("#clock");
    if (!c) return;
    const tick = () => { c.textContent = new Date().toLocaleTimeString("es-CO", { hour12: false }); };
    tick();
    setInterval(tick, 1000);
  }

  /* Modales: data-open-modal="id" abre, data-close cierra */
  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return null;
    const form = $("form", m);
    if (form) form.reset();
    if (!m.open) m.showModal();
    return m;
  }
  function initModals() {
    document.addEventListener("click", (e) => {
      const opener = e.target.closest("[data-open-modal]");
      if (opener) openModal(opener.dataset.openModal);
      const closer = e.target.closest("[data-close]");
      if (closer) closer.closest("dialog").close();
    });
  }

  /* Pestañas: <div class="tabs" role="tablist"><button role="tab" aria-controls="panel-id"> */
  function initTabs() {
    $$(".tabs[role=tablist]").forEach((list) => {
      const tabs = $$("[role=tab]", list);
      const select = (tab) => {
        tabs.forEach((t) => {
          const on = t === tab;
          t.setAttribute("aria-selected", String(on));
          const panel = document.getElementById(t.getAttribute("aria-controls"));
          if (panel) panel.hidden = !on;
        });
        if (list.id) store.set("vv-tab-" + list.id, tab.id);
      };
      tabs.forEach((t) => t.addEventListener("click", () => select(t)));
      const saved = list.id && store.get("vv-tab-" + list.id);
      const hash = location.hash && $(`[role=tab][aria-controls="${location.hash.slice(1)}"]`, list);
      select(hash || (saved && document.getElementById(saved)) || tabs[0]);
    });
  }

  /* Filtros: [data-filterable] contiene filas con data-status / data-type.
     Controles: [data-filter] (estado), #filter-type (select), #filter-search (texto). */
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
      $$(":scope > *", target).forEach((el) => {
        const okStatus = status === "todas" || el.dataset.status === status;
        const okType = !t || el.dataset.type === t;
        const okText = !q || el.textContent.toLowerCase().includes(q);
        el.hidden = !(okStatus && okType && okText);
        if (!el.hidden) shown++;
      });
      const empty = $("#filter-empty");
      if (empty) empty.hidden = shown > 0;
      const count = $("#filter-count");
      if (count) count.textContent = shown;
    }
    $$("[data-filter]").forEach((b) => b.addEventListener("click", () => {
      status = b.dataset.filter;
      $$("[data-filter]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      apply();
    }));
    if (search) search.addEventListener("input", apply);
    if (type) type.addEventListener("change", apply);
    apply();
    target.addEventListener("vv:changed", apply);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initClock();
    initModals();
    initTabs();
    initFilters();
  });

  window.UI = { $, $$, store, toast, hhmm, openModal };
})();
