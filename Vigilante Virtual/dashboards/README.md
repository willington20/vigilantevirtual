# Vigilante Virtual · Dashboards (mockup HTML + CSS)

Hay tres dashboards separados, uno por rol. Son maquetas navegables: los datos son de ejemplo y no se conectan a ningún backend.

| Carpeta | Rol | Pantallas |
|---|---|---|
| `vigilante/` | Guardia de portería | Panel, Accesos, Cámaras, Novedades, Historial |
| `admin/` | Administrador del cliente (su sitio) | Resumen, Personal, Destinos, Horarios, Dispositivos, Vigilantes, Configuración, Reportes |
| `general/` | Jefe mayor / Torre de Control (PGD) | Monitoreo, Sitios, Incidentes, Cámaras, Clientes, Usuarios, Argos, Cumplimiento, Despliegues, Reportes |

## Cómo verlo

**Opción 1: doble clic (Windows).** Abre `iniciar.bat`. Levanta un servidor local y abre el navegador en <http://localhost:5173>. Para detenerlo, cierra la ventana negra.

**Opción 2: desde una terminal**, dentro de la carpeta `dashboards`:

```bash
python -m http.server 5173
```

Luego abre <http://localhost:5173> en el navegador.

**Opción 3: sin servidor.** Abre `index.html` con doble clic. No usa módulos ni peticiones de red, así que debería funcionar, pero solo se probó con el servidor. Úsalo para que todo se comporte igual que en el despliegue real.

> Necesitas Python 3 (`python --version`). Con VS Code, la extensión **Live Server** también sirve: clic derecho en `index.html` → *Open with Live Server*.

## Estructura

```
dashboards/
├── index.html            índice con los 3 dashboards
├── iniciar.bat           levanta el servidor local (Windows)
├── shared/               lo común a los 3
│   ├── css/  tokens.css (colores, tema claro/oscuro) · base.css · layout.css · components.css
│   └── js/   ui.js (tema, modales, pestañas, filtros) — lo usan admin y general
├── vigilante/            css/vigilante.css · js/vigilante.js · 5 páginas
├── admin/                css/admin.css     · js/admin.js     · 8 páginas
└── general/              css/general.css   · js/general.js   · 10 páginas
```

Cada dashboard tiene su color: vigilante azul, admin violeta y general verde azulado. Todos tienen tema claro y oscuro (botón de luna).

## Para integrar con el backend

- En los `.js`, los comentarios `INTEGRACIÓN` marcan dónde va cada llamada real: video del servicio de ingesta (Anderson), eventos de Argos, orden de apertura, guardado de configuración y auditoría.
- Tokens, app móvil y biometría **no son parte de este entregable** (Nicolás / Sebastián). Aquí solo se muestran sus resultados.
- Reglas que la interfaz ya respeta y que el backend también debe imponer:
  - Ninguna apertura a distancia sin confirmación de portería.
  - Argos nunca abre solo en un caso dudoso.
  - Una ruta de evacuación no puede ser fail-secure.
  - Las alertas se cierran con comentario.
  - Los códigos y contraseñas nunca se muestran.
  - Los documentos se ven enmascarados (Ley 1581).
