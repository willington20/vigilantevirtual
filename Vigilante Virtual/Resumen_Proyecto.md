# Vigilante Virtual / Video Portero: resumen del proyecto

> Resumen compacto para estar al día. Junta los apuntes de las reuniones con la ingeniera (1 oct 2026), el documento base (`Vigilante_Virtual_Documentacion.md`, v0.1) y el plan vigente (`Plan_de_Trabajo_Vigilante_Subida_2.md`).
> **Si algo choca, manda el plan de la Subida 2.**
> Última actualización: 5 de octubre de 2026.

---

## 0. Nuestro alcance (lo que entregamos nosotros)

**Solo los dashboards y el software de cámaras.** Coincide con la fila de **Willi** en la tabla de equipo: Portero Vigilante (dashboard del cliente), cámaras y la parte de Argos que se ve en el puesto.

| Sí es nuestro | No es nuestro (lo consumimos o lo mostramos) |
|---|---|
| Los 3 dashboards: `/vigilante`, `/admin`, `/general` | **Tokens, app móvil y biometría** → Nicolás (con Sebastián en la seguridad de los tokens) |
| Vista de cámaras: 1/4/9, estado, pantalla completa, grabación por rango | **Ingesta de video y backend de Argos** → Anderson (nosotros solo mostramos lo que entrega su servicio) |
| Mostrar las alertas de Argos en vivo y marcarlas como atendida o falsa alarma | **Arquitectura, entornos, VPN y DevOps** → Sebastián |
| Separar la vista del cliente de la vista PGD | **Kiosco y videoportero** (hardware, SIP, relé) → no asignado aquí |

> En los dashboards, lo que no es nuestro solo aparece como **dato que se muestra**: por ejemplo, el estado de un acceso o el resultado de una validación. No lo implementamos.

---

## 1. Qué es

Es una plataforma de seguridad física y digital con IA. Junta control de acceso biométrico, cámaras con software propio y un agente de IA, **Argos**, que clasifica eventos y separa las alarmas reales de las falsas.

- **Clientes:** universidades, bodegas y conjuntos residenciales. El sistema se adapta a cada uno: destinos, roles y tipo de personal.
- **Se vende de dos formas:** (1) un vigilante humano detrás del tótem o (2) una IA detrás del tótem, con el equipo PGD dando soporte.
- **Dos procesos de operación:** soporte humano y soporte automatizado (IA). Si falta la luz o el internet, entra el soporte humano con carnés.
- **El software se adapta al hardware que ya existe,** no al revés. Cámaras, huella, facial y ciberseguridad van dentro de un software propio.
- **Es para producción, no un MVP:** desplegado, monitoreado, seguro y con cumplimiento legal.

**Sitio piloto:** bodega **Paramericana** (kiosco `Paramericana-01`). **Producción:** <https://centrodegestion.pgd.com.co>

---

## 2. Componentes ("entornos")

| Entorno | Para quién | Qué hace |
|---|---|---|
| **App móvil** | Empleados, residentes, estudiantes, visitantes, administradores | Registro con datos y biometría, tokens, solicitud y aprobación de visitas |
| **Kiosco / Tótem** (`/kiosco`) | Visitante en portería | Registro con cédula, foto, destino, videollamada con el vigilante, impresión del carnet. Doble factor |
| **Portero Vigilante** | Cliente (producto entregable) | Operación de la portería y configuración del sitio |
| **Torre de Control / Centro de Control** | PGD (interno) | "La capital del país": administración de más bajo nivel. Es el filtro más profundo, por donde pasan las actualizaciones que luego se reparten a los demás entornos |

> **Ojo con la palabra «entornos».** En los apuntes significa dos cosas: los componentes (App, Portero, Torre) y los tipos de cliente (universidad, bodega, residencia).

**Ya existe en el servidor:** `/kiosco`, `/vigilante` y `/admin`, la videollamada WebRTC, el holograma 3D, el directorio de destinos, la impresión por agente y el lector QR/RFID con la puerta (apagada de fábrica). El código **no está en esta carpeta**.

---

## 3. Dashboards: decisión tomada (3 separados, uno por rol)

| Dashboard | Rol | Alcance |
|---|---|---|
| `/vigilante` | **Guardia** | Su portería: Panel (solicitudes y alertas de Argos), Accesos (abrir puerta / «NO se abrió»), Cámaras (1/4/9, grabación por rango de hora), Novedades, Historial |
| `/admin` | **Administrador del cliente** | Su sitio: destinos, personal autorizado, horarios y turnos, puertas (fail-safe o fail-secure), cámaras y videoporteros, cuentas de los vigilantes, reportes |
| `/general` | **Jefe mayor (Torre / vista PGD)** | **Todo**: todos los clientes y sitios, monitoreo global, la portería y la configuración de cualquier sitio (pestañas Portería y Configuración), usuarios y roles, acciones de Argos, retención de datos, auditoría y reportes |

- Se hacen en **HTML + CSS**, con estilos base compartidos en `shared/` (tokens, componentes).
- El documento base sugiere React + Vite como stack final.
- **Estado (5 oct 2026):** los 3 mockups están hechos en `dashboards/` (5 + 8 + 10 pantallas). Cómo verlos: `dashboards/iniciar.bat` o `python -m http.server 5173` dentro de `dashboards/`. Detalle en `dashboards/README.md`.
- El kiosco no es nuestro entregable.

---

## 4. Seguridad y "autenticador" (apuntes)

- **Multifactor:** segunda contraseña.
- **Dos tokens:** uno de **sesión** (app) y otro de **ingreso** (15 s, un solo uso). El token llega y se valida en la base.
- **VPN:** la app solo se usa en el edificio.
- **GPS encendido** para que la app funcione (confirma que la persona está en la zona).
- **Registro de accesos** y protección contra inyección de código y contra ataques a la app.
- **Por el chat nunca se carga ningún archivo ni dato.**
- **Política de entrada y salida:** no entrar antes ni salir antes o después del horario.
- **Extras propuestos:** liveness (rechaza fotos o videos), plantillas biométricas cifradas (no fotos), TLS, gestor de secretos, auditoría inmutable, límite de intentos y pentest antes de producción.

## 5. Legal: Ley 1581 de 2012

**Antes de tomar una foto o un dato**, se muestran la leyenda y estos checks. Cada aceptación se guarda con fecha, versión del texto y usuario.
- Tratamiento de datos personales y **captura biométrica** (son datos sensibles).
- **Retención:** cuánto tiempo se guarda la información.
- **Manejo de recursos:** se prohíbe grabar o fotografiar las instalaciones.
- Autorización de **grabación de cámaras**.
- Leyenda de **derechos de autor y derechos reservados**.
- **Medio alterno obligatorio:** nadie está obligado a dar su rostro. Puede entrar con tarjeta, PIN, QR o videollamada.

**Pendiente:** quién es responsable y quién encargado del tratamiento (PGD o el cliente), plazos de retención, registro en el RNBD, menores de edad y revisión por un abogado.

---

## 6. Flujo de acceso

**Apuntes:** el usuario entra a la app con sus datos y biometría, y se activa el token. Llega al biométrico y la huella no valida. Pone el token en la app, en la sección de la zona, y el biométrico de esa zona valida. Esto se repite en cada nivel de seguridad. El biométrico se activa con reconocimiento facial.

⚠️ **Sin definir:** ¿el token es **segundo factor** (Opción A) o **respaldo** (Opción B)? *No es nuestra decisión: le toca a Nicolás y Sebastián.* Para los dashboards solo importa mostrar el resultado del acceso.

**Visitantes:** se registran (cédula + foto) → el anfitrión o el vigilante aprueba → se imprime el carnet o QR temporal → entran, y todo queda auditado.

**Videoportero:** la persona llega → el equipo reconoce el rostro → **el hub decide** (autorizados, horario, turno) → abre la cantonera.

**Sin internet o sin luz:** el hub o gateway local valida QR, RFID y rostros contra una lista local, guarda los eventos en cola y sincroniza al volver la conexión. También se usan carnés y soporte humano.

---

## 7. Módulos 360°

| Módulo | Contenido |
|---|---|
| Cámaras | Software propio: configuración por zonas, vista en vivo, grabaciones, eventos, analítica |
| Accesos | Usuarios, **historial**, visitantes, permisos, políticas de entrada y salida, parametrización |
| Biométrico | Facial, huella, tokens (posible proveedor: **Herta**) |
| Argos | Automatización, alertas, aprendizaje |
| Administrativo | Parámetros, roles, empresas, sedes |
| Reportes | Auditoría, estadísticas, incidentes |

---

## 8. Argos (IA)

- Se construye con **n8n + Python** y aprende con aprendizaje neuronal para distinguir lo real de una falsa alarma.
- Conoce los sitios mediante **"clones"**: información por zona, empresa o lugar. Todavía falta definir qué es exactamente un clon.
- **Niveles:** 1) eventos, reglas y alertas → 2) patrones e historial → 3) aprendizaje autónomo, siempre con un humano en el circuito.
- **Reglas fijas:**
  - **Nunca abre la puerta solo si hay duda.**
  - Ninguna apertura a distancia ocurre sin confirmación de portería.
  - Todo queda auditado.
  - El peor error es un falso negativo.
- **En la Subida 2:**
  - Las alertas llegan en vivo al vigilante (pitido, Panel, Novedades) y desde la alerta se abre la cámara del evento.
  - El vigilante marca la alerta como «atendida» o «falsa alarma» con un comentario, y eso alimenta el entrenamiento.
  - **Acciones automáticas:** crear la novedad, sonar la alerta, enfocar la cámara y escalar a la Torre si nadie atiende en 2 minutos.
  - **Apertura automática** solo si la persona está autorizada y en su horario.
  - Cada minuto revisa que respondan el kiosco, el videoportero, las cámaras, la impresora, el lector, el controlador y el relé.

---

## 9. Plan vigente: Subida 2 (resumen)

**Objetivo:** que la portería atienda visitantes reales con el hardware real.
**Hardware del kiosco (Hard 014):** pantalla táctil de 15", mini PC, escáner de documentos, impresora de 80 mm, lector de código de barras, impresora de etiquetas, cámara web y bocina. Faltan por comprar el videoportero y la cantonera.

- **Kiosco:**
  - Modo kiosco y escaneo de la cédula (PDF417 → nombre, número, fecha de nacimiento).
  - Foto: la del visitante temporal se borra al vencer la retención; del personal se guarda solo la plantilla facial.
  - Videollamada con TURN propio (coturn): conecta en menos de 5 s, 10 de 10 intentos.
  - Imprime el carnet, el sticker QR y el ticket.
  - Muestra un aviso cuando no hay conexión.
- **Puerta:**
  - Relé real: abre en 15 s como máximo, la orden no se repite y se confirma con el servidor. Si falla, el vigilante ve «NO se abrió».
  - QR o RFID vencido o desconocido: no abre y muestra el motivo.
  - Se quitan los códigos de prueba (`2002`, `1234`, `9999`).
- **Videoportero:**
  - El hub decide y guarda la lista local. Hay una sola fuente de rostros.
  - Puente SIP ↔ WebRTC (Asterisk o Janus) para que la llamada entre al puesto del vigilante.
  - El relé queda del lado protegido de la puerta y se conecta por OSDP.
  - Sensor de puerta forzada o abierta demasiado tiempo, más antisabotaje.
  - Fail-safe o fail-secure por puerta.
  - Ciberseguridad: HTTPS, sin clave de fábrica, VLAN aparte, syslog hacia Centinela.
  - **Piloto con una unidad** antes de la compra grande, con acta.
- **Cámaras (vigilante):**
  - El video viene del servicio de ingesta de Anderson; no hay conexión directa a la cámara.
  - Vista 1/4/9, pantalla completa, estado de cada cámara y grabación por rango de hora.
- **Administración:** configuración por sitio y roles vigilante / admin del sitio / supervisor.
- **Salida:** recorrido completo en staging → pruebas de puerta y de cortes → PR a `main` → producción → manuales en «Entrega 2» de `Proyecto-Vv` → **aprobación de Dani**.

**Por confirmar:** modelos de videoportero, cantonera y controlador; qué puertas son fail-safe; tiempo de retención de los datos de visitantes.

---

## 10. Equipo

| Persona | Cargo sugerido | Proyecto asignado | Despliegue | Trabaja con |
|---|---|---|---|---|
| **Anderson** | Líder técnico de Argos y Torre de Control | Torre de Control, Argos (IA), software de cámaras (servicio de ingesta) | 1 | Willi (Argos y cámaras), Sebastián (Torre) |
| **Willi** ⬅ *nuestra parte* | Desarrollador del Portero Vigilante y video | Portero Vigilante (dashboard del cliente), Argos, software de cámaras | 2 | Anderson (Argos y cámaras), Nicolás (biométricos y tótem) |
| **Nicolás** | Desarrollador de app móvil y biometría | App móvil, **tokens**, integración biométrica (`POST /api/biometric/verify`) | 3 | Willi (validación en el tótem), Sebastián (seguridad y tokens) |
| **Sebastián** | Arquitecto, DevOps y seguridad | Definición de los 3 entornos, Torre de Control | 4 | Anderson (Torre), Nicolás y Willi (arquitectura entre entornos) |

**Vacíos detectados:** no hay QA, ni responsable técnico final, ni dueño de producto, y Anderson está sobrecargado.

**Por investigar:** aprendizaje neuronal, n8n a fondo, Python para IA, Herta. SIEE = Sistema de Integración en un Entorno de desarrollo Enfocado.

---

## 11. Stack sugerido (por validar)

FastAPI · PostgreSQL · Redis (tokens) · MQTT · Flutter (app) · React + Vite (dashboards) · MediaMTX / OpenCV · YOLO + InsightFace o Herta · n8n · WireGuard + TLS + JWT/MFA · Docker + CI/CD · Prometheus / Grafana / Sentry.
