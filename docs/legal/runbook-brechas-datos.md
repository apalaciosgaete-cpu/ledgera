# Runbook — Notificación de brechas de datos personales (Ley N° 21.719)

> Procedimiento interno del responsable del tratamiento (Ledgera SpA) ante un
> incidente de seguridad que afecte datos personales. Base: deber de seguridad y
> notificación de la Ley N° 21.719.

## 1. Roles

- **EPD (Encargado de Protección de Datos):** `admin@ledgera.cl`. Coordina la respuesta y las notificaciones.
- **Responsable técnico de turno:** contiene el incidente y preserva evidencia.

## 2. Detección

Fuentes de detección:
- Alertas de **Sentry** (errores/anomalías en producción).
- Reportes de proveedores (Vercel, Cloudflare).
- Reportes de usuarios o terceros a `admin@ledgera.cl`.
- Hallazgos en logs de auditoría internos.

## 3. Clasificación y evaluación de riesgo

Al detectar un posible incidente, el EPD evalúa en las primeras horas:

1. **¿Hay datos personales involucrados?** (identificación, financieros, tributarios, credenciales).
2. **Naturaleza y volumen:** cuántos titulares y qué categorías.
3. **Probabilidad de daño** para los derechos de los titulares (robo de identidad, fraude, exposición financiera).
4. **Estado:** ¿contenido, en curso, recurrente?

Registrar todo en el **registro de incidentes** (fecha/hora, descripción, alcance, decisiones).

## 4. Contención

- Revocar credenciales/sesiones comprometidas.
- Rotar claves de cifrado (`LEDGERA_ENCRYPTION_KEY`) y secretos si aplica.
- Aislar el componente afectado; aplicar parche.
- Preservar evidencia (logs, trazas) para el informe.

## 5. Notificación

Si la evaluación indica riesgo para los derechos de los titulares:

- **A la Agencia de Protección de Datos Personales** (o, transitoriamente, al Consejo para la Transparencia): sin dilación indebida desde que se toma conocimiento, con la información exigida por la Ley (naturaleza, categorías y número aproximado de afectados, consecuencias probables, medidas adoptadas).
- **A los titulares afectados:** cuando el riesgo sea alto, en lenguaje claro, indicando qué pasó, qué datos, qué medidas tomar y el contacto del EPD.

> Plantillas de notificación: mantener borradores pre-aprobados para acelerar el envío.

## 6. Cierre y aprendizaje

- Documentar causa raíz y medidas correctivas permanentes.
- Actualizar este runbook y el Registro de Actividades de Tratamiento si cambian flujos.
- Revisión post-incidente con el equipo.

## 7. Registro de incidentes (formato)

| Fecha | Detección | Categorías de datos | N° titulares | Riesgo | Notificado (Agencia/Titulares) | Estado | Responsable |
|-------|-----------|---------------------|--------------|--------|-------------------------------|--------|-------------|
|       |           |                     |              |        |                               |        |             |
