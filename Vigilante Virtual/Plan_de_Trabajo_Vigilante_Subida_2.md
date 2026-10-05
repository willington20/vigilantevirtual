# Plan de trabajo: Vigilante, Videoportero y Argos (Subida 2)

> Este es el plan de trabajo vigente del proyecto. Se guarda tal cual fue entregado, solo con formato Markdown.
> Las casillas `- [ ]` se marcan como `- [x]` a medida que se completan.

---

## 1. Objetivo

Que el kiosco de portería de la bodega Paramericana y los demás sitios atiendan visitantes de verdad: el visitante se registra y pide ingreso en el kiosco o en el videoportero externo, el vigilante lo ve, lo escucha y decide desde el centro de operaciones, y la puerta, el carnet y cada evento funcionan con el hardware real.

**Hardware del kiosco (Hard 014):** monitor touch 15", mini PC, escáner de documentos, impresora de 80 mm, lector de código de barras, impresora de etiquetas, cámara web y bocina. A esto se suman el videoportero externo y la cantonera.

Argos valida la conexión y propone o ejecuta acciones de forma automática con inteligencia artificial.

**Flujo del videoportero:**

```
La persona llega al videoportero externo
        → el equipo hace el reconocimiento facial
        → el hub (centro de gestión) valida
        → si pasa, apertura remota de la cantonera
```

---

## 2. Punto de partida

**Ya existe:**
- Los tres entornos sobre un solo servidor: `/kiosco`, `/vigilante`, `/admin`.
- Videollamada WebRTC.
- Holograma 3D.
- Directorio de destinos.
- Impresión por agente.
- Lector de QR/RFID con la puerta (apagada de fábrica).

**Pendiente según el README:**
- Probar todo con el hardware real.
- Un TURN propio.
- Sincronización con GCP.
- Conexión en operación con Argos.

**Por comprar:** el videoportero externo y la cantonera.

---

## 3. Requerimientos: Vigilante (producto entregable)

- [ ] **1.** Instalar el kiosco en el mini PC del Hard 014 en modo kiosco (pantalla completa, arranque automático, sin barra de navegador) apuntando a `/kiosco` con su `kioscoId` (por ejemplo `Paramericana-01`).
- [ ] **2.** Escáner de documentos: leer el PDF417 de la cédula y llenar solo nombre, número y fecha de nacimiento en el registro. Probar con 10 cédulas reales (antigua y digital).
- [ ] **3.** Foto en el registro con la cámara del kiosco, con dos políticas:
  - **Visitante temporal:** la foto se guarda con la visita y se borra al vencer la retención definida.
  - **Personal (empleados, residentes o estudiantes según el sitio):** se conserva su registro de validación (plantilla facial en el equipo o el hub, no la foto en claro) para que el reconocimiento funcione en cada ingreso.
- [ ] **4.** Videollamada y llamada de voz kiosco ↔ vigilante entre redes distintas con un TURN propio (coturn en la VM). **Objetivo: conecta en menos de 5 s en 10 de 10 intentos.**
- [ ] **5.** Lector de QR y tarjetas RFID reales: carnet vigente abre; vencido o desconocido no abre y muestra el motivo.
- [ ] **6.** Puerta con el relé real: abrir desde la solicitud aprobada y desde Accesos, máximo 15 s; una orden no se repite y el agente confirma cada orden con el servidor. Probar qué pasa si el relé no responde (el vigilante debe ver «NO se abrió»).
- [ ] **7.** Impresión real del carnet temporal, el sticker con QR y el ticket de turno en las impresoras del kiosco.
- [ ] **8.** Directorio de destinos cargado con los destinos reales de cada tipo de sitio: bodegas y oficinas, facultades y edificios (universidades), torres y apartamentos (residencias).
- [ ] **9.** Modo sin conexión: si se cae internet, el kiosco muestra el aviso y se pone al día al volver (pendiente `sync-service` del mockup). Además, documentar y probar la alternativa sin red: validar QR/RFID y rostros contra la lista local del hub, que se actualiza al reconectar, y registrar los ingresos en cola local.
- [ ] **10.** Cuentas reales: códigos de vigilante y administrador del sitio, quitando todos los códigos de prueba que siembra el `.env.example` (`2002`, `1234` y `9999`).
- [ ] **11.** Huella y reconocimiento facial en la portería: el videoportero reconoce el rostro y manda el ID al hub; en el kiosco, la foto se valida con la API de Nicolás (`POST /api/biometric/verify`). La huella se confirma en el teléfono con la app, o en el videoportero si el modelo comprado trae lector.

---

## 4. Requerimientos: Videoportero externo y cantonera

- [ ] **1.** **El hub decide, el equipo reconoce.** El videoportero solo identifica a la persona y envía el ID y la foto al hub; el hub decide con la lista de autorizados, horarios y turnos. El hub guarda esa lista localmente para seguir abriendo si se cae internet.
- [ ] **2.** **Una sola fuente de rostros.** Enrolar las plantillas faciales desde el hub por la API del equipo, para que nadie se registre dos veces (app, kiosco y videoportero usan el mismo registro de personas).
- [ ] **3.** **Medio alterno obligatorio (Ley 1581).** Nadie está obligado a dar su rostro. El equipo acepta tarjeta, PIN o QR (y huella si el modelo la trae), y portería puede abrir por videollamada. Los visitantes entran por llamada, sin enrolar su rostro.
- [ ] **4.** **Llamada del videoportero al puesto del vigilante.** El equipo usa SIP y el Vigilante usa WebRTC. Montar un puente SIP ↔ WebRTC (Asterisk o Janus) para que la llamada del videoportero entre al puesto del vigilante igual que la del kiosco, con video, audio y botón de abrir.
- [ ] **5.** **Apertura remota segura.** El relé o controlador que activa la cantonera queda del lado protegido de la puerta, nunca dentro del equipo de afuera (arrancar el equipo y puentear cables no debe abrir). El hub manda la orden al controlador; si se usa controlador de acceso, conexión por **OSDP** (no Wiegand, que va sin cifrar).
- [ ] **6.** **Sensor de puerta.** Alerta si la puerta queda abierta más del tiempo configurado o si se abre sin un acceso válido (puerta forzada), y alarma antisabotaje si alguien manipula el equipo.
- [ ] **7.** **Fail-safe o fail-secure por puerta.** En rutas de evacuación la cantonera debe ser *fail-safe* (abre si se va la energía) y liberarse con la alarma de incendio; *fail-secure* solo en bodegas o cuartos de alto valor que no sean salida. Validarlo con quien firme el diseño contra incendios y registrarlo por puerta en la administración.
- [ ] **8.** **Ciberseguridad del equipo.** HTTPS, cambio obligatorio de la clave de fábrica, firmware firmado y actualizable, P2P y nube del fabricante desactivados, logs por syslog hacia Centinela e instalación en una VLAN separada.
- [ ] **9.** **Piloto con una unidad antes de la compra grande.** El proveedor demuestra en vivo, en nuestra red y sin su nube, que se puede:
  - abrir desde el hub por la API,
  - recibir eventos y video por RTSP/ONVIF,
  - enrolar por API,
  - llamar por SIP al puesto del vigilante,
  - y que la detección de vida rechaza una foto impresa y una foto en pantalla.

  Se entrega **acta del piloto** con resultados.

---

## 5. Requerimientos: Software de cámaras (tu parte)

- [ ] **1.** En `/vigilante` → Cámaras, mostrar las cámaras de la portería y la del videoportero con el video que entrega el servicio de ingesta de Anderson (no conectarse directo a la cámara).
- [ ] **2.** Vista de 1, 4 y 9 cámaras, pantalla completa y estado de cada una (en línea, sin señal).
- [ ] **3.** Cámara del kiosco en vivo (ya existe por WebRTC) junto a las de la portería.
- [ ] **4.** Ver la grabación de una cámara en un rango de hora desde el puesto del vigilante.

---

## 6. Requerimientos: Argos (tu parte)

- [ ] **1.** Recibir en vivo los eventos de Argos en el puesto del vigilante: pitido, alerta en el Panel y registro en Novedades (comportamiento, falsos positivos, alertas de sensores, etc.).
- [ ] **2.** Desde la alerta, abrir la cámara del evento y su imagen.
- [ ] **3.** El vigilante marca la alerta como atendida o falsa alarma, con comentario; queda en el Historial y alimenta el entrenamiento controlado de Argos (Subida 1).
- [ ] **4.** Acciones automáticas de Argos, configurables por el administrador y cada una auditada:
  - **Automáticas:** crear la novedad, sonar la alerta, enfocar la cámara del evento en el puesto, escalar a la Torre si nadie atiende en 2 minutos.
  - **Apertura automática** solo cuando el rostro, la tarjeta o el QR están autorizados y es su horario.
  - **Con confirmación de portería:** abrir a distancia desde el Ojo o desde una alerta, y bloquear la puerta. **Argos nunca abre la puerta por sí solo en un caso dudoso.**
- [ ] **5.** Validación automática de conexión: Argos y el servidor revisan cada minuto que kiosco, videoportero, cámaras, impresora, lector, controlador y relé respondan, y crean la novedad si alguno falla.

---

## 7. Requerimientos: Administración (por encima del Entorno 2)

- [ ] **1.** Desde `/admin` y Consola general, configurar por sitio: tipo de sitio (oficinas o bodegas, universidad, residencia), destinos, cámaras, videoporteros, puertas (con su modo fail-safe o fail-secure), horarios y turnos de acceso, acciones automáticas de Argos y retención de fotos.
- [ ] **2.** Roles:
  - **Vigilante:** opera la portería.
  - **Administrador del sitio:** configura su sitio.
  - **Supervisor:** ve varios sitios desde la Torre.

---

## 8. Subida 2 a producción

- [ ] **1.** Desplegar en staging y hacer el recorrido completo con el hardware real: registro, llamada desde el kiosco y desde el videoportero, aprobación, carnet, huella, reconocimiento facial, tarjeta RFID, apertura de la cantonera y salida.
- [ ] **2.** Pruebas de la puerta: puerta forzada, puerta abierta demasiado tiempo, corte de energía (fail-safe o fail-secure según la puerta) y corte de internet (sigue abriendo con la lista local).
- [ ] **3.** PR a `main`, revisión antes de la subida y despliegue a producción (<https://centrodegestion.pgd.com.co>).
- [ ] **4.** Documentar en **Entrega 2** de `Proyecto-Vv`: manual de instalación del kiosco y del videoportero, conexión del hardware y de la cantonera, acta del piloto, manual del vigilante y manual del administrador.

---

## 9. Criterios de aceptación

- [ ] Un visitante puede registrarse con su cédula, pedir ingreso, ser aprobado, recibir su carnet impreso y entrar con la puerta real, sin pasos manuales fuera del sistema.
- [ ] Una persona del personal autorizada y en su horario entra por reconocimiento facial en el videoportero sin intervención; fuera de horario o sin coincidencia, no abre y se genera la alerta.
- [ ] Quien no quiere dar su rostro entra con tarjeta, PIN, QR o videollamada.
- [ ] La llamada desde el videoportero y desde el kiosco entra al puesto del vigilante, y conecta entre redes distintas en 10 de 10 intentos.
- [ ] Un QR o tarjeta inválida no abre la puerta y queda registrado; una puerta forzada genera alerta.
- [ ] Si se cae internet, la puerta sigue abriendo para los autorizados.
- [ ] El vigilante ve las cámaras y recibe las alertas de Argos en vivo; ninguna apertura a distancia ocurre sin confirmación de portería.
- [ ] No queda ningún código de prueba ni credencial en el repositorio, y el videoportero no tiene la clave de fábrica.
- [ ] **Aprobación de Dani.**

---

## 10. Por confirmar

- Modelo de videoportero, cantonera y controlador (después del piloto), y si el videoportero trae lector de huella.
- Qué puertas son ruta de evacuación (*fail-safe*) y cuáles *fail-secure*.
- Tiempo de retención de las fotos y registros de visitantes temporales (tema de datos personales).
