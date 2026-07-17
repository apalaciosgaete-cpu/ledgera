# Pasarela externa de pagos

La conexión de billing queda preparada, pero permanece bloqueada hasta completar la habilitación legal y comercial.

## Interruptor de seguridad

```env
BILLING_LIVE_MODE=false
```

Mientras este valor no sea exactamente `true`:

- `/api/billing/checkout` no crea órdenes externas;
- `/api/billing/webhook` no procesa activaciones;
- no se realizan cargos;
- no se modifica el plan del usuario.

## Variables requeridas para el lanzamiento

```env
# flow | mercadopago | stripe
BILLING_PROVIDER=flow

# Endpoint del adaptador o servicio de checkout externo.
BILLING_GATEWAY_CHECKOUT_URL=https://gateway.example.com/checkouts

# Credencial privada del servicio externo.
BILLING_GATEWAY_API_KEY=

# Opcionales. Por defecto: authorization y Bearer.
BILLING_GATEWAY_AUTH_HEADER=authorization
BILLING_GATEWAY_AUTH_SCHEME=Bearer

# Secreto compartido para validar callbacks.
BILLING_WEBHOOK_SECRET=

# URL pública canónica de LEDGERA.
NEXT_PUBLIC_APP_URL=https://ledgera.cl
```

## Contrato de creación de checkout

LEDGERA envía un `POST` JSON a `BILLING_GATEWAY_CHECKOUT_URL` con:

- proveedor;
- identificador interno del pago;
- plan `PERSONAL` o `PROFESIONAL`;
- intervalo `MONTHLY` o `ANNUAL`;
- monto total, neto e IVA;
- moneda CLP;
- cliente;
- URL de éxito y cancelación;
- URL y secreto del webhook;
- metadatos de conciliación.

El servicio externo debe responder con una URL en alguno de estos campos:

- `paymentUrl`;
- `checkoutUrl`;
- `url`;
- `redirectUrl`;
- `initPoint` o `init_point`.

También puede devolver `checkoutId`, `sessionId`, `providerPaymentId`, `paymentId` o `transactionId`.

## Contrato de webhook

El callback debe enviarse a:

```text
POST https://ledgera.cl/api/billing/webhook
```

La autenticación puede viajar mediante:

```text
x-ledgera-webhook-secret: <BILLING_WEBHOOK_SECRET>
```

O mediante el parámetro `token` que LEDGERA agrega a la URL entregada al adaptador.

Eventos normalizados admitidos:

- `payment_succeeded`;
- `payment_failed`;
- `subscription_cancelled`.

La suscripción solo se activa después de `payment_succeeded`. El retorno del navegador nunca activa el plan por sí solo.

## Checklist previo a activar live

1. Validar términos y condiciones, política de cancelación y devoluciones.
2. Definir emisión de boleta/factura e IVA por tipo de plan.
3. Configurar credenciales exclusivamente en Vercel Production.
4. Confirmar que el proveedor preserve `paymentId`, plan e intervalo.
5. Probar pago aprobado, rechazado, duplicado y cancelado.
6. Verificar idempotencia del webhook.
7. Confirmar que Personal activa `PERSONAL` y Profesional activa `PROFESIONAL`.
8. Revisar logs y auditoría antes de establecer `BILLING_LIVE_MODE=true`.
