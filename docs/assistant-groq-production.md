# Asistente Groq en producción

La integración del chatbot utiliza `GROQ_API_KEY` como credencial privada del servidor.

Configuración por defecto:

- Proveedor: GroqCloud
- Modelo principal: `qwen/qwen3.6-27b`
- Modelo de respaldo: `openai/gpt-oss-20b`
- Entornos: Production y Preview

La clave nunca debe incorporarse al repositorio, al cliente web ni a registros de aplicación.
