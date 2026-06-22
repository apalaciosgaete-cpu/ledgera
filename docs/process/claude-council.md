# Claude Council para LEDGERA

## Estado

Referencia evaluada y documentada para el proceso de desarrollo de LEDGERA.

Repositorio externo:

```text
https://github.com/hex/claude-council
```

No se incorpora como dependencia runtime de LEDGERA. Se documenta como herramienta externa de revisión para decisiones de alto impacto.

---

## Qué es

Claude Council es un plugin para Claude Code que consulta múltiples agentes/modelos en paralelo y presenta respuestas comparadas lado a lado. Según su documentación pública, soporta proveedores como Gemini, OpenAI/Codex, Grok y Perplexity; incluye roles especializados, modo debate, análisis con agentes y exportación a Markdown.

Uso previsto en LEDGERA:

```text
Revisión multi-perspectiva antes de decisiones críticas.
```

No reemplaza revisión humana, pruebas, typecheck, build, seguridad ni criterio de producto.

---

## Compatibilidad con LEDGERA

LEDGERA usa:

```text
Next.js App Router
TypeScript strict
Prisma
PostgreSQL
Tailwind / estilos propios
Arquitectura modular src/modules/*
Dominio financiero-tributario Chile/SII
```

Claude Council no se integra al código productivo, por lo que no afecta:

```text
runtime
bundle
build
base de datos
seguridad de sesión
middleware
Prisma schema
```

Compatibilidad recomendada:

```text
Sí, como herramienta de proceso.
No, como dependencia directa del producto.
```

---

## Cuándo se invoca

### 1. Arquitectura

Usar cuando se decida:

```text
nuevos módulos
refactors transversales
cambios de estructura de carpetas
cambios en modelo de datos
patrones de API
separación de capas
```

Ejemplo:

```text
¿Conviene mover Seguridad a Configuración y eliminar /seguridad como sección principal?
```

Roles sugeridos:

```text
architecture
maintainability
simplicity
scalability
```

---

### 2. UX / Producto

Usar cuando una pantalla tenga riesgo de confusión o exceso de módulos visibles.

Casos típicos:

```text
Centro Tributario
Centro de Auditoría
Configuración / Mi cuenta
Onboarding
Navegación principal
Planes y facturación
```

Pregunta estándar:

```text
¿Esta pantalla responde qué debe hacer el usuario en menos de 5 segundos o solo muestra módulos internos?
```

Roles sugeridos:

```text
simplicity
devil
dx
maintainability
```

---

### 3. Seguridad

Usar antes de cambios en:

```text
autenticación
2FA
sesiones
CSRF
CSP
rate limiting
admin
billing
webhooks
permisos por rol
permisos por plan
```

Roles sugeridos:

```text
security
compliance
devil
maintainability
```

Regla LEDGERA:

```text
Toda decisión de seguridad debe preservar 2FA obligatorio, sesiones protegidas, trazabilidad y principio de mínimo privilegio.
```

---

### 4. Roadmap

Usar cuando existan varias rutas posibles y riesgo de dispersión.

Casos:

```text
Capa 4 Operación SaaS
Capa 5 Integraciones
Billing
Exchanges
Bancos
Soporte operacional
Escalabilidad B2B
```

Roles sugeridos:

```text
architecture
scalability
simplicity
devil
```

---

## Cuándo NO se invoca

No usar para:

```text
cambios pequeños de texto
ajustes visuales menores
correcciones obvias de rutas
bugs con causa ya identificada
commits mecánicos
cambios que no afectan arquitectura, UX, seguridad o roadmap
```

---

## Flujo operacional

Antes de invocar:

```text
1. Revisar GitHub.
2. Confirmar archivos reales.
3. Identificar el problema concreto.
4. Formular una pregunta cerrada.
5. Definir qué decisión debe salir del análisis.
```

Después de invocar:

```text
1. Leer consenso y discrepancias.
2. No aceptar recomendaciones sin validar contra reglas LEDGERA.
3. Convertir conclusión en un bloque de ejecución.
4. Versionar decisión si afecta arquitectura o roadmap.
5. Ejecutar typecheck y build después del cambio.
```

---

## Formato de decisión recomendado

```text
Decisión:
Contexto:
Opciones evaluadas:
Recomendación:
Riesgos:
Impacto en LEDGERA:
Archivos afectados:
Criterio de terminado:
```

---

## Instalación local opcional

Documentación pública del repositorio indica instalación vía Claude Code plugin marketplace o directa desde GitHub.

Opciones documentadas por el proyecto externo:

```text
/plugin marketplace add hex/claude-marketplace
/plugin install claude-council
```

O instalación directa:

```text
/plugin install hex/claude-council
```

Configuración de proveedores vía variables de entorno:

```text
OPENAI_API_KEY
GEMINI_API_KEY
XAI_API_KEY
PERPLEXITY_API_KEY
```

También puede usar CLIs como Codex o Gemini si están disponibles en PATH.

---

## Reglas específicas para LEDGERA

Claude Council puede sugerir, pero LEDGERA mantiene estas reglas superiores:

```text
No saldos manuales.
Todo deriva desde movimientos.
FIFO obligatorio.
Trazabilidad completa.
UI visible en español.
No duplicar lógica.
No abrir frentes sin cerrar bloques.
No tocar layout global si el cambio es local.
No introducir dependencias runtime sin justificación.
No exponer secretos ni credenciales.
```

---

## Uso sugerido inmediato

Aplicar esta herramienta al próximo bloque crítico de UX:

```text
v0.2.0.11 — Simplificación Centro Tributario
v0.3.0.11 — Simplificación Centro Auditoría
Reordenamiento Configuración / Mi cuenta / Seguridad / Facturación
```

Pregunta recomendada:

```text
¿Cómo reducimos carga cognitiva y convertimos esta pantalla desde un índice de módulos a una pantalla de decisión clara para un usuario no técnico?
```

---

## Conclusión

Claude Council queda adoptado como herramienta externa de revisión estratégica para LEDGERA, no como dependencia del producto.

Debe utilizarse para decisiones de alto impacto en arquitectura, UX, seguridad y roadmap, especialmente cuando exista riesgo de sobreingeniería, duplicidad funcional o pérdida de claridad para el usuario final.
