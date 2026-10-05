# Vigilante Virtual / Video Portero

**Documento base del proyecto (el "norte")**
Versión 0.1 · 2 de octubre de 2026 · Estado: borrador para revisión de la ingeniera

> **Cómo leer este documento.** Cada sección indica su origen:
> - **[Apuntes]**: viene de las notas de las reuniones con la ingeniera.
> - **[Propuesta]**: lo agregó el equipo de análisis para producción y debe ser validado.
> - **[Pendiente]**: no está definido y requiere una decisión (ver sección 15).

---

## Tabla de contenido

1. [Visión y objetivo](#1-visión-y-objetivo)
2. [Alcance](#2-alcance)
3. [Principios de diseño](#3-principios-de-diseño)
4. [Glosario](#4-glosario)
5. [Arquitectura general](#5-arquitectura-general)
6. [Los tres entornos](#6-los-tres-entornos)
7. [Flujo de acceso y tokens](#7-flujo-de-acceso-y-tokens)
8. [Módulos del sistema 360°](#8-módulos-del-sistema-360)
9. [ARGOS: agente de inteligencia artificial](#9-argos-agente-de-inteligencia-artificial)
10. [Hardware y capa de adaptación](#10-hardware-y-capa-de-adaptación)
11. [Seguridad](#11-seguridad)
12. [Cumplimiento legal (Ley 1581 de 2012)](#12-cumplimiento-legal-ley-1581-de-2012)
13. [Operación y requisitos de producción](#13-operación-y-requisitos-de-producción)
14. [Equipo, responsabilidades y dependencias](#14-equipo-responsabilidades-y-dependencias)
15. [Decisiones abiertas y preguntas para la ingeniera](#15-decisiones-abiertas-y-preguntas-para-la-ingeniera)
16. [Fases y hoja de ruta](#16-fases-y-hoja-de-ruta)
17. [Riesgos](#17-riesgos)
18. [Definición de "terminado"](#18-definición-de-terminado)
19. [Próximos pasos inmediatos](#19-próximos-pasos-inmediatos)

---

## 1. Visión y objetivo

**[Apuntes + Propuesta]**

Construir una **plataforma integral de seguridad inteligente** que combina control de acceso biométrico, gestión de cámaras y un agente de IA (ARGOS) que ayuda a distinguir alarmas reales de falsas. El sistema se opera con **soporte humano y soporte automatizado**.

Objetivos específicos:

- Controlar el ingreso y la salida de personas mediante biometría y token.
- Gestionar de forma centralizada las cámaras de cada sede.
- Monitorear eventos y generar alertas con apoyo de IA.
- Reducir las falsas alarmas.
- Operar aun sin internet o sin energía, mediante carnés y soporte humano.
- Cumplir la Ley 1581 de 2012 de protección de datos personales.

**Clientes objetivo [Apuntes]:** universidades, bodegas y conjuntos residenciales.

**Modelo de venta [Apuntes]:** dos modalidades.
1. Una persona detrás del tótem (vigilante humano).
2. Una IA detrás del tótem, con el equipo dando soporte.

**Este es un producto para producción, no un MVP.** Cada entrega debe estar desplegada, monitoreada, segura y con cumplimiento legal, aunque tenga pocas funciones.

---

## 2. Alcance

### Dentro del alcance

- App móvil para usuarios (empleados, residentes, estudiantes, visitantes y administradores).
- Portero Vigilante: entorno entregado al cliente.
- Torre de Control: administración interna.
- ARGOS: agente de IA para clasificación de eventos.
- Software propio de cámaras, adaptable al hardware existente.
- Integración biométrica (facial y huella) y tótem con doble factor.
- Modo contingencia (sin internet o sin energía) con carnés y soporte humano.

### Fuera del alcance inicial **[Propuesta]**

- ARGOS ejecutando acciones críticas por sí solo (abrir puertas, llamar a autoridades).
- Aprendizaje autónomo sin supervisión humana.
- Adaptación completa a los tres tipos de cliente en el primer despliegue.

Estos puntos pasan a fases posteriores (ver sección 16).

---

## 3. Principios de diseño

**[Propuesta]**

1. **Humano en el circuito.** ARGOS recomienda y alerta; una persona decide en eventos críticos.
2. **Seguro ante fallos.** Si algo falla, nadie queda atrapado ni la puerta queda abierta sin control.
3. **Adaptable al hardware.** El software se ajusta al hardware existente del cliente, no al revés.
4. **Multi-cliente desde el día 1.** Un solo sistema, datos separados por cliente.
5. **Privacidad por diseño.** Solo se captura lo necesario y se guarda lo mínimo el menor tiempo posible.
6. **Todo auditable.** Cada acceso y cada acción queda registrado.
7. **Operable.** Monitoreo, respaldos y manuales de operación son parte del producto.

---

## 4. Glosario

| Término | Significado |
|---|---|
| **ARGOS** | Agente automatizador de IA. Recibe eventos, los clasifica, genera alertas y aprende de la retroalimentación. |
| **Portero Vigilante** | Entorno entregado al cliente para controlar al vigilante virtual (dashboard del cliente). |
| **Centro de Control (PGD)** | Entorno interno del equipo para controlar el vigilante virtual. |
| **Torre de Control** | Aplicación de administración de más bajo nivel. Concentra decisiones de la app y del portero virtual. Se explica como "la capital de un país": todo pasa por ahí. |
| **Tótem** | Punto físico de interacción en la entrada, con doble factor de identificación. |
| **Token de sesión** | Mantiene la sesión del usuario en la app. |
| **Token de ingreso** | Credencial temporal de un solo uso para entrar a una zona (vigencia de 15 segundos). |
| **Biométrico** | Dispositivo físico que lee huella o rostro. |
| **HAL** | Capa de adaptación de hardware: interfaz común para cámaras, biométricos y tótems. |
| **Gateway local** | Equipo en cada sede que opera sin internet y sincroniza al volver la conexión. |
| **Tenant** | Cliente (empresa o sede) cuyos datos se mantienen separados de los demás. |
| **SIEE** | Sistema de integración en un entorno de desarrollo enfocado. |
| **Herta** | Empresa de reconocimiento facial y de huellas. Posible proveedor. |
| **n8n** | Herramienta de automatización de flujos, propuesta para orquestar ARGOS. |
| **Clon** | **[Pendiente]** En los apuntes: ARGOS tiene "clones" que guardan información de zonas, empresas o lugares. Definir si es una copia de configuración por sitio o un modelo por cliente. |

---

## 5. Arquitectura general

**[Apuntes + Propuesta]**

```
 [App móvil] ──┐                         ┌── [Portero Vigilante]  (dashboard cliente)
               │                         │
               ▼                         │
        [Backend / API] ─────────────────┼── [Centro de Control]  (dashboard PGD)
        auth + MFA + roles               │
               │                         └── [Torre de Control]   (administración)
   ┌───────────┼─────────────────┐
   ▼           ▼                 ▼
[Base de    [Caché de       [Bus de eventos]
 datos]      tokens]              │
 usuarios,   vigencia 15 s        ├──► [ARGOS]
 accesos,                         │     clasifica, alerta, escala a humano
 auditoría                        ▼
                      [Capa de adaptación de hardware (HAL)]
                       ├─ Cámaras
                       ├─ Biométricos (facial / huella)
                       └─ Tótem y carnés (modo contingencia)

  Todo detrás de VPN entre la sede y el servidor.
  En cada sede: gateway local para operar sin internet.
```

### Decisiones de arquitectura **[Propuesta]**

| Decisión | Razón |
|---|---|
| Backend modular único (no microservicios) | Equipo de 4 personas; menor complejidad y más rápido de operar. |
| Multi-tenant con separación de datos por cliente | El dashboard del cliente y el de PGD son el mismo backend con roles distintos. |
| HAL (capa de adaptación de hardware) | Cumple el requisito de adaptarse al hardware existente. |
| Gateway local por sede | Permite operar sin internet y sincronizar después. |
| ARGOS en capas: reglas → modelos preentrenados → orquestación → retroalimentación humana | Evita depender de "aprendizaje autónomo" desde el inicio. |
| Grabación de video local en la sede | Menos ancho de banda y menos datos sensibles en la nube. |

### Stack tecnológico sugerido **[Propuesta, por validar]**

| Área | Herramienta |
|---|---|
| Backend | Python + FastAPI |
| Base de datos | PostgreSQL |
| Caché y tokens | Redis |
| Eventos | MQTT (Mosquitto o EMQX) |
| App móvil | Flutter |
| Dashboards | React + Vite |
| Video | MediaMTX, OpenCV |
| IA | Python, PyTorch o TensorFlow, YOLO, InsightFace o Herta |
| Orquestación de ARGOS | n8n |
| Seguridad | WireGuard (VPN), TLS, JWT + MFA |
| Infraestructura | Docker, GitHub, CI/CD |
| Monitoreo | Prometheus, Grafana, Sentry |

---

## 6. Los tres entornos

> **Aclaración importante.** En los apuntes la palabra "entornos" se usa con dos sentidos distintos: (a) los **tres componentes** del sistema (App, Portero Vigilante, Torre de Control) y (b) los **tres tipos de cliente** (universidades, bodegas, residencias). Este documento usa **"entornos"** para (a) y **"perfiles de cliente"** para (b). **[Pendiente de confirmar]**

### 6.1 App móvil

**[Apuntes]**

- Usuarios: empleados, residentes, visitantes, administradores.
- Registro de usuario con datos personales y biometría.
- Genera y muestra los tokens. Debe existir un espacio específico para poner el token y validarlo.
- Los tokens duran 15 segundos.
- Solicitud y aprobación de ingresos: el ingreso solo se aprueba cuando quien es visitado lo solicita y se aprueba.
- Funciona solo con el GPS encendido (para saber que la persona está en la zona del edificio).
- Conexión por VPN (la app se usa solo en el edificio).
- Leyenda de Ley 1581 antes de tomar foto o datos.
- Checks de retención de información y de manejo de recursos (prohibido grabar o fotografiar instalaciones).
- Autenticación multi-factor.
- Por el chat nunca se cargan archivos.
- Política de ingreso y salida: no entrar antes ni salir antes o después del horario.
- Leyenda de protección de autor y derechos reservados.
- Protección contra ataques a la app móvil.

### 6.2 Portero Vigilante (entorno del cliente)

**[Apuntes + Propuesta]**

- Dashboard que se entrega al cliente.
- Control de ingreso, validación biométrica, monitoreo de cámaras y gestión de alarmas.
- Interacción mediante el tótem.
- Atención por operador humano o por IA.
- Vista separada de la de PGD: el cliente ve solo lo suyo. **[Pendiente: definir qué ve cada uno]**

### 6.3 Torre de Control (entorno interno)

**[Apuntes + Propuesta]**

- Aplicación de administración de más bajo nivel de control de la app y del portero virtual.
- El filtro más profundo: ahí llegan las actualizaciones que luego se distribuyen a los otros entornos.
- Administración de clientes, sedes, usuarios, roles y parámetros.
- Gestión de incidentes y de ARGOS.
- Monitoreo global, analítica y reportes.

---

## 7. Flujo de acceso y tokens

### 7.1 Flujo registrado en los apuntes

**[Apuntes]**

1. El usuario ingresa a la app con sus datos personales y biométricos; se activa el token.
2. Llega al primer biométrico y pone su huella (en la prueba, "no valida").
3. En la app pone el token en la sección de la zona a la que quiere entrar.
4. El biométrico de esa zona valida.
5. Este proceso ocurre en **todos los niveles de seguridad**.
6. El ingreso por biométrico solo se activa con reconocimiento facial.
7. Existen **dos tokens**: uno para la app y otro para los ingresos.

### 7.2 Inconsistencia a resolver

**[Pendiente, crítico]**

Los apuntes describen el token de dos maneras:

- **Opción A: token como segundo factor.** Siempre se requiere rostro/huella **y** token.
- **Opción B: token como respaldo.** Primero rostro/huella; si falla, se presenta el token.

También aparece la frase "los tokens no están siendo validados por el momento". **Hay que definir una sola opción antes de escribir código.**

### 7.3 Flujo propuesto (Opción A) **[Propuesta]**

```
Usuario ──► App: valida rostro + GPS dentro de la zona
            │
            ▼
        Backend: emite token de ingreso
        (15 s, un solo uso, atado a usuario y zona)
            │
            ▼
Usuario en el tótem/biométrico: presenta rostro o huella + token
            │
            ▼
Gateway local: valida token + persona + horario + aprobación del anfitrión
            │
      ┌─────┴─────┐
      ▼           ▼
   Coincide     No coincide / falla
   → abre       → excepción: soporte humano ve el video y decide
   → audita     → audita
```

### 7.4 Visitantes **[Propuesta]**

1. El visitante se registra y acepta las políticas.
2. El anfitrión aprueba la visita desde su app.
3. Se genera un QR o carné temporal con vigencia limitada.
4. El ingreso queda auditado.

### 7.5 Contingencia: sin internet, sin energía o sin conexión a la nube

**[Apuntes + Propuesta]**

- **Apuntes:** trabajar con carnés y soporte humano.
- **Propuesta:** el gateway local guarda la lista de usuarios autorizados, valida carnés y acumula eventos; al volver la conexión los sincroniza.
- **Pendiente:** tipo de carné (NFC, RFID, QR), quién lo emite y cómo se revoca.

---

## 8. Módulos del sistema 360°

**[Apuntes + Propuesta]**

Los módulos 360° describen el control que existe dentro del aplicativo.

| Módulo | Funciones |
|---|---|
| **Cámaras** | Administración, configuración y asociación por zonas, mantenimiento, vista en vivo, históricos, reproducción de eventos, grabaciones, analítica. |
| **Accesos** | Usuarios, historial, visitantes, permisos, políticas de entrada y salida. Parametrización de las bases de datos que establecen todo lo que se controla. |
| **Biométrico** | Reconocimiento facial, huella, tokens. |
| **ARGOS** | Automatización, alertas, aprendizaje. |
| **Administrativo** | Parámetros, roles, empresas, sedes. |
| **Reportes** | Auditoría, estadísticas, incidentes. |

---

## 9. ARGOS: agente de inteligencia artificial

### 9.1 Qué es

**[Apuntes]**

Agente automatizador que se programa y se enseña para ser autónomo, con autoconocimiento y autoenseñanza. Aprende con **aprendizaje neuronal** para adaptarse a los tres entornos y **debe aprender a entender qué es real y qué es una falsa alarma**. Se construye con n8n y Python. Conoce los entornos y lugares de trabajo, y guarda información de las zonas, empresas y lugares donde estará.

El vigilante virtual tiene **dos procesos**: soporte humano y soporte automatizado.

### 9.2 Niveles de madurez **[Propuesta]**

| Nivel | Capacidad | Condición para salir a producción |
|---|---|---|
| **1** | Recepción de eventos, reglas, clasificación básica, alertas, escalamiento a humano | Primer release |
| **2** | Reconocimiento de patrones, comparación histórica, detección de comportamiento anormal | Cuando existan datos reales de la operación |
| **3** | Aprendizaje autónomo y adaptación por entorno | Solo con humano en el circuito y métricas aprobadas |

### 9.3 Arquitectura de ARGOS **[Propuesta]**

1. **Reglas deterministas:** horarios, zonas, listas, umbrales.
2. **Modelos preentrenados:** detección de personas (YOLO), reconocimiento facial (InsightFace o Herta).
3. **Orquestación (n8n):** recibe el evento, consulta contexto, decide, notifica y escala.
4. **Retroalimentación humana:** el operador marca "falsa alarma sí/no"; esos datos se guardan para reentrenar.
5. **Puntaje de riesgo** por evento en lugar de un simple sí/no.

### 9.4 Reglas de seguridad de ARGOS **[Propuesta]**

- No ejecuta acciones críticas (abrir puertas, llamar a autoridades) sin confirmación humana.
- Un **falso negativo** (evento real clasificado como falsa alarma) es el peor error; se mide y se prioriza reducirlo.
- Todas sus decisiones quedan registradas con el motivo.

### 9.5 Investigación pendiente **[Apuntes]**

Aprendizaje neuronal, n8n a profundidad, Python para nutrir la IA, Herta. Esta investigación debe repartirse y tener límite de tiempo para no bloquear el desarrollo.

---

## 10. Hardware y capa de adaptación

**[Apuntes + Propuesta]**

**Requisito [Apuntes]:** cámaras, huellas, facial y ciberseguridad deben estar dentro de un software propio que se adapte al hardware ya existente.

**Solución propuesta:** una interfaz común (HAL) donde cada marca o modelo es un adaptador.

| Dispositivo | Protocolo / vía de integración | Estado |
|---|---|---|
| Cámaras | ONVIF, RTSP | **[Pendiente]** marcas y modelos |
| Biométricos | SDK del fabricante o Herta | **[Pendiente]** marcas, SDK, licencias |
| Tótem | Por definir | **[Pendiente]** hardware |
| Carnés | NFC, RFID o QR | **[Pendiente]** tecnología |
| Cerraduras y controladores | Relés, controladoras | **[Pendiente]** tipo |

**Acción obligatoria:** levantar un **inventario del hardware real** de la primera sede y una **matriz de compatibilidad**. Es el mayor riesgo técnico del proyecto.

**Seguridad de vida:** definir para cada puerta si es *fail-safe* (se libera ante fallo de energía) o *fail-secure* (queda cerrada). Las salidas de emergencia deben poder abrirse siempre.

---

## 11. Seguridad

### Requisitos [Apuntes]

- Autenticación multi-factor.
- Token de sesión y token de ingreso separados.
- Restricción por geolocalización (GPS encendido).
- Conexión por VPN.
- Registro de accesos y protección contra inyección de código.
- Restricciones de acceso y prevención de ataques a la app móvil.
- Control de horario (entrada y salida).
- Prohibición de carga de archivos por chat.

### Controles adicionales [Propuesta]

| Control | Detalle |
|---|---|
| Liveness (anti-suplantación) | El reconocimiento facial detecta que es una persona real, no una foto o video. |
| Plantillas biométricas | Guardar plantillas cifradas, no imágenes. |
| Cifrado | TLS en todas las comunicaciones y cifrado de datos sensibles en reposo. |
| Secretos | Gestor de secretos; ninguna clave en el código. |
| Auditoría | Registro inmutable de accesos y acciones administrativas. |
| Límite de intentos | Bloqueo ante intentos repetidos fallidos. |
| Validación de entradas | Contra inyección y datos malformados. |
| Pruebas de seguridad | Pentest antes de salir a producción. |
| Modelo de amenazas | Documento previo al desarrollo. |

---

## 12. Cumplimiento legal (Ley 1581 de 2012)

> Este capítulo es una guía técnica, **no asesoría jurídica**. Debe ser revisado por un abogado especialista en protección de datos antes de salir a producción.

### 12.1 Requisitos [Apuntes]

- **Leyenda de la Ley 1581 de 2012** antes de tomar foto o datos.
- **Check de retención de información**, indicando cuánto tiempo se guardará.
- **Check de manejo de recursos**, que prohíbe grabar y fotografiar las instalaciones.
- **Check de autorización de grabación** de las cámaras.
- Leyenda de protección de autor y derechos reservados.

### 12.2 Autorizaciones que debe capturar el sistema

| Autorización | Cuándo |
|---|---|
| Tratamiento de datos personales | Al registrarse |
| Captura de datos biométricos (rostro y huella) | Al registrar biometría; son **datos sensibles** |
| Fotografías | Antes de tomar foto |
| Grabación por cámaras | Al ingresar a la sede |
| Política de retención | Visible antes de aceptar |

Cada aceptación se guarda con fecha, versión del texto y usuario.

### 12.3 Pendientes legales **[Propuesta]**

- Definir quién es **responsable** y quién **encargado** del tratamiento (PGD o el cliente).
- Contratos de transmisión de datos con cada cliente.
- Política de tratamiento y manual interno de datos.
- **Registro en el RNBD** (Registro Nacional de Bases de Datos) si aplica.
- Tratamiento especial si hay **menores de edad** (universidades, residencias).
- Decidir si los datos se almacenan **en Colombia** o fuera (transferencia internacional).
- Plazos de retención por tipo de dato: biométricos, video y registros de acceso.
- Procedimiento para atender derechos del titular (consulta, corrección, supresión).

---

## 13. Operación y requisitos de producción

**[Propuesta]**

| Área | Requisito |
|---|---|
| **Entornos** | Desarrollo, staging y producción separados. Nada se prueba directo en producción. |
| **CI/CD** | Despliegue automatizado con pruebas y capacidad de reversa (rollback) en minutos. |
| **Infraestructura** | Definida como código, reproducible. |
| **Disponibilidad** | Definir SLA objetivo **[Pendiente]** y quién da soporte 24/7. |
| **Respaldos** | Automáticos, con restauración probada. |
| **Recuperación ante desastres** | Plan documentado con tiempos objetivo. |
| **Monitoreo** | Métricas, logs, alertas, health check de cada cámara y biométrico. |
| **Modo degradado visible** | El dashboard muestra si la sede está en línea, sin internet o en contingencia. |
| **Runbooks** | Guía de "qué hago si falla X" para cada componente crítico. |
| **Pruebas** | Automáticas, de carga, de seguridad y en sitio real (corte de luz, corte de internet, hora pico). |
| **Salida por anillos** | Equipo interno → grupo piloto → sede completa. |
| **Modo sombra** | Al inicio el sistema registra, pero la puerta sigue con el método actual para comparar. |
| **Plan B físico** | Carnés y vigilante humano siempre disponibles. |
| **Onboarding de sede** | Procedimiento y plantilla para instalar un cliente nuevo ("clon" de configuración). |
| **Capacitación** | Manuales para el cliente y para los operadores. |
| **Facturación** | Medición por sede, cámara o acceso **[Pendiente: modelo de cobro]**. |

---

## 14. Equipo, responsabilidades y dependencias

### 14.1 Asignaciones [Apuntes]

| Integrante | Cargo sugerido | Proyecto asignado | Despliegue | Trabaja con |
|---|---|---|---|---|
| **Anderson** | Líder técnico de ARGOS y Torre de Control | Torre de Control, ARGOS y software de cámaras | 1 | Willi (ARGOS y cámaras); Sebastián (Torre de Control) |
| **Willi** | Desarrollador del Portero Vigilante y video | Portero Vigilante, ARGOS y software de cámaras | 2 | Anderson (ARGOS y cámaras); Nicolás (biométricos y tótem) |
| **Nicolás** | Desarrollador de app móvil y biometría | App móvil e integración de biométricos | 3 | Willi (validación en tótem); Sebastián (seguridad y tokens) |
| **Sebastián** | Arquitecto, DevOps y seguridad | Definición de los 3 entornos y Torre de Control | 4 | Anderson (Torre de Control); Nicolás y Willi (arquitectura) |

> Los **cargos son una propuesta**: los apuntes solo definen asignaciones. El significado exacto de "Despliegue 1 a 4" está **pendiente** (se asume orden de entrega de cada pieza).

### 14.2 Entregables por persona **[Propuesta]**

- **Anderson:** arquitectura de ARGOS, módulos de negocio de la Torre de Control, diseño del software de cámaras, investigación de Herta y n8n.
- **Willi:** dashboard del cliente, video en vivo, flujo de alertas, apoyo en ARGOS.
- **Nicolás:** app móvil, generación y validación de tokens, adaptadores de biométricos.
- **Sebastián:** arquitectura transversal, multi-tenant, base de la Torre de Control, VPN, DevOps, seguridad, gateway local, observabilidad.

### 14.3 Vacíos detectados

- **Nadie tiene asignado QA.** Propuesta: cada persona prueba su módulo con revisión cruzada.
- **No hay responsable técnico final** que desempate decisiones de arquitectura.
- **No hay dueño de producto** que priorice y defina el alcance.
- **Anderson concentra demasiado:** Torre de Control, ARGOS, cámaras, investigación y Herta. Riesgo de cuello de botella.
- **Anderson y Willi comparten ARGOS y cámaras** sin una frontera clara. Deben definir el **contrato de eventos** el primer día.

---

## 15. Decisiones abiertas y preguntas para la ingeniera

Las preguntas están ordenadas por prioridad. Las marcadas con ⭐ son las diez más urgentes.

### Alcance y entrega

1. ⭐ ¿Qué significa exactamente "en producción"? ¿Un edificio real con usuarios reales o la plataforma lista para el primer cliente?
2. ⭐ ¿Hay un cliente o sede piloto definido? ¿De qué tipo?
3. ¿Hay fecha comprometida con el cliente y penalizaciones por incumplirla?
4. ¿Qué entra sí o sí en la primera salida y qué puede ir en una segunda fase?
5. ⭐ ¿Cuántos usuarios, accesos diarios, cámaras y biométricos manejará el primer despliegue?

### Hardware e infraestructura

6. ⭐ ¿Qué cámaras, biométricos y tótems existen en el sitio (marcas, modelos, protocolos)? ¿Ya están instalados y accesibles en red?
7. ¿Qué presupuesto hay para infraestructura, licencias y hardware?
8. ⭐ ¿Dónde se aloja el sistema: nube, servidor propio en el edificio o híbrido?
9. ¿Hay UPS, planta eléctrica y enlace de internet de respaldo?
10. ¿Qué disponibilidad se necesita (por ejemplo 99,9 %) y quién da soporte 24/7?

### Biometría y Herta

11. ¿Existe contrato, licencia o SDK de Herta? ¿Quién lo gestiona y cuánto cuesta?
12. ¿La verificación biométrica la hace el dispositivo o nuestro software?
13. ¿Cuál es el flujo de excepción cuando alguien no valida (huella dañada, rostro no reconocido)?

### Flujo de acceso

14. ⭐ ¿El token es segundo factor (Opción A) o respaldo (Opción B)? ¿Cuál es el flujo definitivo?
15. ¿El token de 15 segundos es de un solo uso y se genera tras reconocimiento facial?
16. ¿Cómo entran los visitantes sin app?
17. ¿Qué tecnología tienen los carnés (NFC, RFID, QR) y quién los emite?
18. ¿El GPS obligatorio aplica solo a la solicitud desde la app o también a la entrada física?

### ARGOS e IA

19. ⭐ ¿Qué es exactamente una "alarma" que ARGOS debe clasificar (intrusión, persona no autorizada, puerta forzada, comportamiento sospechoso)?
20. ¿Hay datos históricos (video o eventos) para entrenar o se parte desde cero?
21. ¿Qué tolerancia hay a falsos positivos y falsos negativos?
22. ⭐ ¿ARGOS puede ejecutar acciones por sí mismo o solo recomendar y alertar?
23. ¿"Aprendizaje neuronal" significa entrenar modelos propios o ajustar modelos existentes?
24. ¿Qué es un "clon" de ARGOS?

### Legal

25. ⭐ ¿Quién es responsable y quién encargado del tratamiento de datos?
26. ¿Cuánto tiempo se retienen biométricos, video y registros de acceso?
27. ¿Se registrará la base de datos en el RNBD?
28. ¿Los datos se almacenan en Colombia o pueden salir del país?
29. ¿Hay abogado o consultor de protección de datos involucrado?
30. ¿Habrá menores de edad en las sedes?

### Producto y negocio

31. ¿El multi-tenant es una instalación por cliente o una plataforma compartida con datos separados?
32. ¿Qué ve cada dashboard (cliente vs. PGD)?
33. ⭐ ¿Quién opera el soporte humano (personal propio, del cliente o de un tercero) y en qué turnos?
34. ¿Cómo se cobra el servicio?

### Equipo

35. ¿Los cuatro trabajan al 100 % en el proyecto?
36. ¿Quién es el responsable técnico final y quién el dueño de producto?
37. ¿Qué significa "Despliegue 1, 2, 3, 4"?
38. ¿Hay acceso continuo a la ingeniera y al cliente para resolver dudas?

---

## 16. Fases y hoja de ruta

**[Propuesta]** Sin fechas fijas hasta responder la sección 15. La investigación y el diseño corren **en paralelo** con el desarrollo.

| Fase | Contenido | Resultado |
|---|---|---|
| **0. Fundamentos** | Decisiones abiertas (flujo de token, hosting, Herta, hardware), inventario, requisitos no funcionales, modelo de amenazas, plan legal | Documento de decisiones y backlog priorizado |
| **1. Plataforma base** | Repositorios, CI/CD, entornos, multi-tenant, autenticación + MFA, auditoría, observabilidad, VPN | Esqueleto desplegable en producción |
| **2. Acceso** | App, tokens, biometría, gateway local, modo offline, carnés, visitantes | Control de acceso operando en un sitio |
| **3. Cámaras** | Streaming, grabación local, eventos, health checks | Video integrado al acceso |
| **4. ARGOS v1** | Eventos, reglas, nivel 1, alertas, escalamiento a humano, retroalimentación de falsas alarmas | Alertas con humano en el circuito |
| **5. Salida a producción** | Pruebas de carga, seguridad y contingencia, modo sombra, despliegue por anillos, runbooks | Sede piloto en producción |
| **6. Escalado** | Herta definitivo, nuevo hardware, perfiles de cliente (universidad, bodega, residencia), ARGOS niveles 2 y 3 | Segundo y tercer cliente |

### Orden de trabajo sugerido para las primeras dos semanas **[Propuesta]**

**Semana 1: base**
- Lunes: contratos de API y de eventos, modelo de datos, repositorios, entornos, inventario de hardware.
- Martes: autenticación, MFA, roles, multi-tenant, VPN, respaldos.
- Miércoles: servicio de tokens y flujo de consentimiento Ley 1581.
- Jueves: adaptadores del hardware real y gateway local con cola offline.
- Viernes: flujo completo en staging (app → token → biométrico → apertura → auditoría).

**Semana 2: integración y salida**
- Lunes: visitantes, aprobación del anfitrión, horarios, GPS, carnés.
- Martes: ARGOS v1 (detección de personas, reglas, n8n, escalamiento).
- Miércoles: dashboards (video, historial, alertas, separación cliente / PGD).
- Jueves: pruebas de carga, seguridad y contingencia; monitoreo.
- Viernes: salida en modo asistido y runbook de soporte.

> Estas dos semanas solo son realistas si el hardware está accesible, el flujo de token está definido y se acota el alcance de la primera salida. Ver sección 17.

---

## 17. Riesgos

| # | Riesgo | Impacto | Mitigación |
|---|---|---|---|
| 1 | Hardware sin API o SDK abierto | Bloquea integración y cronograma | Inventario y matriz de compatibilidad en la fase 0 |
| 2 | Licencia de Herta sin resolver | Bloquea reconocimiento facial definitivo | Confirmar licencia y usar un adaptador alterno mientras tanto |
| 3 | Datos biométricos sin asesoría legal | Sanciones y pérdida de confianza | Abogado especialista antes de salir |
| 4 | Concentración de trabajo en una persona | Cuello de botella | Redistribuir cargas y revisión cruzada |
| 5 | Fallas que dejen personas atrapadas o puertas abiertas | Riesgo físico y de seguridad | Definir fail-safe / fail-secure, plan B físico |
| 6 | Falsos negativos de ARGOS | Eventos reales sin atención | Humano en el circuito, métricas de falsos negativos |
| 7 | Flujo de token sin definir | Retrabajo en app, backend y biométricos | Decidirlo en la fase 0 |
| 8 | Alcance inabarcable en el plazo | Entrega incompleta o insegura | Acordar qué entra en la primera salida |
| 9 | Sin responsable técnico ni dueño de producto | Decisiones bloqueadas | Nombrar ambos roles |
| 10 | Caída de energía o internet en la sede | Sede sin servicio | Gateway local, carnés, soporte humano, UPS |

---

## 18. Definición de "terminado"

**[Propuesta]** Un módulo se considera terminado para producción solo si cumple todo lo siguiente:

- [ ] Funciona de punta a punta en staging.
- [ ] Tiene pruebas automáticas y revisión de código por otra persona.
- [ ] Pasó validación de seguridad (entradas, autenticación, permisos).
- [ ] Registra auditoría de sus acciones.
- [ ] Respeta la separación por cliente (multi-tenant).
- [ ] Tiene monitoreo y alertas.
- [ ] Tiene manejo de fallos y modo degradado probado.
- [ ] Cumple los requisitos legales aplicables (consentimientos, retención).
- [ ] Está documentado (API, operación, runbook).
- [ ] Se puede revertir (rollback) rápidamente.

---

## 19. Próximos pasos inmediatos

1. **Reunión con la ingeniera** para responder las preguntas marcadas con ⭐ de la sección 15.
2. **Fijar el flujo de token** (Opción A o B) y el significado de "entornos" y "clon".
3. **Levantar el inventario de hardware** de la sede piloto.
4. **Definir el contrato de eventos** entre Anderson y Willi.
5. **Nombrar** responsable técnico, dueño de producto y responsable de QA.
6. **Contactar asesoría legal** en protección de datos y confirmar licencia de Herta.
7. **Crear el repositorio**, los entornos y el backlog con las fases de la sección 16.
8. **Actualizar este documento** con las respuestas y emitir la versión 0.2.

---

### Historial de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| 0.1 | 2 de octubre de 2026 | Primera versión consolidada a partir de los apuntes y el análisis de producción |
