# Registro de Actividades de Tratamiento (RAT) — Ledgera SpA

> Inventario de tratamientos de datos personales del responsable, exigido por la
> Ley N° 21.719. Debe mantenerse actualizado cuando cambian flujos, finalidades o
> proveedores.

- **Responsable del tratamiento:** Ledgera SpA — Región Metropolitana, Chile.
- **EPD:** `admin@ledgera.cl` (asunto: "Protección de datos").
- **Última actualización:** 2026-06-23.

## Actividades

| # | Tratamiento | Finalidad | Base jurídica (Ley 21.719) | Categorías de datos | Titulares | Destinatarios / Encargados | Transferencia internacional | Conservación |
|---|-------------|-----------|----------------------------|---------------------|-----------|----------------------------|-----------------------------|--------------|
| 1 | Registro y autenticación | Crear y operar la cuenta, control de acceso, 2FA | Ejecución de contrato (Art. 8 b); interés legítimo (f) | Identificación, acceso/seguridad (hash, semilla 2FA cifrada) | Usuarios | Vercel (hosting), Cloudflare (CDN) | EE.UU. (DPA + cláusulas tipo) | Vigencia + 5 años |
| 2 | Gestión tributaria de cripto | Importar movimientos, calcular FIFO, PnL, generar informes | Ejecución de contrato (Art. 8 b); obligación legal (c) | Tributarios/financieros, uso de plataforma | Usuarios | Vercel, Cloudflare; SII/UAF (receptor legal) | EE.UU. (DPA) | Vigencia + 5/6 años (Art. 200 C. Tributario) |
| 3 | Conexión con exchanges | Sincronizar operaciones desde Binance/Buda u otros | Ejecución de contrato (Art. 8 b); consentimiento (a) | Credenciales API (cifradas AES-256-GCM), movimientos | Usuarios | Vercel, Cloudflare; exchanges (origen) | EE.UU. (DPA) | Hasta desconexión / cierre de cuenta |
| 4 | Facturación y suscripción | Cobro de planes, gestión de pagos | Ejecución de contrato (Art. 8 b) | Estado de suscripción, historial de pagos (no tarjetas) | Usuarios | Procesador de pagos | Según procesador | Vigencia + 7 años |
| 5 | Auditoría y seguridad | Trazabilidad, prevención de fraude, integridad | Interés legítimo (Art. 8 f); obligación legal (c) | Datos técnicos/red (IP, UA), logs de eventos | Usuarios | Sentry (monitoreo de errores) | EE.UU. | Logs: vigencia + 5 años; técnicos: 12 meses |
| 6 | Analítica de producto | Mejora del servicio con métricas | Consentimiento (Art. 8 a) | Uso de plataforma (con consentimiento) | Usuarios | PostHog, Vercel Analytics, GA | EE.UU. | Según proveedor |
| 7 | Comunicaciones de marketing | Novedades opcionales | Consentimiento revocable (Art. 8 a) | Email | Usuarios suscritos | Resend (email) | EE.UU. | Hasta retiro del consentimiento |

## Derechos del titular — operativa

- **Acceso / Portabilidad (Art. 11):** autoservicio in-app `Configuración → Perfil → Privacidad y mis datos → Exportar mis datos` (JSON). También por `admin@ledgera.cl`.
- **Rectificación (Art. 9):** in-app `Configuración → Perfil`.
- **Supresión (Art. 9):** autoservicio in-app `Eliminar mi cuenta` (anonimización con retención tributaria). También por correo.
- **Oposición / Limitación / Revisión de decisiones automatizadas:** vía EPD (`admin@ledgera.cl`).

## Medidas de seguridad (resumen)

- Cifrado en tránsito (TLS) y de secretos en reposo (AES-256-GCM: credenciales de exchange y semilla 2FA).
- Contraseñas con hash bcrypt.
- 2FA disponible; logs de auditoría; control de acceso interno mínimo.
- Proveedores con certificaciones (SOC 2 / ISO 27001).
