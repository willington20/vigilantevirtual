# Vigilante Virtual · Dashboards (mockup HTML + CSS)

Hay tres dashboards separados, uno por rol. Son maquetas navegables: los datos son de ejemplo y no se conectan a ningún backend.

| Carpeta | Rol | Pantallas |
|---|---|---|
| `vigilante/` | Guardia de portería | Panel, Accesos, Cámaras, Novedades, Historial |
| `admin/` | Administrador del cliente (su sitio) | Resumen, Personal, Destinos, Horarios, Dispositivos, Vigilantes, Configuración, Reportes |
| `general/` | Jefe mayor / Torre de Control (PGD) | Monitoreo, Sitios, Incidentes, Cámaras, Clientes, Usuarios, Argos, Cumplimiento, Despliegues, Reportes |

## Cómo verlo

**Opción 1: doble clic (Windows).** Abre `iniciar.bat`. Levanta un servidor local y abre el navegador en la pantalla de ingreso (<http://localhost:5173/login.html>). Para detenerlo, cierra la ventana negra.

**Opción 2: desde una terminal**, dentro de la carpeta `dashboards`:

```bash
python -m http.server 5173
```

Luego abre <http://localhost:5173> en el navegador.

**Opción 3: sin servidor.** Abre `index.html` con doble clic. No usa módulos ni peticiones de red, así que debería funcionar, pero solo se probó con el servidor. Úsalo para que todo se comporte igual que en el despliegue real.

> Necesitas Python 3 (`python --version`). Con VS Code, la extensión **Live Server** también sirve: clic derecho en `index.html` → *Open with Live Server*.

## Ingreso con clave y cambio de dashboard

1. Abre `login.html`; si entras a cualquier página sin sesión, te lleva ahí.
2. **La primera vez en cada navegador** defines una clave para cada perfil: Vigilante, Administrador del sitio y Torre de Control. Las reglas son mínimo 8 caracteres, letras y números, y nada de claves de prueba como `1234`, `2002` o `9999`. Solo se guarda un hash PBKDF2 con sal en ese navegador; **no hay claves en el código ni en el repositorio**.
3. Eliges el perfil y escribes la clave:
   - **Vigilante:** entra solo a `/vigilante`.
   - **Administrador del sitio:** entra solo a `/admin`.
   - **Torre de Control:** entra al **panel de dashboards** (`index.html`) y desde ahí a los tres. En la barra superior tiene el botón «Dashboards» para cambiar.
4. Si un perfil intenta abrir otro dashboard, se le devuelve a su inicio.
5. Después de 5 claves incorrectas, el ingreso se bloquea 5 minutos. La sesión dura 8 horas (un turno) y se cierra con «Salir» o al cerrar el navegador.
6. «Restablecer claves de demostración» pide la clave de la Torre de Control.

**Claves fijas de demostración.** Si existe `shared/js/demo-accounts.local.js`, que guarda solo los hashes, el login usa esas cuentas y no pide definir claves. Las claves en texto están en `CLAVES-DEMO.local.txt`. Ambos archivos están en `.gitignore` y **no se suben al repositorio**. Si los borras, se vuelve al paso 2.

> ⚠️ **Esto es una maqueta del flujo, no seguridad real.** Todo corre en el navegador, así que quien tenga los archivos puede saltarse la pantalla. En producción el backend valida la clave, el **segundo factor (MFA)**, el rol y la sesión en cada petición (JWT + MFA + roles), y las APIs rechazan a quien no tenga permiso. Los comentarios `INTEGRACIÓN` de `shared/js/auth.js` marcan dónde va cada llamada.

## Estructura

```
dashboards/
├── login.html            ingreso con clave por perfil
├── index.html            panel para cambiar de dashboard (Torre de Control)
├── iniciar.bat           levanta el servidor local (Windows)
├── shared/               lo común a los 3
│   ├── css/  tokens.css (colores, tema claro/oscuro) · base.css · layout.css · components.css
│   └── js/   auth.js (sesión y acceso por rol, en todas las páginas) · login.js
│             ui.js (tema, modales, pestañas, filtros) — lo usan admin y general
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
